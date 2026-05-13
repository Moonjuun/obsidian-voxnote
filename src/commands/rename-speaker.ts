import { Notice, type TFile } from 'obsidian';
import type DeepgramSttPlugin from '../main';
import { SpeakerRenameModal } from '../modals/speaker-rename-modal';

/**
 * Register the "Rename speaker (current note)" command and wire the modal
 * → speaker detection → in-place text replacement pipeline.
 */
export function registerRenameSpeakerCommand(plugin: DeepgramSttPlugin): void {
	plugin.addCommand({
		id: 'rename-speaker',
		name: plugin.t('화자 이름 변경 (현재 노트)', 'Rename speaker (current note)'),
		callback: () => {
			void openSpeakerRename(plugin);
		},
	});
}

async function openSpeakerRename(plugin: DeepgramSttPlugin): Promise<void> {
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice(plugin.t('현재 활성화된 노트가 없습니다.', 'No active note.'));
		return;
	}
	const candidates = await detectSpeakers(plugin, file);
	new SpeakerRenameModal(plugin.app, plugin.t, file.basename, candidates, (oldName, newName) => {
		void replaceSpeakerInFile(plugin, file, oldName, newName);
	}).open();
}

async function detectSpeakers(plugin: DeepgramSttPlugin, file: TFile): Promise<string[]> {
	const cache = plugin.app.metadataCache.getFileCache(file);
	const fm = cache?.frontmatter as { speakers?: unknown } | undefined;
	const fmSpeakers = fm?.speakers;
	if (Array.isArray(fmSpeakers)) {
		const list = fmSpeakers
			.filter((s): s is string => typeof s === 'string')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		if (list.length > 0) return list;
	}
	// Fallback: scan body for **<label>** [HH:MM patterns left by older notes
	const content = await plugin.app.vault.read(file);
	const set = new Set<string>();
	const re = /\*\*([^*\n]+?)\*\*\s*\[\d/g;
	let match: RegExpExecArray | null;
	while ((match = re.exec(content)) !== null) {
		const label = match[1];
		if (label) set.add(label.trim());
	}
	return [...set];
}

async function replaceSpeakerInFile(
	plugin: DeepgramSttPlugin,
	file: TFile,
	oldName: string,
	newName: string,
): Promise<void> {
	const t = plugin.t;
	try {
		const content = await plugin.app.vault.read(file);
		const matches = occurrenceCount(content, oldName);
		if (matches === 0) {
			new Notice(
				t(`"${oldName}"을(를) 찾지 못했습니다.`, `"${oldName}" not found in this note.`),
			);
			return;
		}
		const updated = content.split(oldName).join(newName);
		await plugin.app.vault.modify(file, updated);
		new Notice(
			t(
				`✓ ${matches}곳 치환 완료: ${oldName} → ${newName}`,
				`✓ Replaced ${matches} occurrence(s): ${oldName} → ${newName}`,
			),
		);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		new Notice(t(`치환 실패: ${msg}`, `Replace failed: ${msg}`));
	}
}

function occurrenceCount(haystack: string, needle: string): number {
	if (!needle) return 0;
	let count = 0;
	let idx = haystack.indexOf(needle);
	while (idx !== -1) {
		count++;
		idx = haystack.indexOf(needle, idx + needle.length);
	}
	return count;
}
