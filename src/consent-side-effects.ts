import type { App } from 'obsidian';
import type { Lang } from './utils/i18n';
import { installFeatures, installReadme, type FileInstallResult } from './readme-installer';
import { seedBuiltInTemplates, type SeedResult } from './summary/built-in-templates';

const GITIGNORE_PATH = '.gitignore';
const ROOT_FOLDER = 'VoxNote';
const AUDIO_SUBFOLDER = `${ROOT_FOLDER}/Audio`;
const STT_SUBFOLDER = `${ROOT_FOLDER}/STT`;
const TEMPLATES_SUBFOLDER = `${ROOT_FOLDER}/Templates`;
const SUMMARIES_SUBFOLDER = `${ROOT_FOLDER}/AI-Summaries`;
const COMMENT = '# VoxNote — protect API key + meeting recordings & notes from vault git sync';

export type GitignoreResult = 'added' | 'partial' | 'exists' | 'no-gitignore' | 'error';
export type FolderResult = 'created' | 'partial' | 'exists' | 'error';

export interface ConsentSideEffectsResult {
	gitignore: GitignoreResult;
	folders: FolderResult;
	readme: FileInstallResult;
	features: FileInstallResult;
	templates: SeedResult;
}

export async function applyConsentSideEffects(app: App, lang: Lang): Promise<ConsentSideEffectsResult> {
	const [gitignore, folders] = await Promise.all([
		ensureGitignoreRules(app),
		ensureFolders(app),
	]);
	const readme = await installReadme(app, lang);
	const features = await installFeatures(app, lang);
	const templates = await seedBuiltInTemplates(app, TEMPLATES_SUBFOLDER, lang);
	return { gitignore, folders, readme, features, templates };
}

async function ensureGitignoreRules(app: App): Promise<GitignoreResult> {
	const rules = [
		`${app.vault.configDir}/plugins/deepgram-meeting-stt/data.json`,
		`${ROOT_FOLDER}/`,
		`${ROOT_FOLDER}/README.md`,
		`${ROOT_FOLDER}/FEATURES.md`,
	];
	try {
		const exists = await app.vault.adapter.exists(GITIGNORE_PATH);
		if (!exists) return 'no-gitignore';

		const content = await app.vault.adapter.read(GITIGNORE_PATH);
		const missing = rules.filter((r) => !content.includes(r));

		if (missing.length === 0) return 'exists';

		const sep = content.endsWith('\n') ? '\n' : '\n\n';
		const block = [COMMENT, ...missing].join('\n');
		await app.vault.adapter.write(GITIGNORE_PATH, `${content}${sep}${block}\n`);

		return missing.length === rules.length ? 'added' : 'partial';
	} catch {
		return 'error';
	}
}

async function ensureFolders(app: App): Promise<FolderResult> {
	const targets = [
		ROOT_FOLDER,
		AUDIO_SUBFOLDER,
		STT_SUBFOLDER,
		TEMPLATES_SUBFOLDER,
		SUMMARIES_SUBFOLDER,
	];
	try {
		let createdCount = 0;
		for (const path of targets) {
			const exists = await app.vault.adapter.exists(path);
			if (!exists) {
				await app.vault.createFolder(path);
				createdCount++;
			}
		}
		if (createdCount === 0) return 'exists';
		if (createdCount === targets.length) return 'created';
		return 'partial';
	} catch {
		return 'error';
	}
}
