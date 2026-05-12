import type { App } from 'obsidian';

const GITIGNORE_PATH = '.gitignore';
const COMMENT = '# Deepgram Meeting STT — protect API key from vault git sync';

export type EnsureResult = 'added' | 'exists' | 'no-gitignore' | 'error';

export async function ensureGitignoreRule(app: App): Promise<EnsureResult> {
	const rule = `${app.vault.configDir}/plugins/deepgram-meeting-stt/data.json`;
	try {
		const exists = await app.vault.adapter.exists(GITIGNORE_PATH);
		if (!exists) return 'no-gitignore';

		const content = await app.vault.adapter.read(GITIGNORE_PATH);
		if (content.includes(rule)) return 'exists';

		const sep = content.endsWith('\n') ? '\n' : '\n\n';
		const updated = `${content}${sep}${COMMENT}\n${rule}\n`;
		await app.vault.adapter.write(GITIGNORE_PATH, updated);
		return 'added';
	} catch {
		return 'error';
	}
}
