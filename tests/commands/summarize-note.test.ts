import { describe, expect, it, vi } from 'vitest';

vi.mock('obsidian', () => ({
	normalizePath: (p: string) => p.replace(/\\+/g, '/').replace(/\/+/g, '/'),
}));

import {
	ensureFolder,
	extractTranscriptFromMarkdown,
	resolveSummaryPath,
	runSummary,
	sanitizeFilename,
} from '../../src/summary/runner';
import type { SummaryProvider } from '../../src/providers/types';
import type { TemplateMeta } from '../../src/summary/template-loader';

interface FakeApp {
	vault: {
		create: ReturnType<typeof vi.fn>;
		createFolder: ReturnType<typeof vi.fn>;
		adapter: {
			exists: ReturnType<typeof vi.fn>;
		};
	};
}

function makeApp(existingPaths: string[] = []): FakeApp {
	const existing = new Set(existingPaths);
	return {
		vault: {
			create: vi.fn(),
			createFolder: vi.fn().mockImplementation(async (p: string) => {
				existing.add(p);
			}),
			adapter: {
				exists: vi.fn().mockImplementation(async (p: string) => existing.has(p)),
			},
		},
	};
}

function makeTemplate(): TemplateMeta {
	return {
		name: '회의록',
		favorite: true,
		prompt: 'summarize',
		placeholders: { summary: '', decisions: '' },
		body: '## Summary\n{{summary}}\n\n## Decisions\n{{decisions}}',
		filename: 'meeting.md',
		path: 'Templates/meeting.md',
	};
}

function makeProvider(returnValue: Record<string, string>): SummaryProvider {
	return {
		id: 'fake',
		generate: vi.fn().mockResolvedValue(returnValue),
	};
}

describe('sanitizeFilename', () => {
	it('replaces unsafe chars', () => {
		expect(sanitizeFilename('a/b:c*d?e"f<g>h|i')).toBe('a_b_c_d_e_f_g_h_i');
	});

	it('falls back to untitled for empty', () => {
		expect(sanitizeFilename('   ')).toBe('untitled');
		expect(sanitizeFilename('')).toBe('untitled');
	});
});

describe('extractTranscriptFromMarkdown', () => {
	it('strips frontmatter', () => {
		const raw = '---\nkey: v\n---\nbody text';
		expect(extractTranscriptFromMarkdown(raw)).toBe('body text');
	});

	it('returns trimmed content when no frontmatter', () => {
		expect(extractTranscriptFromMarkdown('  just text  ')).toBe('just text');
	});
});

describe('resolveSummaryPath', () => {
	it('uses {title} (요약).md inside summaries folder', async () => {
		const app = makeApp();
		const path = await resolveSummaryPath(
			app as unknown as Parameters<typeof resolveSummaryPath>[0],
			'ObsiDeep/AI-Summaries',
			'My Meeting',
		);
		expect(path).toBe('ObsiDeep/AI-Summaries/My Meeting (요약).md');
	});

	it('adds (2) suffix on collision', async () => {
		const app = makeApp(['ObsiDeep/AI-Summaries/Foo (요약).md']);
		const path = await resolveSummaryPath(
			app as unknown as Parameters<typeof resolveSummaryPath>[0],
			'ObsiDeep/AI-Summaries',
			'Foo',
		);
		expect(path).toBe('ObsiDeep/AI-Summaries/Foo (요약) (2).md');
	});

	it('increments counter to (3) on double collision', async () => {
		const app = makeApp([
			'ObsiDeep/AI-Summaries/Foo (요약).md',
			'ObsiDeep/AI-Summaries/Foo (요약) (2).md',
		]);
		const path = await resolveSummaryPath(
			app as unknown as Parameters<typeof resolveSummaryPath>[0],
			'ObsiDeep/AI-Summaries',
			'Foo',
		);
		expect(path).toBe('ObsiDeep/AI-Summaries/Foo (요약) (3).md');
	});
});

describe('ensureFolder', () => {
	it('creates folder when missing', async () => {
		const app = makeApp();
		await ensureFolder(
			app as unknown as Parameters<typeof ensureFolder>[0],
			'a/b/c/file.md',
		);
		expect(app.vault.createFolder).toHaveBeenCalledWith('a/b/c');
	});

	it('does not create folder when it exists', async () => {
		const app = makeApp(['a/b']);
		await ensureFolder(
			app as unknown as Parameters<typeof ensureFolder>[0],
			'a/b/file.md',
		);
		expect(app.vault.createFolder).not.toHaveBeenCalled();
	});
});

describe('runSummary', () => {
	it('generates and writes summary file', async () => {
		const app = makeApp();
		const provider = makeProvider({ summary: 'S', decisions: 'D' });
		const result = await runSummary(
			app as unknown as Parameters<typeof runSummary>[0],
			provider,
			'ObsiDeep/AI-Summaries',
			{
				template: makeTemplate(),
				transcript: 'TRANSCRIPT',
				title: 'Meeting',
				sourcePath: 'ObsiDeep/STT/Meeting.md',
				uiLanguageLabel: 'Korean',
				now: new Date('2026-05-14T14:30:00'),
			},
		);
		expect(result.path).toBe('ObsiDeep/AI-Summaries/Meeting (요약).md');
		expect(result.content).toContain('## Summary\nS');
		expect(result.content).toContain('## Decisions\nD');
		expect(result.content).toContain('source: "[[ObsiDeep/STT/Meeting.md]]"');
		expect(app.vault.create).toHaveBeenCalledWith(result.path, result.content);
	});

	it('auto-creates summaries folder', async () => {
		const app = makeApp();
		const provider = makeProvider({ summary: 's', decisions: 'd' });
		await runSummary(
			app as unknown as Parameters<typeof runSummary>[0],
			provider,
			'ObsiDeep/AI-Summaries',
			{
				template: makeTemplate(),
				transcript: 'x',
				title: 'T',
				sourcePath: 'p',
				uiLanguageLabel: 'English',
			},
		);
		expect(app.vault.createFolder).toHaveBeenCalledWith('ObsiDeep/AI-Summaries');
	});

	it('propagates provider error', async () => {
		const app = makeApp();
		const failing: SummaryProvider = {
			id: 'x',
			generate: vi.fn().mockRejectedValue(new Error('boom')),
		};
		await expect(
			runSummary(
				app as unknown as Parameters<typeof runSummary>[0],
				failing,
				'ObsiDeep/AI-Summaries',
				{
					template: makeTemplate(),
					transcript: '',
					title: 'T',
					sourcePath: 'p',
					uiLanguageLabel: 'English',
				},
			),
		).rejects.toThrow('boom');
		expect(app.vault.create).not.toHaveBeenCalled();
	});

	it('passes prompt + transcript to provider', async () => {
		const app = makeApp();
		const provider = makeProvider({ summary: 's', decisions: 'd' });
		await runSummary(
			app as unknown as Parameters<typeof runSummary>[0],
			provider,
			'ObsiDeep/AI-Summaries',
			{
				template: makeTemplate(),
				transcript: 'TRANSCRIPT_BODY',
				title: 'T',
				sourcePath: 'p',
				uiLanguageLabel: 'Korean',
			},
		);
		const call = (provider.generate as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
		expect(call?.userContent).toBe('TRANSCRIPT_BODY');
		expect(call?.systemPrompt).toContain('Respond in Korean.');
		expect(call?.placeholders).toEqual({ summary: '', decisions: '' });
	});
});
