import { describe, expect, it, vi } from 'vitest';

vi.mock('obsidian', () => ({
	normalizePath: (p: string) => p.replace(/\\+/g, '/').replace(/\/+/g, '/'),
}));

import { BUILT_IN_TEMPLATES, seedBuiltInTemplates } from '../../src/summary/built-in-templates';

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
			create: vi.fn().mockImplementation(async (p: string) => set.add(p)),
			createFolder: vi.fn().mockImplementation(async (p: string) => set.add(p)),
			adapter: {
				exists: vi.fn().mockImplementation(async (p: string) => set.has(p)),
			},
		},
	};
}

describe('BUILT_IN_TEMPLATES', () => {
	it('exposes Meeting, Interview, Lecture', () => {
		const names = BUILT_IN_TEMPLATES.map((t) => t.filename);
		expect(names).toEqual(['Meeting.md', 'Interview.md', 'Lecture.md']);
	});

	it('Meeting is the only favorite', () => {
		const favoriteCount = BUILT_IN_TEMPLATES.filter((t) =>
			t.content.includes('favorite: true'),
		).length;
		expect(favoriteCount).toBe(1);
		expect(BUILT_IN_TEMPLATES[0]?.content).toContain('favorite: true');
	});

	it('each template has placeholders map and a prompt', () => {
		for (const t of BUILT_IN_TEMPLATES) {
			expect(t.content).toContain('placeholders:');
			expect(t.content).toContain('prompt:');
		}
	});
});

describe('seedBuiltInTemplates', () => {
	it('creates folder and seeds all templates when empty', async () => {
		const app = makeApp();
		const result = await seedBuiltInTemplates(
			app as unknown as Parameters<typeof seedBuiltInTemplates>[0],
			'ObsiDeep/Templates',
		);
		expect(result).toBe('seeded');
		expect(app.vault.createFolder).toHaveBeenCalledWith('ObsiDeep/Templates');
		expect(app.vault.create).toHaveBeenCalledTimes(BUILT_IN_TEMPLATES.length);
	});

	it('returns exists when all templates already present', async () => {
		const app = makeApp([
			'ObsiDeep/Templates',
			'ObsiDeep/Templates/Meeting.md',
			'ObsiDeep/Templates/Interview.md',
			'ObsiDeep/Templates/Lecture.md',
		]);
		const result = await seedBuiltInTemplates(
			app as unknown as Parameters<typeof seedBuiltInTemplates>[0],
			'ObsiDeep/Templates',
		);
		expect(result).toBe('exists');
		expect(app.vault.create).not.toHaveBeenCalled();
	});

	it('returns partial when only some are present', async () => {
		const app = makeApp([
			'ObsiDeep/Templates',
			'ObsiDeep/Templates/Meeting.md',
		]);
		const result = await seedBuiltInTemplates(
			app as unknown as Parameters<typeof seedBuiltInTemplates>[0],
			'ObsiDeep/Templates',
		);
		expect(result).toBe('partial');
		expect(app.vault.create).toHaveBeenCalledTimes(BUILT_IN_TEMPLATES.length - 1);
	});

	it('returns error when vault throws', async () => {
		const app = makeApp();
		app.vault.create.mockRejectedValueOnce(new Error('disk full'));
		const result = await seedBuiltInTemplates(
			app as unknown as Parameters<typeof seedBuiltInTemplates>[0],
			'ObsiDeep/Templates',
		);
		expect(result).toBe('error');
	});
});
