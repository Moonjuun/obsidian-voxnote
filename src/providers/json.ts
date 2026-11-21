import { SummaryProviderError } from './types';

export function parseResult(text: string, keys: string[]): Record<string, string> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new SummaryProviderError('JSON 파싱 실패');
	}
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
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

export function coerceToString(v: unknown): string {
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

export function buildSchema(placeholders: Record<string, string>): {
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

export function buildJsonFormat(placeholders: Record<string, string>): {
	type: 'object';
	properties: Record<string, { type: 'string'; description?: string }>;
	required: string[];
} {
	const properties: Record<string, { type: 'string'; description?: string }> = {};
	for (const [key, desc] of Object.entries(placeholders)) {
		properties[key] = desc ? { type: 'string', description: desc } : { type: 'string' };
	}
	return { type: 'object', properties, required: Object.keys(placeholders) };
}
