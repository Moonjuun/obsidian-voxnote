import { describe, it, expect, vi } from 'vitest';
import { createSummaryProvider } from '../../src/providers/factory';
import { GeminiProvider } from '../../src/providers/gemini';
import { OllamaProvider } from '../../src/providers/ollama';
import { DEFAULT_SETTINGS } from '../../src/settings';

vi.mock('obsidian', () => ({ requestUrl: vi.fn() }));

describe('createSummaryProvider', () => {
  it('defaults to GeminiProvider (legacy behavior)', () => {
    expect(createSummaryProvider(DEFAULT_SETTINGS)).toBeInstanceOf(GeminiProvider);
  });
  it('returns OllamaProvider with URL + model from settings', () => {
    const p = createSummaryProvider({
      ...DEFAULT_SETTINGS,
      summaryProvider: 'ollama',
      ollamaUrl: 'http://gpu-box:11434',
      ollamaModel: 'qwen2.5:7b',
    });
    expect(p).toBeInstanceOf(OllamaProvider);
    expect(p.id).toBe('ollama');
  });
});
