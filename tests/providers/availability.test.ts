import { describe, it, expect } from 'vitest';
import { isSummaryReady } from '../../src/providers/availability';

const base = { summaryProvider: 'gemini', geminiApiKey: '', ollamaModel: '' } as const;

describe('isSummaryReady', () => {
  it('gemini: false without key (legacy behavior preserved)', () => {
    expect(isSummaryReady(base)).toBe(false);
  });
  it('gemini: true with non-blank key, false with whitespace-only key', () => {
    expect(isSummaryReady({ ...base, geminiApiKey: ' k ' })).toBe(true);
    expect(isSummaryReady({ ...base, geminiApiKey: '   ' })).toBe(false);
  });
  it('ollama: false without model even if gemini key set', () => {
    expect(isSummaryReady({ ...base, summaryProvider: 'ollama', geminiApiKey: 'k' })).toBe(false);
  });
  it('ollama: true when model chosen', () => {
    expect(isSummaryReady({ ...base, summaryProvider: 'ollama', ollamaModel: 'qwen2.5:7b' })).toBe(true);
  });
});
