import { describe, it, expect } from 'vitest';
import { buildSchema, parseResult, coerceToString, buildJsonFormat } from '../../src/providers/json';

describe('buildSchema', () => {
  it('maps placeholder descriptions into an OBJECT schema with all keys required', () => {
    expect(buildSchema({ summary: 'core', decisions: 'list' })).toEqual({
      type: 'OBJECT',
      properties: {
        summary: { type: 'STRING', description: 'core' },
        decisions: { type: 'STRING', description: 'list' },
      },
      required: ['summary', 'decisions'],
    });
  });
  it('omits description when placeholder hint is empty string', () => {
    expect(buildSchema({ summary: '' })).toEqual({
      type: 'OBJECT',
      properties: { summary: { type: 'STRING' } },
      required: ['summary'],
    });
  });
});

describe('parseResult', () => {
  it('parses JSON text and coerces each declared key', () => {
    expect(parseResult('{"summary":"ok"}', ['summary', 'missing'])).toEqual({
      summary: 'ok',
      missing: '',
    });
  });
  it('throws SummaryProviderError on invalid JSON', () => {
    expect(() => parseResult('not-json', ['summary'])).toThrowError(/JSON/);
  });
  it('throws when top-level JSON is not an object', () => {
    expect(() => parseResult('[1]', ['summary'])).toThrowError(/객체/);
  });
});

describe('coerceToString', () => {
  it('converts numbers, booleans, arrays, objects; null/undefined become empty string', () => {
    expect(coerceToString(42)).toBe('42');
    expect(coerceToString(true)).toBe('true');
    expect(coerceToString(['a'])).toBe('["a"]');
    expect(coerceToString(null)).toBe('');
    expect(coerceToString(undefined)).toBe('');
  });
});

describe('buildJsonFormat (canonical Ollama format)', () => {
  it('emits lowercase JSON Schema with all keys required', () => {
    expect(buildJsonFormat({ summary: 'core', decisions: 'list' })).toEqual({
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'core' },
        decisions: { type: 'string', description: 'list' },
      },
      required: ['summary', 'decisions'],
    });
  });
  it('omits empty description', () => {
    expect(buildJsonFormat({ summary: '' })).toEqual({
      type: 'object',
      properties: { summary: { type: 'string' } },
      required: ['summary'],
    });
  });
});
