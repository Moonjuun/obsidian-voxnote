import type { UiLang } from './utils/i18n';

export type DeepgramLanguage = 'ko' | 'en' | 'auto';
export type DeepgramModel = 'nova-3' | 'nova-2';
export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro';

export interface DeepgramSettings {
	apiKey: string;
	savedFolder: string;
	templatePath: string;
	language: DeepgramLanguage;
	model: DeepgramModel;
	diarize: boolean;
	zeroRetention: boolean;
	consentAcknowledged: boolean;
	uiLanguage: UiLang;
	geminiApiKey: string;
	geminiModel: GeminiModel;
	templatesFolder: string;
	summariesFolder: string;
}

export const DEFAULT_SETTINGS: DeepgramSettings = {
	apiKey: '',
	savedFolder: 'ObsiDeep/STT',
	templatePath: '',
	language: 'ko',
	model: 'nova-3',
	diarize: true,
	zeroRetention: true,
	consentAcknowledged: false,
	uiLanguage: 'auto',
	geminiApiKey: '',
	geminiModel: 'gemini-2.5-flash',
	templatesFolder: 'ObsiDeep/Templates',
	summariesFolder: 'ObsiDeep/AI-Summaries',
};
