import { requestUrl, type RequestUrlParam, type RequestUrlResponse } from 'obsidian';
import {
	SummaryProviderError,
	type SummaryProvider,
	type SummaryRequest,
} from './types';
import { buildJsonFormat, parseResult } from './json';

export interface OllamaProviderOptions {
	baseUrl: string;
	model: string;
	requester?: (param: RequestUrlParam) => Promise<RequestUrlResponse>;
}

interface OllamaChatResponse {
	message?: { role?: string; content?: string };
	error?: string;
}

export function chatUrl(baseUrl: string): string {
	return baseUrl.replace(/\/+$/, '') + '/api/chat';
}

function tagsUrl(baseUrl: string): string {
	return baseUrl.replace(/\/+$/, '') + '/api/tags';
}

// Ollama canonical structured output: POST /api/chat with `format` = plain
// JSON Schema (lowercase `object`/`string`) built from template placeholders.
// The JSON result comes back as text in `message.content`, parsed by
// json.ts's parseResult. buildJsonFormat lives in json.ts (Task 1) so it is
// unit-tested beside the other schema/parse helpers.

export class OllamaProvider implements SummaryProvider {
	readonly id = 'ollama';

	constructor(private readonly options: OllamaProviderOptions) {}

	async generate(request: SummaryRequest): Promise<Record<string, string>> {
		if (!this.options.model || this.options.model.trim() === '') {
			throw new SummaryProviderError('Ollama model이 지정되지 않았습니다');
		}

		const placeholderKeys = Object.keys(request.placeholders);
		if (placeholderKeys.length === 0) {
			throw new SummaryProviderError('템플릿에 AI placeholder가 선언되지 않았습니다');
		}

		const body = {
			model: this.options.model.trim(),
			messages: [
				{ role: 'system', content: request.systemPrompt },
				{ role: 'user', content: request.userContent },
			],
			stream: false,
			format: buildJsonFormat(request.placeholders),
		};

		const url = chatUrl(this.options.baseUrl);

		try {
			const text = await callOnce(this.options, url, body);
			return parseResult(text, placeholderKeys);
		} catch (firstErr) {
			if (firstErr instanceof SummaryProviderError && firstErr.status && firstErr.status < 500 && firstErr.status !== 429) {
				throw firstErr; // config errors (404 model, 400 bad request) — no point retrying
			}
			try {
				const retried = await callOnce(this.options, url, body);
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
	options: OllamaProviderOptions,
	url: string,
	body: unknown,
): Promise<string> {
	const requester = options.requester ?? requestUrl;
	let res: RequestUrlResponse;
	try {
		res = await requester({
			url,
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			throw: false,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new SummaryProviderError(`Ollama에 연결할 수 없습니다 (${options.baseUrl}): ${msg}`);
	}

	if (res.status === 404) {
		throw new SummaryProviderError('Ollama 모델을 찾을 수 없습니다: ' + options.model, res.status);
	}
	if (res.status >= 400 && res.status < 500) {
		throw new SummaryProviderError(`Ollama 요청 오류: HTTP ${res.status}`, res.status);
	}
	if (res.status >= 500) {
		throw new SummaryProviderError(`Ollama 서버 오류: HTTP ${res.status}`, res.status);
	}

	const data = res.json as OllamaChatResponse | null
		?? safeJsonParse(res.text);
	if (res.json == null && data == null) {
		throw new SummaryProviderError('응답에 텍스트가 없습니다');
	}
	if (data && data.error) {
		throw new SummaryProviderError(`Ollama error: ${data.error}`);
	}
	const text = data?.message?.content;
	if (!text) {
		throw new SummaryProviderError('응답에 텍스트가 없습니다');
	}
	return text;
}

function safeJsonParse(text: string): OllamaChatResponse | null {
	try {
		return JSON.parse(text) as OllamaChatResponse;
	} catch {
		return null;
	}
}

export async function listOllamaModels(
	baseUrl: string,
	requester?: (param: RequestUrlParam) => Promise<RequestUrlResponse>,
): Promise<string[]> {
	const req = requester ?? requestUrl;
	let res: RequestUrlResponse;
	try {
		res = await req({ url: tagsUrl(baseUrl), method: 'GET', headers: {}, throw: false });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new SummaryProviderError(`Ollama에 연결할 수 없습니다 (${baseUrl}): ${msg}`);
	}
	if (res.status !== 200) {
		throw new SummaryProviderError(`Ollama 모델 목록 조회 실패: HTTP ${res.status}`, res.status);
	}
	const data = (res.json as { models?: Array<{ name?: string }> } | null)
		?? (safeJsonParse(res.text) as { models?: Array<{ name?: string }> } | null);
	const names = (data?.models ?? [])
		.map((m) => (typeof m?.name === 'string' ? m.name : ''))
		.filter((n) => n !== '');
	return names;
}
