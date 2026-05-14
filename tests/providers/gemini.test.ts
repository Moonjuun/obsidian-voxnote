import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('obsidian', () => ({
	requestUrl: vi.fn(),
}));

import { GeminiProvider } from '../../src/providers/gemini';
import { SummaryProviderError } from '../../src/providers/types';

function makeResponse(payload: unknown, status = 200) {
	return {
		status,
		json: payload,
		text: typeof payload === 'string' ? payload : JSON.stringify(payload),
		arrayBuffer: new ArrayBuffer(0),
		headers: {},
	};
}

function geminiSuccess(jsonText: string) {
	return makeResponse({
		candidates: [{ content: { parts: [{ text: jsonText }] } }],
	});
}

describe('GeminiProvider', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('throws when API key is empty', async () => {
		const provider = new GeminiProvider({
			apiKey: '',
			model: 'gemini-2.5-flash',
			requester: vi.fn(),
		});
		await expect(
			provider.generate({ systemPrompt: 'x', userContent: 'y', placeholders: { a: '' } }),
		).rejects.toThrow(SummaryProviderError);
	});

	it('throws when placeholders are empty', async () => {
		const provider = new GeminiProvider({
			apiKey: 'k',
			model: 'gemini-2.5-flash',
			requester: vi.fn(),
		});
		await expect(
			provider.generate({ systemPrompt: 'x', userContent: 'y', placeholders: {} }),
		).rejects.toThrow(/placeholder/);
	});

	it('parses a successful structured response', async () => {
		const requester = vi
			.fn()
			.mockResolvedValueOnce(geminiSuccess(JSON.stringify({ summary: 'hello', decisions: 'none' })));
		const provider = new GeminiProvider({
			apiKey: 'k',
			model: 'gemini-2.5-flash',
			requester,
		});
		const out = await provider.generate({
			systemPrompt: 'sys',
			userContent: 'user',
			placeholders: { summary: 'core', decisions: 'list' },
		});
		expect(out).toEqual({ summary: 'hello', decisions: 'none' });
		expect(requester).toHaveBeenCalledTimes(1);
	});

	it('throws SummaryProviderError on 401', async () => {
		const requester = vi.fn().mockResolvedValueOnce(makeResponse({}, 401));
		const provider = new GeminiProvider({
			apiKey: 'k',
			model: 'gemini-2.5-flash',
			requester,
		});
		await expect(
			provider.generate({ systemPrompt: 's', userContent: 'u', placeholders: { a: '' } }),
		).rejects.toMatchObject({ status: 401 });
	});

	it('throws SummaryProviderError on 500', async () => {
		const requester = vi.fn().mockResolvedValue(makeResponse({}, 500));
		const provider = new GeminiProvider({
			apiKey: 'k',
			model: 'gemini-2.5-flash',
			requester,
		});
		await expect(
			provider.generate({ systemPrompt: 's', userContent: 'u', placeholders: { a: '' } }),
		).rejects.toMatchObject({ status: 500 });
	});

	it('retries once when JSON parse fails, then succeeds', async () => {
		const requester = vi
			.fn()
			.mockResolvedValueOnce(geminiSuccess('not json'))
			.mockResolvedValueOnce(geminiSuccess(JSON.stringify({ summary: 'ok' })));
		const provider = new GeminiProvider({
			apiKey: 'k',
			model: 'gemini-2.5-flash',
			requester,
		});
		const out = await provider.generate({
			systemPrompt: 's',
			userContent: 'u',
			placeholders: { summary: '' },
		});
		expect(out).toEqual({ summary: 'ok' });
		expect(requester).toHaveBeenCalledTimes(2);
	});

	it('throws after retry also fails', async () => {
		const requester = vi
			.fn()
			.mockResolvedValueOnce(geminiSuccess('not json'))
			.mockResolvedValueOnce(geminiSuccess('still not json'));
		const provider = new GeminiProvider({
			apiKey: 'k',
			model: 'gemini-2.5-flash',
			requester,
		});
		await expect(
			provider.generate({ systemPrompt: 's', userContent: 'u', placeholders: { summary: '' } }),
		).rejects.toThrow(SummaryProviderError);
		expect(requester).toHaveBeenCalledTimes(2);
	});

	it('fills missing keys with empty string', async () => {
		const requester = vi
			.fn()
			.mockResolvedValueOnce(geminiSuccess(JSON.stringify({ summary: 'have' })));
		const provider = new GeminiProvider({
			apiKey: 'k',
			model: 'gemini-2.5-flash',
			requester,
		});
		const out = await provider.generate({
			systemPrompt: 's',
			userContent: 'u',
			placeholders: { summary: '', decisions: '' },
		});
		expect(out).toEqual({ summary: 'have', decisions: '' });
	});

	it('coerces non-string values to strings', async () => {
		const requester = vi
			.fn()
			.mockResolvedValueOnce(geminiSuccess(JSON.stringify({ summary: 42, decisions: null })));
		const provider = new GeminiProvider({
			apiKey: 'k',
			model: 'gemini-2.5-flash',
			requester,
		});
		const out = await provider.generate({
			systemPrompt: 's',
			userContent: 'u',
			placeholders: { summary: '', decisions: '' },
		});
		expect(out.summary).toBe('42');
		expect(out.decisions).toBe('');
	});

	it('sends model name in URL', async () => {
		const requester = vi
			.fn()
			.mockResolvedValueOnce(geminiSuccess(JSON.stringify({ summary: 'x' })));
		const provider = new GeminiProvider({
			apiKey: 'k',
			model: 'gemini-2.5-pro',
			requester,
		});
		await provider.generate({
			systemPrompt: 's',
			userContent: 'u',
			placeholders: { summary: '' },
		});
		const call = requester.mock.calls[0]?.[0];
		expect(call?.url).toContain('gemini-2.5-pro');
	});

	it('reports network errors as SummaryProviderError', async () => {
		const requester = vi.fn().mockRejectedValueOnce(new Error('socket hang up'));
		const provider = new GeminiProvider({
			apiKey: 'k',
			model: 'gemini-2.5-flash',
			requester,
		});
		await expect(
			provider.generate({ systemPrompt: 's', userContent: 'u', placeholders: { summary: '' } }),
		).rejects.toThrow(/socket hang up/);
	});
});
