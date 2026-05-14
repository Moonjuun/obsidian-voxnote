import {
	type App,
	TFile,
	TFolder,
	normalizePath,
	parseYaml as obsidianParseYaml,
} from 'obsidian';

export interface TemplateMeta {
	name: string;
	favorite: boolean;
	prompt: string;
	placeholders: Record<string, string>;
	language?: string;
	body: string;
	filename: string;
	path: string;
}

export type YamlParser = (raw: string) => unknown;

const FRONTMATTER_RE = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/;

export function splitFrontmatter(raw: string): { yaml: string; body: string } | null {
	const m = raw.match(FRONTMATTER_RE);
	if (!m) return null;
	return { yaml: m[1] ?? '', body: m[2] ?? '' };
}

export function interpretTemplate(
	data: unknown,
	body: string,
	filename: string,
	path: string,
): TemplateMeta | null {
	if (typeof data !== 'object' || data === null) return null;
	const obj = data as Record<string, unknown>;

	const prompt = typeof obj.prompt === 'string' ? obj.prompt : '';
	if (prompt.trim() === '') return null;

	const placeholders = normalizePlaceholders(obj.placeholders);
	if (Object.keys(placeholders).length === 0) return null;

	const name = typeof obj.name === 'string' && obj.name.trim() !== ''
		? obj.name.trim()
		: stripExtension(filename);
	const favorite = obj.favorite === true;
	const language = typeof obj.language === 'string' ? obj.language : undefined;

	return {
		name,
		favorite,
		prompt,
		placeholders,
		language,
		body,
		filename,
		path,
	};
}

function normalizePlaceholders(value: unknown): Record<string, string> {
	if (typeof value !== 'object' || value === null) return {};
	const out: Record<string, string> = {};
	for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
		if (!key || typeof key !== 'string') continue;
		if (typeof raw === 'string') {
			out[key] = raw;
		} else if (raw === null || raw === undefined) {
			out[key] = '';
		} else if (
			typeof raw === 'number' ||
			typeof raw === 'boolean' ||
			typeof raw === 'bigint'
		) {
			out[key] = String(raw);
		} else {
			try {
				out[key] = JSON.stringify(raw);
			} catch {
				out[key] = '';
			}
		}
	}
	return out;
}

export function sortTemplates(templates: TemplateMeta[]): TemplateMeta[] {
	const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
	return [...templates].sort((a, b) => {
		if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
		return collator.compare(a.name, b.name);
	});
}

export function parseTemplate(
	raw: string,
	filename: string,
	path: string,
	yaml: YamlParser,
): TemplateMeta | null {
	const split = splitFrontmatter(raw);
	if (!split) return null;
	let parsed: unknown;
	try {
		parsed = yaml(split.yaml);
	} catch {
		return null;
	}
	return interpretTemplate(parsed, split.body, filename, path);
}

export interface LoadTemplatesOptions {
	yamlParser?: YamlParser;
}

export async function loadTemplates(
	app: App,
	folderPath: string,
	options?: LoadTemplatesOptions,
): Promise<TemplateMeta[]> {
	const yaml = options?.yamlParser ?? obsidianParseYaml;
	const normalized = normalizePath(folderPath);
	const node = app.vault.getAbstractFileByPath(normalized);
	if (!(node instanceof TFolder)) return [];

	const out: TemplateMeta[] = [];
	for (const child of node.children) {
		if (!(child instanceof TFile)) continue;
		if (child.extension !== 'md') continue;
		try {
			const raw = await app.vault.read(child);
			const meta = parseTemplate(raw, child.name, child.path, yaml);
			if (meta) out.push(meta);
		} catch (e) {
			console.warn(`[ObsiDeep] failed to read template ${child.path}:`, e);
		}
	}

	return sortTemplates(out);
}

function stripExtension(filename: string): string {
	const dot = filename.lastIndexOf('.');
	return dot > 0 ? filename.slice(0, dot) : filename;
}
