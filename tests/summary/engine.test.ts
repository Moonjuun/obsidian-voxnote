import { describe, expect, it } from 'vitest';
import {
	buildGeminiPrompt,
	buildSummaryFrontmatter,
	buildSystemPlaceholders,
	composeSummaryFile,
	escapeYaml,
	normalizeListNewlines,
	renderBody,
	stripHtmlComments,
} from '../../src/summary/engine';
import type { TemplateMeta } from '../../src/summary/template-loader';

function mkTemplate(overrides: Partial<TemplateMeta> = {}): TemplateMeta {
	return {
		name: '회의록',
		favorite: true,
		prompt: 'Summarize the meeting.',
		placeholders: { summary: 'core', decisions: 'list' },
		body: '## Summary\n{{summary}}\n\n## Decisions\n{{decisions}}\n\n## Source\n{{source}}',
		filename: 'meeting.md',
		path: 'Templates/meeting.md',
		...overrides,
	};
}

const fixedNow = new Date('2026-05-14T14:30:00');

describe('buildSystemPlaceholders', () => {
	it('formats date and datetime', () => {
		const s = buildSystemPlaceholders({
			transcript: 'hi',
			title: 'Meeting',
			sourcePath: 'STT/Meeting.md',
			language: 'ko',
			now: fixedNow,
		});
		expect(s.date).toBe('2026-05-14');
		expect(s.datetime).toBe('2026-05-14 14:30');
		expect(s.source).toBe('[[STT/Meeting.md]]');
	});

	it('formats duration with hours when needed', () => {
		const s = buildSystemPlaceholders({
			transcript: '',
			title: 't',
			sourcePath: 'x',
			language: 'en',
			durationSeconds: 3725,
			now: fixedNow,
		});
		expect(s.duration).toBe('1:02:05');
	});

	it('formats short duration without hours', () => {
		const s = buildSystemPlaceholders({
			transcript: '',
			title: 't',
			sourcePath: 'x',
			language: 'en',
			durationSeconds: 65,
			now: fixedNow,
		});
		expect(s.duration).toBe('1:05');
	});

	it('joins speakers with comma', () => {
		const s = buildSystemPlaceholders({
			transcript: '',
			title: 't',
			sourcePath: 'x',
			language: 'en',
			speakers: ['Speaker 1', 'Speaker 2'],
			now: fixedNow,
		});
		expect(s.speakers).toBe('Speaker 1, Speaker 2');
	});

	it('uses empty source when sourcePath is empty', () => {
		const s = buildSystemPlaceholders({
			transcript: '',
			title: 't',
			sourcePath: '',
			language: 'en',
			now: fixedNow,
		});
		expect(s.source).toBe('');
	});
});

describe('stripHtmlComments', () => {
	it('removes a single-line comment', () => {
		expect(stripHtmlComments('<!-- hi --> body')).toBe('body');
	});

	it('removes a multi-line comment', () => {
		const input = '<!--\n  guide block\n  {{transcript}} - placeholder\n-->\n\n# Title';
		expect(stripHtmlComments(input)).toBe('# Title');
	});

	it('collapses 3+ consecutive newlines', () => {
		expect(stripHtmlComments('a\n\n\n\nb')).toBe('a\n\nb');
	});

	it('leaves content without comments untouched', () => {
		expect(stripHtmlComments('a\n\nb')).toBe('a\n\nb');
	});
});

describe('normalizeListNewlines', () => {
	it('splits inline bullets joined by ".- "', () => {
		const input = '- A.- B.- C';
		expect(normalizeListNewlines(input)).toBe('- A.\n- B.\n- C');
	});

	it('splits inline checkboxes joined by ".- [ ] "', () => {
		const input = '- [ ] A.- [ ] B.- [ ] C';
		expect(normalizeListNewlines(input)).toBe('- [ ] A.\n- [ ] B.\n- [ ] C');
	});

	it('splits inline blockquotes joined by ".> "', () => {
		const input = '> A quote.> Another quote.';
		expect(normalizeListNewlines(input)).toBe('> A quote.\n> Another quote.');
	});

	it('is idempotent on already-newlined lists', () => {
		const input = '- A\n- B\n- C';
		expect(normalizeListNewlines(input)).toBe('- A\n- B\n- C');
	});

	it('handles Korean noun-form endings without trailing period (함, 됨, 임, 중)', () => {
		const input = '- 변동사항 공유됨- VNTG 가치 추진 중- BVC 전환 결정함';
		expect(normalizeListNewlines(input)).toBe(
			'- 변동사항 공유됨\n- VNTG 가치 추진 중\n- BVC 전환 결정함',
		);
	});

	it('handles Korean sentences ending in period before bullet', () => {
		const input = '- 포함됩니다.- VNTG는 핵심 가치를 삼습니다.- 회사는 BVC 추진합니다.';
		expect(normalizeListNewlines(input)).toBe(
			'- 포함됩니다.\n- VNTG는 핵심 가치를 삼습니다.\n- 회사는 BVC 추진합니다.',
		);
	});

	it('handles mixed punctuation (?, !, ;)', () => {
		expect(normalizeListNewlines('- Question?- Answer!- Note;- End')).toBe(
			'- Question?\n- Answer!\n- Note;\n- End',
		);
	});

	it('returns empty string unchanged', () => {
		expect(normalizeListNewlines('')).toBe('');
	});

	it('does not split a single in-sentence dash', () => {
		const input = 'Speakers met to discuss B2B-B2C migration plans.';
		expect(normalizeListNewlines(input)).toBe(input);
	});
});

describe('renderBody', () => {
	const system = buildSystemPlaceholders({
		transcript: 'TRANSCRIPT',
		title: 'My meeting',
		sourcePath: 'STT/foo.md',
		language: 'ko',
		now: fixedNow,
	});

	it('substitutes AI placeholders', () => {
		const out = renderBody(mkTemplate(), system, {
			summary: 'concise core',
			decisions: '- ship it',
		});
		expect(out).toContain('## Summary\nconcise core');
		expect(out).toContain('## Decisions\n- ship it');
	});

	it('substitutes system placeholders', () => {
		const out = renderBody(mkTemplate(), system, { summary: '', decisions: '' });
		expect(out).toContain('[[STT/foo.md]]');
	});

	it('leaves unknown placeholders untouched', () => {
		const tpl = mkTemplate({ body: 'hello {{unknown}} world' });
		const out = renderBody(tpl, system, {});
		expect(out).toBe('hello {{unknown}} world');
	});

	it('does not recursively substitute (AI value with token-like text is preserved literally)', () => {
		const tpl = mkTemplate({ body: '{{summary}}' });
		const out = renderBody(tpl, system, { summary: '{{transcript}}' });
		expect(out).toBe('{{transcript}}');
	});

	it('AI placeholder overrides system placeholder with same name', () => {
		const tpl = mkTemplate({ body: '{{title}}' });
		const out = renderBody(tpl, system, { title: 'from ai' });
		expect(out).toBe('from ai');
	});

	it('normalizes inline-joined bullets in AI values before substitution', () => {
		const tpl = mkTemplate({ body: '{{summary}}' });
		const out = renderBody(tpl, system, {
			summary: '- A.- B.- C',
			decisions: '',
		});
		expect(out).toBe('- A.\n- B.\n- C');
	});

	it('strips HTML comments before substitution (no transcript leak in docs)', () => {
		const tpl = mkTemplate({
			body: '<!--\n  System placeholder docs:\n    {{transcript}} - full STT\n-->\n\n## Summary\n{{summary}}',
		});
		const out = renderBody(tpl, system, { summary: 'S', decisions: '' });
		expect(out).not.toContain('TRANSCRIPT');
		expect(out).not.toContain('<!--');
		expect(out).toContain('## Summary\nS');
	});
});

describe('buildSummaryFrontmatter', () => {
	const system = buildSystemPlaceholders({
		transcript: '',
		title: 'Meeting',
		sourcePath: 'STT/Meeting.md',
		language: 'ko',
		now: fixedNow,
	});

	it('includes source backlink', () => {
		const fm = buildSummaryFrontmatter(mkTemplate(), system);
		expect(fm).toContain('source: "[[STT/Meeting.md]]"');
	});

	it('includes template name escaped', () => {
		const fm = buildSummaryFrontmatter(mkTemplate({ name: 'Has "quote"' }), system);
		expect(fm).toContain('template: "Has \\"quote\\""');
	});

	it('starts and ends with --- delimiters', () => {
		const fm = buildSummaryFrontmatter(mkTemplate(), system);
		expect(fm.startsWith('---\n')).toBe(true);
		expect(fm).toContain('\n---\n');
	});

	it('omits source line when sourcePath empty', () => {
		const noSource = buildSystemPlaceholders({
			transcript: '',
			title: 't',
			sourcePath: '',
			language: 'ko',
			now: fixedNow,
		});
		const fm = buildSummaryFrontmatter(mkTemplate(), noSource);
		expect(fm).not.toContain('source:');
	});
});

describe('composeSummaryFile', () => {
	it('combines frontmatter + rendered body', () => {
		const system = buildSystemPlaceholders({
			transcript: '',
			title: 't',
			sourcePath: 'STT/t.md',
			language: 'ko',
			now: fixedNow,
		});
		const out = composeSummaryFile(mkTemplate(), system, {
			summary: 'S',
			decisions: 'D',
		});
		expect(out.startsWith('---\n')).toBe(true);
		expect(out).toContain('## Summary\nS');
		expect(out).toContain('## Decisions\nD');
	});
});

describe('buildGeminiPrompt', () => {
	const system = buildSystemPlaceholders({
		transcript: 'TRANSCRIPT_TEXT',
		title: 't',
		sourcePath: 'x',
		language: 'ko',
		now: fixedNow,
	});

	it('appends language instruction', () => {
		const { systemPrompt } = buildGeminiPrompt(mkTemplate(), system, 'Korean');
		expect(systemPrompt).toContain('Respond in Korean.');
	});

	it('skips language instruction when empty', () => {
		const { systemPrompt } = buildGeminiPrompt(mkTemplate(), system, '');
		expect(systemPrompt).not.toContain('Respond in');
	});

	it('includes placeholder hints', () => {
		const { systemPrompt } = buildGeminiPrompt(mkTemplate(), system, 'English');
		expect(systemPrompt).toContain('- summary: core');
		expect(systemPrompt).toContain('- decisions: list');
	});

	it('userContent is the transcript', () => {
		const { userContent } = buildGeminiPrompt(mkTemplate(), system, 'English');
		expect(userContent).toBe('TRANSCRIPT_TEXT');
	});

	it('includes universal formatting rule demanding one item per line', () => {
		const { systemPrompt } = buildGeminiPrompt(mkTemplate(), system, 'Korean');
		expect(systemPrompt).toContain('FORMATTING RULES');
		expect(systemPrompt).toMatch(/real newline character/i);
		expect(systemPrompt).toContain('- item one\\n- item two');
	});
});

describe('escapeYaml', () => {
	it('escapes backslashes and quotes', () => {
		expect(escapeYaml('a "b" \\c')).toBe('a \\"b\\" \\\\c');
	});
});
