import { requestUrl, type RequestUrlParam, type RequestUrlResponse } from 'obsidian';
import type { GeminiModel } from '../settings';
import {
	SummaryProviderError,
	type SummaryProvider,
	type SummaryRequest,
} from './types';

export interface GeminiProviderOptions {
	apiKey: string;
	model: GeminiModel;
	requester?: (param: RequestUrlParam) => Promise<RequestUrlResponse>;
}

interface GeminiResponse {
	candidates?: Array<{
		content?: {
			parts?: Array<{ text?: string }>;
		};
	}>;
	error?: { message?: string; code?: number };
}

export class GeminiProvider implements SummaryProvider {
	readonly id = 'gemini';

	constructor(private readonly options: GeminiProviderOptions) {}

	async generate(request: SummaryRequest): Promise<Record<string, string>> {
		if (!this.options.apiKey || this.options.apiKey.trim() === '') {
			throw new SummaryProviderError('Gemini API 키가 비어있습니다');
		}

		const placeholderKeys = Object.keys(request.placeholders);
		if (placeholderKeys.length === 0) {
			throw new SummaryProviderError('템플릿에 AI placeholder가 선언되지 않았습니다');
		}

		const schema = buildSchema(request.placeholders);
		const body = {
			systemInstruction: { parts: [{ text: request.systemPrompt }] },
			contents: [{ role: 'user', parts: [{ text: request.userContent }] }],
			generationConfig: {
				responseMimeType: 'application/json',
				responseSchema: schema,
			},
		};

		const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.options.model}:generateContent`;

		const text = await callOnce(this.options, url, body);

		try {
			return parseResult(text, placeholderKeys);
		} catch (firstErr) {
			const retried = await callOnce(this.options, url, body);
			try {
				return parseResult(retried, placeholderKeys);
			} catch {
				throw firstErr instanceof Error
					? firstErr
					: new SummaryProviderError('JSON 파싱 실패');
			}
		}
	}
}

async function callOnce(
	options: GeminiProviderOptions,
	url: string,
	body: unknown,
): Promise<string> {
	const requester = options.requester ?? requestUrl;
	let res: RequestUrlResponse;
	try {
		res = await requester({
			url,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-goog-api-key': options.apiKey.trim(),
			},
			body: JSON.stringify(body),
			throw: false,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new SummaryProviderError(`네트워크 오류: ${msg}`);
	}

	if (res.status === 401 || res.status === 403) {
		throw new SummaryProviderError('Gemini API 키가 유효하지 않습니다', res.status);
	}
	if (res.status === 429) {
		throw new SummaryProviderError('요청 한도 초과 (429)', 429);
	}
	if (res.status >= 500) {
		throw new SummaryProviderError(`Gemini 서버 오류: HTTP ${res.status}`, res.status);
	}
	if (res.status < 200 || res.status >= 300) {
		throw new SummaryProviderError(
			`예상치 못한 응답: HTTP ${res.status}`,
			res.status,
		);
	}

	const data = res.json as GeminiResponse;
	if (data.error?.message) {
		throw new SummaryProviderError(`Gemini error: ${data.error.message}`);
	}
	const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
	if (!text) {
		throw new SummaryProviderError('응답에 텍스트가 없습니다');
	}
	return text;
}

function parseResult(text: string, keys: string[]): Record<string, string> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new SummaryProviderError('JSON 파싱 실패');
	}
	if (typeof parsed !== 'object' || parsed === null) {
		throw new SummaryProviderError('JSON 응답이 객체가 아닙니다');
	}
	const obj = parsed as Record<string, unknown>;
	const out: Record<string, string> = {};
	for (const key of keys) {
		const v = obj[key];
		out[key] = coerceToString(v);
	}
	return out;
}

function coerceToString(v: unknown): string {
	if (typeof v === 'string') return v;
	if (v === undefined || v === null) return '';
	if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') {
		return String(v);
	}
	try {
		return JSON.stringify(v);
	} catch {
		return '';
	}
}

function buildSchema(placeholders: Record<string, string>): {
	type: 'OBJECT';
	properties: Record<string, { type: 'STRING'; description?: string }>;
	required: string[];
} {
	const properties: Record<string, { type: 'STRING'; description?: string }> = {};
	for (const [key, desc] of Object.entries(placeholders)) {
		properties[key] = desc ? { type: 'STRING', description: desc } : { type: 'STRING' };
	}
	return {
		type: 'OBJECT',
		properties,
		required: Object.keys(placeholders),
	};
}
