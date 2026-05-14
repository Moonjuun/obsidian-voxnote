import { describe, expect, it, vi } from 'vitest';

vi.mock('obsidian', () => ({
	normalizePath: (p: string) => p.replace(/\\+/g, '/').replace(/\/+/g, '/'),
}));

import {
	BUILT_IN_TEMPLATES_EN,
	BUILT_IN_TEMPLATES_KO,
	getBuiltInTemplates,
	seedBuiltInTemplates,
} from '../../src/summary/built-in-templates';
import type { Lang } from '../../src/utils/i18n';

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

describe('BUILT_IN_TEMPLATES_EN', () => {
	it('exposes Meeting, Interview, Lecture', () => {
		expect(BUILT_IN_TEMPLATES_EN.map((t) => t.filename)).toEqual([
			'Meeting.md',
			'Interview.md',
			'Lecture.md',
		]);
	});

	it('Meeting is the only favorite', () => {
		const favorites = BUILT_IN_TEMPLATES_EN.filter((t) =>
			t.content.includes('favorite: true'),
		);
		expect(favorites).toHaveLength(1);
		expect(favorites[0]?.filename).toBe('Meeting.md');
	});

	it('each template has prompt + placeholders + guide comment', () => {
		for (const t of BUILT_IN_TEMPLATES_EN) {
			expect(t.content).toContain('prompt:');
			expect(t.content).toContain('placeholders:');
			expect(t.content).toContain('System placeholders');
			expect(t.content).toContain('{{transcript}}');
		}
	});
});

describe('BUILT_IN_TEMPLATES_KO', () => {
	it('exposes 회의록, 인터뷰, 강의노트', () => {
		expect(BUILT_IN_TEMPLATES_KO.map((t) => t.filename)).toEqual([
			'회의록.md',
			'인터뷰.md',
			'강의노트.md',
		]);
	});

	it('회의록 is the only favorite', () => {
		const favorites = BUILT_IN_TEMPLATES_KO.filter((t) =>
			t.content.includes('favorite: true'),
		);
		expect(favorites).toHaveLength(1);
		expect(favorites[0]?.filename).toBe('회의록.md');
	});

	it('each template has Korean section headers and guide comment', () => {
		for (const t of BUILT_IN_TEMPLATES_KO) {
			expect(t.content).toContain('## 요약');
			expect(t.content).toContain('시스템 placeholder');
			expect(t.content).toContain('{{transcript}}');
		}
	});

	it('uses Korean instructions in prompt', () => {
		expect(BUILT_IN_TEMPLATES_KO[0]?.content).toContain('한국어');
	});

	it('회의록 prompt mandates 명사형 종결어미체 tone', () => {
		const meeting = BUILT_IN_TEMPLATES_KO.find((t) => t.filename === '회의록.md');
		expect(meeting?.content).toContain('명사형 종결어미체');
	});
});

describe('built-in template formatting hints', () => {
	it('every KO template instructs newline-separated items', () => {
		for (const t of BUILT_IN_TEMPLATES_KO) {
			expect(t.content).toMatch(/줄바꿈|새 줄/);
		}
	});

	it('every EN template instructs newline-separated items', () => {
		for (const t of BUILT_IN_TEMPLATES_EN) {
			expect(t.content).toMatch(/own line|per line|newline/i);
		}
	});

	it('EN Meeting prompt mandates note-style tone', () => {
		const meeting = BUILT_IN_TEMPLATES_EN.find((t) => t.filename === 'Meeting.md');
		expect(meeting?.content).toMatch(/note-style/i);
	});
});

describe('getBuiltInTemplates', () => {
	it('returns KO set for ko', () => {
		expect(getBuiltInTemplates('ko')).toBe(BUILT_IN_TEMPLATES_KO);
	});

	it('returns EN set for en', () => {
		expect(getBuiltInTemplates('en')).toBe(BUILT_IN_TEMPLATES_EN);
	});
});

describe('seedBuiltInTemplates', () => {
	it.each<Lang>(['ko', 'en'])('creates folder + seeds all (%s)', async (lang) => {
		const expected = getBuiltInTemplates(lang);
		const app = makeApp();
		const result = await seedBuiltInTemplates(
			app as unknown as Parameters<typeof seedBuiltInTemplates>[0],
			'ObsiDeep/Templates',
			lang,
		);
		expect(result).toBe('seeded');
		expect(app.vault.createFolder).toHaveBeenCalledWith('ObsiDeep/Templates');
		expect(app.vault.create).toHaveBeenCalledTimes(expected.length);
	});

	it('returns exists when all KO templates already present', async () => {
		const app = makeApp([
			'ObsiDeep/Templates',
			'ObsiDeep/Templates/회의록.md',
			'ObsiDeep/Templates/인터뷰.md',
			'ObsiDeep/Templates/강의노트.md',
		]);
		const result = await seedBuiltInTemplates(
			app as unknown as Parameters<typeof seedBuiltInTemplates>[0],
			'ObsiDeep/Templates',
			'ko',
		);
		expect(result).toBe('exists');
		expect(app.vault.create).not.toHaveBeenCalled();
	});

	it('returns partial when only some EN templates present', async () => {
		const app = makeApp([
			'ObsiDeep/Templates',
			'ObsiDeep/Templates/Meeting.md',
		]);
		const result = await seedBuiltInTemplates(
			app as unknown as Parameters<typeof seedBuiltInTemplates>[0],
			'ObsiDeep/Templates',
			'en',
		);
		expect(result).toBe('partial');
		expect(app.vault.create).toHaveBeenCalledTimes(BUILT_IN_TEMPLATES_EN.length - 1);
	});

	it('returns error when vault throws', async () => {
		const app = makeApp();
		app.vault.create.mockRejectedValueOnce(new Error('disk full'));
		const result = await seedBuiltInTemplates(
			app as unknown as Parameters<typeof seedBuiltInTemplates>[0],
			'ObsiDeep/Templates',
			'en',
		);
		expect(result).toBe('error');
	});

	it('switching language seeds the other set without colliding', async () => {
		const app = makeApp();
		const first = await seedBuiltInTemplates(
			app as unknown as Parameters<typeof seedBuiltInTemplates>[0],
			'ObsiDeep/Templates',
			'en',
		);
		const second = await seedBuiltInTemplates(
			app as unknown as Parameters<typeof seedBuiltInTemplates>[0],
			'ObsiDeep/Templates',
			'ko',
		);
		expect(first).toBe('seeded');
		expect(second).toBe('seeded');
		expect(app.vault.create).toHaveBeenCalledTimes(
			BUILT_IN_TEMPLATES_EN.length + BUILT_IN_TEMPLATES_KO.length,
		);
	});
});
