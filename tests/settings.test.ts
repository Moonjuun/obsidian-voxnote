import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, SummaryProviderId } from '../src/settings';

describe('DEFAULT_SETTINGS (Ollama additions)', () => {
  it('defaults to the legacy Gemini provider so existing installs are unchanged', () => {
    expect(DEFAULT_SETTINGS.summaryProvider).toBe('gemini');
  });
  it('has Ollama defaults: local daemon URL, blank model until user picks one', () => {
    expect(DEFAULT_SETTINGS.ollamaUrl).toBe('http://localhost:11434');
    expect(DEFAULT_SETTINGS.ollamaModel).toBe('');
  });
  it('exposes the provider-id union type', () => {
    const ids: SummaryProviderId[] = ['gemini', 'ollama'];
    expect(ids).toContain('ollama');
  });
});
