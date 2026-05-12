import type { App } from 'obsidian';

const GITIGNORE_PATH = '.gitignore';
const AUDIO_FOLDER = 'Audio';
const COMMENT = '# Deepgram Meeting STT — protect API key + meeting recordings from vault git sync';

export type GitignoreResult = 'added' | 'partial' | 'exists' | 'no-gitignore' | 'error';
export type AudioFolderResult = 'created' | 'exists' | 'error';

export interface ConsentSideEffectsResult {
	gitignore: GitignoreResult;
	audioFolder: AudioFolderResult;
}

export async function applyConsentSideEffects(app: App): Promise<ConsentSideEffectsResult> {
	const [gitignore, audioFolder] = await Promise.all([
		ensureGitignoreRules(app),
		ensureAudioFolder(app),
	]);
	return { gitignore, audioFolder };
}

async function ensureGitignoreRules(app: App): Promise<GitignoreResult> {
	const rules = [
		`${app.vault.configDir}/plugins/deepgram-meeting-stt/data.json`,
		`${AUDIO_FOLDER}/`,
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

async function ensureAudioFolder(app: App): Promise<AudioFolderResult> {
	try {
		const exists = await app.vault.adapter.exists(AUDIO_FOLDER);
		if (exists) return 'exists';
		await app.vault.createFolder(AUDIO_FOLDER);
		return 'created';
	} catch {
		return 'error';
	}
}
