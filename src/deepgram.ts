import { requestUrl } from 'obsidian';
import type { DeepgramLanguage, DeepgramModel } from './settings';

// ─── 키 검증 ──────────────────────────────────────────────────────────────

export interface ValidationResult {
	ok: boolean;
	message: string;
}

export async function validateApiKey(apiKey: string): Promise<ValidationResult> {
	if (!apiKey || apiKey.trim() === '') {
		return { ok: false, message: 'API 키가 비어있습니다' };
	}

	try {
		const res = await requestUrl({
			url: 'https://api.deepgram.com/v1/projects',
			method: 'GET',
			headers: { Authorization: `Token ${apiKey.trim()}` },
			throw: false,
		});

		if (res.status === 200) {
			return { ok: true, message: '✓ API 키 유효' };
		}
		if (res.status === 401) {
			return { ok: false, message: 'API 키가 유효하지 않습니다 (401)' };
		}
		return { ok: false, message: `예상치 못한 응답: HTTP ${res.status}` };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return { ok: false, message: `네트워크 오류: ${msg}` };
	}
}

// ─── Transcribe ───────────────────────────────────────────────────────────

export interface TranscribeOptions {
	apiKey: string;
	model: DeepgramModel;
	language: DeepgramLanguage;
	diarize: boolean;
	zeroRetention: boolean;
	mimeType: string;
}

export interface ParagraphInfo {
	speaker?: number;
	start: number;
	end: number;
	text: string;
}

export interface TranscribeResult {
	transcript: string;
	speakersTranscript: string;
	paragraphs: ParagraphInfo[];
	duration: number;
	raw: unknown;
}

export class DeepgramApiError extends Error {
	constructor(message: string, public readonly status?: number) {
		super(message);
		this.name = 'DeepgramApiError';
	}
}

export async function transcribe(
	audio: ArrayBuffer,
	options: TranscribeOptions,
): Promise<TranscribeResult> {
	const params = new URLSearchParams({
		model: options.model,
		smart_format: 'true',
		punctuate: 'true',
		paragraphs: 'true',
	});

	if (options.language === 'auto') {
		params.set('detect_language', 'true');
	} else {
		params.set('language', options.language);
	}

	if (options.diarize) {
		params.set('diarize', 'true');
	}

	const headers: Record<string, string> = {
		Authorization: `Token ${options.apiKey.trim()}`,
		'Content-Type': options.mimeType,
	};
	if (options.zeroRetention) {
		headers['dg-zero-retention'] = 'true';
	}

	let res;
	try {
		res = await requestUrl({
			url: `https://api.deepgram.com/v1/listen?${params.toString()}`,
			method: 'POST',
			headers,
			body: audio,
			throw: false,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new DeepgramApiError(`네트워크 오류: ${msg}`);
	}

	if (res.status === 401) {
		throw new DeepgramApiError('API 키가 유효하지 않습니다 (401)', 401);
	}
	if (res.status === 413) {
		throw new DeepgramApiError('파일이 너무 큽니다 (413)', 413);
	}
	if (res.status === 429) {
		throw new DeepgramApiError('요청 한도 초과 (429). 잠시 후 다시 시도하세요.', 429);
	}
	if (res.status >= 500) {
		throw new DeepgramApiError(`Deepgram 서버 오류: HTTP ${res.status}`, res.status);
	}
	if (res.status < 200 || res.status >= 300) {
		throw new DeepgramApiError(`예상치 못한 응답: HTTP ${res.status}`, res.status);
	}

	return parseTranscribeResponse(res.json, options.diarize);
}

function parseTranscribeResponse(raw: unknown, diarize: boolean): TranscribeResult {
	const root = raw as {
		metadata?: { duration?: number };
		results?: {
			channels?: Array<{
				alternatives?: Array<{
					transcript?: string;
					paragraphs?: {
						transcript?: string;
						paragraphs?: Array<{
							speaker?: number;
							start?: number;
							end?: number;
							sentences?: Array<{ text: string }>;
						}>;
					};
				}>;
			}>;
		};
	};

	const duration = root.metadata?.duration ?? 0;
	const alt = root.results?.channels?.[0]?.alternatives?.[0];
	if (!alt) {
		throw new DeepgramApiError('응답에 transcript가 없습니다');
	}

	const rawParagraphs = alt.paragraphs?.paragraphs ?? [];
	const paragraphs: ParagraphInfo[] = rawParagraphs.map((p) => ({
		speaker: p.speaker,
		start: p.start ?? 0,
		end: p.end ?? 0,
		text: (p.sentences ?? [])
			.map((s) => s.text)
			.join(' ')
			.trim(),
	}));

	const transcript: string = alt.paragraphs?.transcript ?? alt.transcript ?? '';

	const speakersTranscript = diarize && paragraphs.length > 0
		? buildSpeakersTranscript(paragraphs)
		: transcript;

	return {
		transcript,
		speakersTranscript,
		paragraphs,
		duration,
		raw,
	};
}

function buildSpeakersTranscript(paragraphs: ParagraphInfo[]): string {
	return paragraphs
		.map((p) => {
			const label = p.speaker !== undefined ? `**화자 ${p.speaker}:**` : '**화자:**';
			return `${label} ${p.text}`;
		})
		.join('\n\n');
}
