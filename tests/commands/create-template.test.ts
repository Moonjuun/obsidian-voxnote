import { describe, expect, it, vi } from 'vitest';

vi.mock('obsidian', () => ({
	normalizePath: (p: string) => p.replace(/\\+/g, '/').replace(/\/+/g, '/'),
}));

import {
	createStarterTemplate,
	resolveStarterPath,
	STARTER_TEMPLATE_CONTENT,
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
			'ObsiDeep/Templates',
			'meeting',
		);
		expect(path).toBe('ObsiDeep/Templates/meeting.md');
	});

	it('adds (2) suffix on collision', async () => {
		const app = makeApp(['ObsiDeep/Templates/meeting.md']);
		const path = await resolveStarterPath(
			app as unknown as Parameters<typeof resolveStarterPath>[0],
			'ObsiDeep/Templates',
			'meeting',
		);
		expect(path).toBe('ObsiDeep/Templates/meeting (2).md');
	});

	it('increments to (3) on multiple collisions', async () => {
		const app = makeApp([
			'ObsiDeep/Templates/x.md',
			'ObsiDeep/Templates/x (2).md',
		]);
		const path = await resolveStarterPath(
			app as unknown as Parameters<typeof resolveStarterPath>[0],
			'ObsiDeep/Templates',
			'x',
		);
		expect(path).toBe('ObsiDeep/Templates/x (3).md');
	});

	it('sanitizes unsafe characters in baseName', async () => {
		const app = makeApp();
		const path = await resolveStarterPath(
			app as unknown as Parameters<typeof resolveStarterPath>[0],
			'ObsiDeep/Templates',
			'foo/bar:baz',
		);
		expect(path).toBe('ObsiDeep/Templates/foo_bar_baz.md');
	});

	it('falls back to new-template when name is empty', async () => {
		const app = makeApp();
		const path = await resolveStarterPath(
			app as unknown as Parameters<typeof resolveStarterPath>[0],
			'ObsiDeep/Templates',
			'   ',
		);
		expect(path).toBe('ObsiDeep/Templates/new-template.md');
	});
});

describe('createStarterTemplate', () => {
	it('writes the starter content and auto-creates folder', async () => {
		const app = makeApp();
		const path = await createStarterTemplate(
			app as unknown as Parameters<typeof createStarterTemplate>[0],
			'ObsiDeep/Templates',
			'meeting',
		);
		expect(path).toBe('ObsiDeep/Templates/meeting.md');
		expect(app.vault.createFolder).toHaveBeenCalledWith('ObsiDeep/Templates');
		expect(app.vault.create).toHaveBeenCalledWith(path, STARTER_TEMPLATE_CONTENT);
	});

	it('uses (2) suffix when file already exists', async () => {
		const app = makeApp(['ObsiDeep/Templates/meeting.md', 'ObsiDeep/Templates']);
		const path = await createStarterTemplate(
			app as unknown as Parameters<typeof createStarterTemplate>[0],
			'ObsiDeep/Templates',
			'meeting',
		);
		expect(path).toBe('ObsiDeep/Templates/meeting (2).md');
	});
});

describe('STARTER_TEMPLATE_CONTENT', () => {
	it('contains a frontmatter block with placeholders map', () => {
		expect(STARTER_TEMPLATE_CONTENT.startsWith('---\n')).toBe(true);
		expect(STARTER_TEMPLATE_CONTENT).toContain('placeholders:');
		expect(STARTER_TEMPLATE_CONTENT).toContain('summary:');
		expect(STARTER_TEMPLATE_CONTENT).toContain('key_points:');
	});

	it('documents system placeholders in a comment', () => {
		expect(STARTER_TEMPLATE_CONTENT).toContain('{{transcript}}');
		expect(STARTER_TEMPLATE_CONTENT).toContain('{{title}}');
		expect(STARTER_TEMPLATE_CONTENT).toContain('{{source}}');
	});
});
