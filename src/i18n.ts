import { getLanguage } from 'obsidian';

export type UiLang = 'ko' | 'en' | 'auto';
export type Lang = 'ko' | 'en';

export type T = (ko: string, en: string) => string;

export function detectLang(setting: UiLang): Lang {
	if (setting === 'ko' || setting === 'en') return setting;

	// auto: Obsidian's locale (newer Obsidian versions) → browser locale → en
	if (typeof getLanguage === 'function') {
		const obsLang = getLanguage();
		if (obsLang.toLowerCase().startsWith('ko')) return 'ko';
		if (obsLang.toLowerCase().startsWith('en')) return 'en';
	}
	if (typeof navigator !== 'undefined' && navigator.language) {
		if (navigator.language.toLowerCase().startsWith('ko')) return 'ko';
	}
	return 'en';
}

export function makeT(lang: Lang): T {
	return (ko, en) => (lang === 'ko' ? ko : en);
}
