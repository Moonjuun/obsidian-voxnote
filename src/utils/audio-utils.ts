import type { TFile } from 'obsidian';

const AUDIO_EXTENSIONS = new Set([
	'mp3',
	'm4a',
	'mp4',
	'wav',
	'flac',
	'ogg',
	'opus',
	'webm',
	'aac',
]);

export function isAudioFile(file: TFile): boolean {
	return AUDIO_EXTENSIONS.has(file.extension.toLowerCase());
}

export function audioMimeType(extension: string): string {
	switch (extension.toLowerCase()) {
		case 'mp3':
			return 'audio/mpeg';
		case 'm4a':
		case 'mp4':
			return 'audio/mp4';
		case 'wav':
			return 'audio/wav';
		case 'flac':
			return 'audio/flac';
		case 'ogg':
			return 'audio/ogg';
		case 'opus':
			return 'audio/opus';
		case 'webm':
			return 'audio/webm';
		case 'aac':
			return 'audio/aac';
		default:
			return 'application/octet-stream';
	}
}

export function formatDuration(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.round(seconds % 60);
	if (h > 0) return `${h}h ${m}m ${s}s`;
	if (m > 0) return `${m}m ${s}s`;
	return `${s}s`;
}
