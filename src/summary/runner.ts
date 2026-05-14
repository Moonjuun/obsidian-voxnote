import { type App, normalizePath } from 'obsidian';
import type { SummaryProvider } from '../providers/types';
import type { TemplateMeta } from './template-loader';
import {
	buildGeminiPrompt,
	buildSystemPlaceholders,
	composeSummaryFile,
} from './engine';

export interface SummaryRunInput {
	template: TemplateMeta;
	transcript: string;
	title: string;
	sourcePath: string;
	uiLanguageLabel: string;
	durationSeconds?: number;
	speakers?: string[];
	now?: Date;
}

export interface SummaryRunResult {
	path: string;
	content: string;
}

export async function runSummary(
	app: App,
	provider: SummaryProvider,
	summariesFolder: string,
	input: SummaryRunInput,
): Promise<SummaryRunResult> {
	const system = buildSystemPlaceholders({
		transcript: input.transcript,
		title: input.title,
		sourcePath: input.sourcePath,
		language: input.uiLanguageLabel,
		durationSeconds: input.durationSeconds,
		speakers: input.speakers,
		now: input.now,
	});

	const { systemPrompt, userContent } = buildGeminiPrompt(
		input.template,
		system,
		input.uiLanguageLabel,
	);

	const ai = await provider.generate({
		systemPrompt,
		userContent,
		placeholders: input.template.placeholders,
	});

	const content = composeSummaryFile(input.template, system, ai);
	const path = await resolveSummaryPath(app, summariesFolder, input.title);
	await ensureFolder(app, path);
	await app.vault.create(path, content);
	return { path, content };
}

export async function resolveSummaryPath(
	app: App,
	summariesFolder: string,
	title: string,
): Promise<string> {
	const sanitized = sanitizeFilename(title);
	const baseFolder = (summariesFolder || 'ObsiDeep/AI-Summaries').replace(/\/+$/, '');
	const baseName = `${sanitized} (요약)`;
	let path = normalizePath(`${baseFolder}/${baseName}.md`);
	let counter = 2;
	while (await app.vault.adapter.exists(path)) {
		path = normalizePath(`${baseFolder}/${baseName} (${counter}).md`);
		counter++;
	}
	return path;
}

export async function ensureFolder(app: App, filePath: string): Promise<void> {
	const folder = filePath.substring(0, filePath.lastIndexOf('/'));
	if (!folder) return;
	if (!(await app.vault.adapter.exists(folder))) {
		await app.vault.createFolder(folder);
	}
}

export function sanitizeFilename(name: string): string {
	const cleaned = name.replace(/[\\/:*?"<>|]/g, '_').trim();
	return cleaned || 'untitled';
}

export function extractTranscriptFromMarkdown(raw: string): string {
	const fmMatch = raw.match(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?([\s\S]*)$/);
	return fmMatch ? (fmMatch[1] ?? '').trim() : raw.trim();
}
