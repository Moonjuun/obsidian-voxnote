import { type App, TFile, normalizePath } from 'obsidian';
import { listSpeakers, type TranscribeResult } from './deepgram';
import type { DeepgramSettings } from './settings';
import { formatDuration } from './audio-utils';

const DEFAULT_TEMPLATE = `---
date: {{date}}
type: meeting
tags: [meeting, stt]
duration: {{duration}}
language: {{language}}
source: {{audio_link}}
speakers: {{speakers_list}}
---

# {{title}}

{{transcript}}
`;

export interface NoteContext {
	title: string;
	audioPath: string;
	result: TranscribeResult;
	settings: DeepgramSettings;
}

export async function createTranscriptNote(app: App, ctx: NoteContext): Promise<string> {
	const template = await loadTemplate(app, ctx.settings.templatePath);
	const content = applyTokens(template, ctx);
	const path = await buildNotePath(app, ctx);
	await ensureFolder(app, path);
	await app.vault.create(path, content);
	return path;
}

async function loadTemplate(app: App, templatePath: string): Promise<string> {
	if (!templatePath) return DEFAULT_TEMPLATE;
	const file = app.vault.getAbstractFileByPath(normalizePath(templatePath));
	if (file instanceof TFile) {
		return await app.vault.read(file);
	}
	// 잘못된 경로면 안내 후 기본 템플릿 fallback
	console.warn(`[Deepgram STT] template not found: ${templatePath}. Falling back to built-in.`);
	return DEFAULT_TEMPLATE;
}

function applyTokens(template: string, ctx: NoteContext): string {
	const date = formatDate(new Date());
	const primaryTranscript = ctx.settings.diarize
		? ctx.result.speakersTranscript
		: ctx.result.transcript;

	const speakers = listSpeakers(ctx.result.paragraphs);
	const speakersList =
		speakers.length > 0 ? `[${speakers.map((s) => `"${s}"`).join(', ')}]` : '[]';

	const tokens = new Map<string, string>([
		['date', date],
		['title', ctx.title],
		['transcript', primaryTranscript],
		['speakers_transcript', ctx.result.speakersTranscript],
		['plain_transcript', ctx.result.transcript],
		['speakers_list', speakersList],
		['duration', formatDuration(ctx.result.duration)],
		['audio_link', `[[${ctx.audioPath}]]`],
		['language', ctx.settings.language],
		['model', ctx.settings.model],
	]);

	return template.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
		return tokens.get(key) ?? match;
	});
}

async function buildNotePath(app: App, ctx: NoteContext): Promise<string> {
	const date = formatDate(new Date());
	const sanitized = sanitizeFilename(ctx.title);
	const baseFolder = ctx.settings.savedFolder.replace(/\/+$/, '') || 'STT';
	const baseName = `${date}_${sanitized}`;

	let path = normalizePath(`${baseFolder}/${baseName}.md`);
	let counter = 2;
	while (await app.vault.adapter.exists(path)) {
		path = normalizePath(`${baseFolder}/${baseName}_${counter}.md`);
		counter++;
	}
	return path;
}

function sanitizeFilename(name: string): string {
	const cleaned = name.replace(/[\\/:*?"<>|]/g, '_').trim();
	return cleaned || 'untitled';
}

async function ensureFolder(app: App, filePath: string): Promise<void> {
	const folder = filePath.substring(0, filePath.lastIndexOf('/'));
	if (!folder) return;
	if (!(await app.vault.adapter.exists(folder))) {
		await app.vault.createFolder(folder);
	}
}

function formatDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}
