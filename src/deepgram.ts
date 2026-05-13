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

const RETRY_DELAY_MS = 1000;

export async function transcribe(
	audio: ArrayBuffer,
	options: TranscribeOptions,
): Promise<TranscribeResult> {
	try {
		return await callListenOnce(audio, options);
	} catch (e) {
		if (e instanceof DeepgramApiError && isRetryable(e)) {
			console.warn('[Deepgram STT] retrying after transient error:', e.message);
			await sleep(RETRY_DELAY_MS);
			return await callListenOnce(audio, options);
		}
		throw e;
	}
}

function isRetryable(err: DeepgramApiError): boolean {
	if (err.status === undefined) return true; // 네트워크 오류
	if (err.status === 429) return true;
	if (err.status >= 500) return true;
	return false;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function callListenOnce(
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
	// 연속된 같은 화자의 paragraph는 하나의 블록으로 병합
	const groups: Array<{ speaker?: number; start: number; end: number; text: string }> = [];
	for (const p of paragraphs) {
		const last = groups[groups.length - 1];
		if (last && last.speaker === p.speaker) {
			last.text = `${last.text} ${p.text}`.trim();
			last.end = p.end;
		} else {
			groups.push({ speaker: p.speaker, start: p.start, end: p.end, text: p.text });
		}
	}
	return groups
		.map((g) => {
			// Deepgram returns 0-based speaker indices; display them 1-based for readability.
			const name = g.speaker !== undefined ? `화자 ${g.speaker + 1}` : '화자';
			const range = `[${formatTimestamp(g.start)} - ${formatTimestamp(g.end)}]`;
			return `**${name}** ${range}\n${g.text}`;
		})
		.join('\n\n');
}

function formatTimestamp(seconds: number): string {
	const total = Math.max(0, Math.floor(seconds));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function listSpeakers(paragraphs: ParagraphInfo[]): string[] {
	const set = new Set<number>();
	for (const p of paragraphs) {
		if (p.speaker !== undefined) set.add(p.speaker);
	}
	// 1-based labels to match buildSpeakersTranscript().
	return [...set].sort((a, b) => a - b).map((n) => `화자 ${n + 1}`);
}
