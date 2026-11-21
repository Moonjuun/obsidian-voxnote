import type { SummaryProviderId } from '../settings';

export function isSummaryReady(settings: {
	summaryProvider: SummaryProviderId;
	geminiApiKey: string;
	ollamaModel: string;
}): boolean {
	switch (settings.summaryProvider) {
		case 'gemini':
			return Boolean(settings.geminiApiKey && settings.geminiApiKey.trim());
		case 'ollama':
			return Boolean(settings.ollamaModel && settings.ollamaModel.trim());
	}
}
