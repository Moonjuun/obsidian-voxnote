import type { TemplateMeta } from './template-loader';

export interface SystemPlaceholders {
	transcript: string;
	title: string;
	date: string;
	datetime: string;
	source: string;
	language: string;
	duration: string;
	speakers: string;
}

export interface BuildSystemPlaceholdersInput {
	transcript: string;
	title: string;
	sourcePath: string;
	language: string;
	durationSeconds?: number;
	speakers?: string[];
	now?: Date;
}

export function buildSystemPlaceholders(
	input: BuildSystemPlaceholdersInput,
): SystemPlaceholders {
	const now = input.now ?? new Date();
	return {
		transcript: input.transcript,
		title: input.title,
		date: formatDate(now),
		datetime: formatDateTime(now),
		source: input.sourcePath ? `[[${input.sourcePath}]]` : '',
		language: input.language,
		duration: input.durationSeconds !== undefined ? formatDuration(input.durationSeconds) : '',
		speakers: (input.speakers ?? []).join(', '),
	};
}

const TOKEN_RE = /\{\{(\w+)\}\}/g;
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;

export function stripHtmlComments(body: string): string {
	return body.replace(HTML_COMMENT_RE, '').replace(/\n{3,}/g, '\n\n').replace(/^\s+/, '');
}

export function renderBody(
	template: TemplateMeta,
	system: SystemPlaceholders,
	ai: Record<string, string>,
): string {
	const lookup: Record<string, string> = {
		transcript: system.transcript,
		title: system.title,
		date: system.date,
		datetime: system.datetime,
		source: system.source,
		language: system.language,
		duration: system.duration,
		speakers: system.speakers,
		...ai,
	};
	const cleaned = stripHtmlComments(template.body);
	return cleaned.replace(TOKEN_RE, (match, key: string) => {
		return Object.prototype.hasOwnProperty.call(lookup, key) ? (lookup[key] ?? '') : match;
	});
}

export function buildSummaryFrontmatter(
	template: TemplateMeta,
	system: SystemPlaceholders,
): string {
	const lines: string[] = ['---'];
	if (system.source) lines.push(`source: "${escapeYaml(system.source)}"`);
	lines.push(`template: "${escapeYaml(template.name)}"`);
	if (system.date) lines.push(`date: ${system.date}`);
	if (system.language) lines.push(`language: ${system.language}`);
	lines.push('type: ai-summary');
	lines.push('---', '');
	return lines.join('\n');
}

export function composeSummaryFile(
	template: TemplateMeta,
	system: SystemPlaceholders,
	ai: Record<string, string>,
): string {
	return `${buildSummaryFrontmatter(template, system)}${renderBody(template, system, ai)}`;
}

export function buildGeminiPrompt(
	template: TemplateMeta,
	system: SystemPlaceholders,
	uiLanguageLabel: string,
): { systemPrompt: string; userContent: string } {
	const langInstruction = uiLanguageLabel
		? `\n\nRespond in ${uiLanguageLabel}.`
		: '';
	const placeholderHint = Object.entries(template.placeholders)
		.map(([k, desc]) => (desc ? `- ${k}: ${desc}` : `- ${k}`))
		.join('\n');
	const systemPrompt =
		`${template.prompt}${langInstruction}\n\nPopulate these JSON fields:\n${placeholderHint}`;
	return { systemPrompt, userContent: system.transcript };
}

export function escapeYaml(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function pad2(n: number): string {
	return String(n).padStart(2, '0');
}

function formatDate(d: Date): string {
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatDateTime(d: Date): string {
	return `${formatDate(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatDuration(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
	const total = Math.floor(seconds);
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
	return `${m}:${pad2(s)}`;
}
