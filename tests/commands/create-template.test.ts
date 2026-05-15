import { describe, expect, it, vi } from 'vitest';

vi.mock('obsidian', () => ({
	normalizePath: (p: string) => p.replace(/\\+/g, '/').replace(/\/+/g, '/'),
}));

import {
	createStarterTemplate,
	defaultStarterBaseName,
	getStarterTemplate,
	resolveStarterPath,
} from '../../src/summary/template-starter';

interface FakeApp {
	vault: {
		create: ReturnType<typeof vi.fn>;
		createFolder: ReturnType<typeof vi.fn>;
		adapter: {
			exists: ReturnType<typeof vi.fn>;
		};
	};
}

function makeApp(existing: string[] = []): FakeApp {
	const set = new Set(existing);
	return {
		vault: {
			create: vi.fn(),
			createFolder: vi.fn().mockImplementation(async (p: string) => set.add(p)),
			adapter: {
				exists: vi.fn().mockImplementation(async (p: string) => set.has(p)),
			},
		},
	};
}

describe('resolveStarterPath', () => {
	it('produces base path when nothing exists', async () => {
		const app = makeApp();
		const path = await resolveStarterPath(
			app as unknown as Parameters<typeof resolveStarterPath>[0],
			'VoxNote/Templates',
			'meeting',
		);
		expect(path).toBe('VoxNote/Templates/meeting.md');
	});

	it('adds (2) suffix on collision', async () => {
		const app = makeApp(['VoxNote/Templates/meeting.md']);
		const path = await resolveStarterPath(
			app as unknown as Parameters<typeof resolveStarterPath>[0],
			'VoxNote/Templates',
			'meeting',
		);
		expect(path).toBe('VoxNote/Templates/meeting (2).md');
	});

	it('increments to (3) on multiple collisions', async () => {
		const app = makeApp([
			'VoxNote/Templates/x.md',
			'VoxNote/Templates/x (2).md',
		]);
		const path = await resolveStarterPath(
			app as unknown as Parameters<typeof resolveStarterPath>[0],
			'VoxNote/Templates',
			'x',
		);
		expect(path).toBe('VoxNote/Templates/x (3).md');
	});

	it('sanitizes unsafe characters in baseName', async () => {
		const app = makeApp();
		const path = await resolveStarterPath(
			app as unknown as Parameters<typeof resolveStarterPath>[0],
			'VoxNote/Templates',
			'foo/bar:baz',
		);
		expect(path).toBe('VoxNote/Templates/foo_bar_baz.md');
	});

	it('falls back to new-template when name is empty', async () => {
		const app = makeApp();
		const path = await resolveStarterPath(
			app as unknown as Parameters<typeof resolveStarterPath>[0],
			'VoxNote/Templates',
			'   ',
		);
		expect(path).toBe('VoxNote/Templates/new-template.md');
	});
});

describe('createStarterTemplate', () => {
	it('writes EN starter and auto-creates folder', async () => {
		const app = makeApp();
		const path = await createStarterTemplate(
			app as unknown as Parameters<typeof createStarterTemplate>[0],
			'VoxNote/Templates',
			'en',
			'meeting',
		);
		expect(path).toBe('VoxNote/Templates/meeting.md');
		expect(app.vault.createFolder).toHaveBeenCalledWith('VoxNote/Templates');
		expect(app.vault.create).toHaveBeenCalledWith(path, getStarterTemplate('en'));
	});

	it('writes KO starter when lang is ko', async () => {
		const app = makeApp();
		await createStarterTemplate(
			app as unknown as Parameters<typeof createStarterTemplate>[0],
			'VoxNote/Templates',
			'ko',
			'meeting',
		);
		const call = app.vault.create.mock.calls[0];
		expect(call?.[1]).toContain('## 요약');
	});

	it('uses default basename per lang when none provided', async () => {
		const app = makeApp();
		const path = await createStarterTemplate(
			app as unknown as Parameters<typeof createStarterTemplate>[0],
			'VoxNote/Templates',
			'ko',
		);
		expect(path).toBe('VoxNote/Templates/새 템플릿.md');
	});

	it('uses (2) suffix when file already exists', async () => {
		const app = makeApp(['VoxNote/Templates/meeting.md', 'VoxNote/Templates']);
		const path = await createStarterTemplate(
			app as unknown as Parameters<typeof createStarterTemplate>[0],
			'VoxNote/Templates',
			'en',
			'meeting',
		);
		expect(path).toBe('VoxNote/Templates/meeting (2).md');
	});
});

describe('getStarterTemplate', () => {
	it('returns a Korean template for ko', () => {
		const content = getStarterTemplate('ko');
		expect(content.startsWith('---\n')).toBe(true);
		expect(content).toContain('placeholders:');
		expect(content).toContain('## 요약');
		expect(content).toContain('시스템 placeholder');
	});

	it('returns an English template for en', () => {
		const content = getStarterTemplate('en');
		expect(content.startsWith('---\n')).toBe(true);
		expect(content).toContain('placeholders:');
		expect(content).toContain('## Summary');
		expect(content).toContain('System placeholders');
	});

	it('documents all system placeholders in each language', () => {
		for (const lang of ['ko', 'en'] as const) {
			const content = getStarterTemplate(lang);
			for (const token of ['{{transcript}}', '{{title}}', '{{date}}', '{{source}}']) {
				expect(content).toContain(token);
			}
		}
	});
});

describe('defaultStarterBaseName', () => {
	it('returns "새 템플릿" for ko', () => {
		expect(defaultStarterBaseName('ko')).toBe('새 템플릿');
	});

	it('returns "new-template" for en', () => {
		expect(defaultStarterBaseName('en')).toBe('new-template');
	});
});
