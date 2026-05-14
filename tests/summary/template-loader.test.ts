import { describe, expect, it, vi } from 'vitest';

vi.mock('obsidian', () => {
	class TFile {
		name = '';
		path = '';
		extension = '';
	}
	class TFolder {
		children: unknown[] = [];
	}
	return {
		TFile,
		TFolder,
		parseYaml: (raw: string) => JSON.parse(raw),
		normalizePath: (p: string) => p.replace(/\\+/g, '/').replace(/\/+/g, '/'),
	};
});

import {
	interpretTemplate,
	parseTemplate,
	splitFrontmatter,
	sortTemplates,
	type TemplateMeta,
} from '../../src/summary/template-loader';

describe('splitFrontmatter', () => {
	it('extracts yaml and body', () => {
		const raw = '---\nname: hi\n---\nbody text';
		const out = splitFrontmatter(raw);
		expect(out?.yaml).toBe('name: hi');
		expect(out?.body).toBe('body text');
	});

	it('returns null when no frontmatter', () => {
		expect(splitFrontmatter('just text')).toBeNull();
	});

	it('handles empty body', () => {
		const out = splitFrontmatter('---\nkey: val\n---\n');
		expect(out?.body).toBe('');
	});

	it('handles CRLF line endings', () => {
		const out = splitFrontmatter('---\r\nname: x\r\n---\r\nbody');
		expect(out?.yaml).toBe('name: x');
		expect(out?.body).toBe('body');
	});
});

describe('interpretTemplate', () => {
	it('returns meta on full input', () => {
		const meta = interpretTemplate(
			{
				name: '회의록',
				favorite: true,
				prompt: 'summarize',
				placeholders: { summary: 'core', decisions: 'list' },
			},
			'## body',
			'meeting.md',
			'Templates/meeting.md',
		);
		expect(meta).toMatchObject({
			name: '회의록',
			favorite: true,
			prompt: 'summarize',
			placeholders: { summary: 'core', decisions: 'list' },
			body: '## body',
		});
	});

	it('falls back name to filename without extension', () => {
		const meta = interpretTemplate(
			{ prompt: 'p', placeholders: { a: '' } },
			'',
			'meeting.md',
			'Templates/meeting.md',
		);
		expect(meta?.name).toBe('meeting');
	});

	it('returns null when prompt is missing', () => {
		const meta = interpretTemplate(
			{ placeholders: { a: '' } },
			'',
			'x.md',
			'x.md',
		);
		expect(meta).toBeNull();
	});

	it('returns null when placeholders are missing', () => {
		const meta = interpretTemplate({ prompt: 'p' }, '', 'x.md', 'x.md');
		expect(meta).toBeNull();
	});

	it('returns null for non-object input', () => {
		expect(interpretTemplate('string', '', 'x.md', 'x.md')).toBeNull();
		expect(interpretTemplate(null, '', 'x.md', 'x.md')).toBeNull();
		expect(interpretTemplate(undefined, '', 'x.md', 'x.md')).toBeNull();
	});

	it('coerces non-string placeholder descriptions to strings', () => {
		const meta = interpretTemplate(
			{
				prompt: 'p',
				placeholders: { a: 42, b: null, c: undefined, d: 'hi' },
			},
			'',
			'x.md',
			'x.md',
		);
		expect(meta?.placeholders).toEqual({ a: '42', b: '', c: '', d: 'hi' });
	});

	it('treats favorite as false unless strictly true', () => {
		const meta1 = interpretTemplate(
			{ prompt: 'p', placeholders: { a: '' }, favorite: 'true' },
			'',
			'x.md',
			'x.md',
		);
		expect(meta1?.favorite).toBe(false);
		const meta2 = interpretTemplate(
			{ prompt: 'p', placeholders: { a: '' }, favorite: 1 },
			'',
			'x.md',
			'x.md',
		);
		expect(meta2?.favorite).toBe(false);
	});

	it('captures optional language', () => {
		const meta = interpretTemplate(
			{ prompt: 'p', placeholders: { a: '' }, language: 'ko' },
			'',
			'x.md',
			'x.md',
		);
		expect(meta?.language).toBe('ko');
	});
});

describe('parseTemplate', () => {
	const fakeYaml = (raw: string): unknown => {
		const out: Record<string, unknown> = {};
		const lines = raw.split('\n');
		let i = 0;
		while (i < lines.length) {
			const line = lines[i] ?? '';
			i++;
			if (!line.trim()) continue;
			const m = line.match(/^(\w+):\s*(.*)$/);
			if (!m) continue;
			const key = m[1] as string;
			const value = (m[2] as string).trim();
			if (value === '') {
				const sub: Record<string, string> = {};
				while (i < lines.length && /^\s+\w+:/.test(lines[i] ?? '')) {
					const subm = (lines[i] as string).match(/^\s+(\w+):\s*(.*)$/);
					i++;
					if (!subm) continue;
					sub[subm[1] as string] = ((subm[2] as string) ?? '').trim().replace(/^"|"$/g, '');
				}
				out[key] = sub;
			} else if (value === 'true' || value === 'false') {
				out[key] = value === 'true';
			} else {
				out[key] = value.replace(/^"|"$/g, '');
			}
		}
		return out;
	};

	it('parses a full template file', () => {
		const raw =
			'---\nname: 회의록\nfavorite: true\nprompt: "p"\nplaceholders:\n  summary: "core"\n  decisions: "list"\n---\nbody';
		const meta = parseTemplate(raw, 'meeting.md', 'Templates/meeting.md', fakeYaml);
		expect(meta?.name).toBe('회의록');
		expect(meta?.favorite).toBe(true);
		expect(meta?.placeholders).toEqual({ summary: 'core', decisions: 'list' });
		expect(meta?.body).toBe('body');
	});

	it('returns null on missing frontmatter', () => {
		expect(parseTemplate('no frontmatter', 'x.md', 'x.md', fakeYaml)).toBeNull();
	});

	it('returns null when YAML parser throws', () => {
		const broken: typeof fakeYaml = () => {
			throw new Error('bad yaml');
		};
		const raw = '---\ngarbage\n---\nbody';
		expect(parseTemplate(raw, 'x.md', 'x.md', broken)).toBeNull();
	});
});

describe('sortTemplates', () => {
	function mk(name: string, favorite: boolean): TemplateMeta {
		return {
			name,
			favorite,
			prompt: 'p',
			placeholders: { a: '' },
			body: '',
			filename: `${name}.md`,
			path: `Templates/${name}.md`,
		};
	}

	it('places favorites before non-favorites', () => {
		const sorted = sortTemplates([mk('b', false), mk('a', true), mk('c', false), mk('d', true)]);
		expect(sorted.map((t) => t.name)).toEqual(['a', 'd', 'b', 'c']);
	});

	it('alphabetizes within each group', () => {
		const sorted = sortTemplates([
			mk('Charlie', true),
			mk('alpha', false),
			mk('beta', true),
		]);
		expect(sorted.map((t) => t.name)).toEqual(['beta', 'Charlie', 'alpha']);
	});

	it('returns empty array for empty input', () => {
		expect(sortTemplates([])).toEqual([]);
	});
});
