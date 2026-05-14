import { describe, expect, it } from 'vitest';
import {
	buildGeminiPrompt,
	buildSummaryFrontmatter,
	buildSystemPlaceholders,
	composeSummaryFile,
	escapeYaml,
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
});

describe('escapeYaml', () => {
	it('escapes backslashes and quotes', () => {
		expect(escapeYaml('a "b" \\c')).toBe('a \\"b\\" \\\\c');
	});
});
