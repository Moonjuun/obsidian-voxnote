import type { UiLang } from './i18n';

export type DeepgramLanguage = 'ko' | 'en' | 'auto';
export type DeepgramModel = 'nova-3' | 'nova-2';

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
}

export const DEFAULT_SETTINGS: DeepgramSettings = {
	apiKey: '',
	savedFolder: 'ObsiDeep/STT',
	templatePath: '',
	language: 'ko',
	model: 'nova-3',
	diarize: true,
	zeroRetention: false,
	consentAcknowledged: false,
	uiLanguage: 'auto',
};
