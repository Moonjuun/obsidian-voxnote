import type { SummaryProvider } from './types';
import type { DeepgramSettings } from '../settings';
import { GeminiProvider } from './gemini';
import { OllamaProvider } from './ollama';

export function createSummaryProvider(settings: DeepgramSettings): SummaryProvider {
	switch (settings.summaryProvider) {
		case 'ollama':
			return new OllamaProvider({ baseUrl: settings.ollamaUrl, model: settings.ollamaModel });
		case 'gemini':
			return new GeminiProvider({
				apiKey: settings.geminiApiKey,
				model: settings.geminiModel,
			});
	}
}
