export interface SummaryRequest {
	systemPrompt: string;
	userContent: string;
	placeholders: Record<string, string>;
}

export class SummaryProviderError extends Error {
	constructor(message: string, public readonly status?: number) {
		super(message);
		this.name = 'SummaryProviderError';
	}
}

export interface SummaryProvider {
	readonly id: string;
	generate(request: SummaryRequest): Promise<Record<string, string>>;
}
