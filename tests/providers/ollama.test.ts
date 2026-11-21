import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OllamaProvider, listOllamaModels, chatUrl } from '../../src/providers/ollama';
import { SummaryProviderError } from '../../src/providers/types';
import type { RequestUrlParam, RequestUrlResponse } from 'obsidian';

vi.mock('obsidian', () => ({ requestUrl: vi.fn() }));

function fakeRequester() {
  const responder = vi.fn<(param: RequestUrlParam) => Promise<RequestUrlResponse>>();
  const make = (body: unknown, status = 200): RequestUrlResponse =>
    ({ status, json: null, text: JSON.stringify(body), headers: {} } as unknown as RequestUrlResponse);
  return { responder, make };
}

const SUCCESS_CHAT = {
  model: 'qwen2.5:7b',
  message: { role: 'assistant', content: '{"summary":"요약 완료"}' },
  done: true,
};

describe('OllamaProvider.generate', () => {
  it('throws on blank model', async () => {
    const p = new OllamaProvider({ baseUrl: 'http://localhost:11434', model: '  ' });
    await expect(p.generate({ systemPrompt: 's', userContent: 'u', placeholders: { summary: 'core' } }))
      .rejects.toThrowError(/model/i);
  });

  it('throws when no placeholders declared', async () => {
    const p = new OllamaProvider({ baseUrl: 'http://localhost:11434', model: 'qwen2.5:7b' });
    await expect(p.generate({ systemPrompt: 's', userContent: 'u', placeholders: {} }))
      .rejects.toThrowError(/placeholder/);
  });

  it('POSTs to {origin}/api/chat with system+user messages and format schema; parses content JSON', async () => {
    const { responder, make } = fakeRequester();
    responder.mockResolvedValueOnce(make(SUCCESS_CHAT));
    const p = new OllamaProvider({
      baseUrl: 'http://localhost:11434/',
      model: 'qwen2.5:7b',
      requester: responder,
    });
    const out = await p.generate({
      systemPrompt: 'SYSTEM',
      userContent: 'TRANSCRIPT',
      placeholders: { summary: 'core' },
    });
    expect(out).toEqual({ summary: '요약 완료' });
    expect(responder).toHaveBeenCalledTimes(1);
    const arg = responder.mock.calls[0][0] as RequestUrlParam;
    expect(arg.url).toBe('http://localhost:11434/api/chat');
    const body = JSON.parse(arg.body as string);
    expect(body.model).toBe('qwen2.5:7b');
    expect(body.stream).toBe(false);
    expect(body.messages).toEqual([
      { role: 'system', content: 'SYSTEM' },
      { role: 'user', content: 'TRANSCRIPT' },
    ]);
    expect(body.format).toEqual({
      type: 'object',
      properties: { summary: { type: 'string', description: 'core' } },
      required: ['summary'],
    });
  });

  it('retries once on JSON-parse failure (two requests), gives up with first error', async () => {
    const { responder, make } = fakeRequester();
    responder
      .mockResolvedValueOnce(make({ model: 'm', message: { role: 'assistant', content: 'not-json' }, done: true }))
      .mockResolvedValueOnce(make(SUCCESS_CHAT));
    const p = new OllamaProvider({
      baseUrl: 'http://localhost:11434', model: 'qwen2.5:7b', requester: responder,
    });
    const out = await p.generate({ systemPrompt: 's', userContent: 'u', placeholders: { summary: '' } });
    expect(out).toEqual({ summary: '요약 완료' });
    expect(responder).toHaveBeenCalledTimes(2);
  });

  it('maps 404 to model-not-found error carrying status', async () => {
    const { responder, make } = fakeRequester();
    responder.mockResolvedValueOnce(make({ error: 'model not found' }, 404));
    const p = new OllamaProvider({
      baseUrl: 'http://localhost:11434', model: 'nope', requester: responder,
    });
    await expect(p.generate({ systemPrompt: 's', userContent: 'u', placeholders: { summary: '' } }))
      .rejects.toMatchObject({ constructor: SummaryProviderError, status: 404 });
  });

  it('maps other non-2xx to server error with HTTP status in message', async () => {
    const { responder, make } = fakeRequester();
    responder.mockResolvedValueOnce(make({ error: 'boom' }, 500));
    const p = new OllamaProvider({
      baseUrl: 'http://localhost:11434', model: 'm', requester: responder,
    });
    await expect(p.generate({ systemPrompt: 's', userContent: 'u', placeholders: { summary: '' } }))
      .rejects.toThrowError(/500/);
  });

  it('surfaces network rejection as SummaryProviderError', async () => {
    const { responder } = fakeRequester();
    responder.mockRejectedValueOnce(new Error('fetch failed'));
    const p = new OllamaProvider({
      baseUrl: 'http://localhost:11434', model: 'm', requester: responder,
    });
    await expect(p.generate({ systemPrompt: 's', userContent: 'u', placeholders: { summary: '' } }))
      .rejects.toThrowError(/fetch failed/);
  });

  it('throws when response has no message content', async () => {
    const { responder, make } = fakeRequester();
    responder.mockResolvedValueOnce(make({ model: 'm', done: true }));
    const p = new OllamaProvider({
      baseUrl: 'http://localhost:11434', model: 'm', requester: responder,
    });
    await expect(p.generate({ systemPrompt: 's', userContent: 'u', placeholders: { summary: '' } }))
      .rejects.toThrowError(/응답에 텍스트가 없습니다/);
  });
});

describe('listOllamaModels', () => {
  it('GETs /api/tags and returns model names', async () => {
    const responder = vi.fn<(param: RequestUrlParam) => Promise<RequestUrlResponse>>();
    responder.mockResolvedValueOnce({
      status: 200,
      json: { models: [{ name: 'qwen2.5:7b' }, { name: 'llama3.1:8b' }] },
      text: '', headers: {},
    } as unknown as RequestUrlResponse);
    const names = await listOllamaModels('http://localhost:11434', responder);
    expect(names).toEqual(['qwen2.5:7b', 'llama3.1:8b']);
    expect((responder.mock.calls[0][0] as RequestUrlParam).url).toBe('http://localhost:11434/api/tags');
    expect((responder.mock.calls[0][0] as RequestUrlParam).method).toBe('GET');
  });
});

describe('chatUrl', () => {
  it('strips trailing slash and appends /api/chat', () => {
    expect(chatUrl('http://localhost:11434/')).toBe('http://localhost:11434/api/chat');
    expect(chatUrl('http://localhost:11434')).toBe('http://localhost:11434/api/chat');
  });
});
