export type UiLang = 'ko' | 'en' | 'auto';
export type Lang = 'ko' | 'en';

export type T = (ko: string, en: string) => string;

export function detectLang(setting: UiLang): Lang {
	if (setting === 'ko' || setting === 'en') return setting;

	// auto: Obsidian 자체 locale (localStorage 'language') → 브라우저 → 기본 en
	if (typeof window !== 'undefined') {
		const stored = window.localStorage.getItem('language');
		if (stored?.toLowerCase().startsWith('ko')) return 'ko';
		if (stored?.toLowerCase().startsWith('en')) return 'en';
	}
	if (typeof navigator !== 'undefined' && navigator.language) {
		if (navigator.language.toLowerCase().startsWith('ko')) return 'ko';
	}
	return 'en';
}

export function makeT(lang: Lang): T {
	return (ko, en) => (lang === 'ko' ? ko : en);
}
