import { describe, expect, it } from 'vitest';
import { audioMimeType, formatDuration } from '../src/audio-utils';

describe('audioMimeType', () => {
	it('maps mp3 to audio/mpeg', () => {
		expect(audioMimeType('mp3')).toBe('audio/mpeg');
	});

	it('maps both m4a and mp4 to audio/mp4', () => {
		expect(audioMimeType('m4a')).toBe('audio/mp4');
		expect(audioMimeType('mp4')).toBe('audio/mp4');
	});

	it.each([
		['wav', 'audio/wav'],
		['flac', 'audio/flac'],
		['ogg', 'audio/ogg'],
		['opus', 'audio/opus'],
		['webm', 'audio/webm'],
		['aac', 'audio/aac'],
	])('maps %s to %s', (ext, mime) => {
		expect(audioMimeType(ext)).toBe(mime);
	});

	it('is case-insensitive', () => {
		expect(audioMimeType('MP3')).toBe('audio/mpeg');
		expect(audioMimeType('M4A')).toBe('audio/mp4');
	});

	it('falls back to application/octet-stream for unknown extensions', () => {
		expect(audioMimeType('xyz')).toBe('application/octet-stream');
		expect(audioMimeType('')).toBe('application/octet-stream');
	});
});

describe('formatDuration', () => {
	it('formats seconds only', () => {
		expect(formatDuration(0)).toBe('0s');
		expect(formatDuration(5)).toBe('5s');
		expect(formatDuration(59)).toBe('59s');
	});

	it('formats minutes + seconds', () => {
		expect(formatDuration(60)).toBe('1m 0s');
		expect(formatDuration(125)).toBe('2m 5s');
		expect(formatDuration(3599)).toBe('59m 59s');
	});

	it('formats hours + minutes + seconds', () => {
		expect(formatDuration(3600)).toBe('1h 0m 0s');
		expect(formatDuration(3725)).toBe('1h 2m 5s');
		expect(formatDuration(7322)).toBe('2h 2m 2s');
	});

	it('rounds seconds to the nearest integer', () => {
		expect(formatDuration(5.4)).toBe('5s');
		expect(formatDuration(5.6)).toBe('6s');
	});

	it('treats non-finite or negative input as 0s', () => {
		expect(formatDuration(-1)).toBe('0s');
		expect(formatDuration(NaN)).toBe('0s');
		expect(formatDuration(Infinity)).toBe('0s');
	});
});
