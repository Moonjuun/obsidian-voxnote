import { Menu, Notice, TAbstractFile, TFile } from 'obsidian';
import type DeepgramSttPlugin from '../main';
import { AudioSuggestModal } from '../modals/audio-suggest-modal';
import { TitleInputModal } from '../modals/title-input-modal';
import { formatDuration, isAudioFile } from '../utils/audio-utils';
import { createTranscriptNote } from '../note-writer';
import { checkReady, notifyIfBlocked } from '../utils/guards';
import { NoticeDuration } from '../utils/constants';

/**
 * Register the primary "Transcribe audio → meeting note" command
 * and the equivalent right-click menu item on audio files.
 */
export function registerTranscribeToNoteCommand(plugin: DeepgramSttPlugin): void {
	plugin.addCommand({
		id: 'transcribe-to-note',
		name: plugin.t(
			'회의록 추출 (Transcribe audio → meeting note)',
			'Transcribe audio → meeting note',
		),
		callback: () => {
			if (!notifyIfBlocked(checkReady(plugin.settings), plugin.t)) return;
			new AudioSuggestModal(plugin.app, plugin.t, (file) => {
				askTitleAndTranscribe(plugin, file);
			}).open();
		},
	});

	plugin.registerEvent(
		plugin.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
			if (!(file instanceof TFile) || !isAudioFile(file)) return;
			menu.addItem((item) =>
				item
					.setTitle(plugin.t('Deepgram으로 회의록 추출', 'Transcribe with Deepgram'))
					.setIcon('mic')
					.onClick(() => {
						if (!notifyIfBlocked(checkReady(plugin.settings), plugin.t)) return;
						askTitleAndTranscribe(plugin, file);
					}),
			);
		}),
	);
}

function askTitleAndTranscribe(plugin: DeepgramSttPlugin, file: TFile): void {
	new TitleInputModal(plugin.app, plugin.t, file.basename, (title) => {
		void runTranscribeToNote(plugin, file, title);
	}).open();
}

async function runTranscribeToNote(
	plugin: DeepgramSttPlugin,
	file: TFile,
	title: string,
): Promise<void> {
	const t = plugin.t;
	const progress = new Notice(
		t(`Deepgram: ${file.name} 변환 중...`, `Deepgram: transcribing ${file.name}...`),
		0,
	);
	try {
		const result = await plugin.transcribeFile(file);
		progress.hide();

		const notePath = await createTranscriptNote(plugin.app, {
			title,
			audioPath: file.path,
			result,
			settings: plugin.settings,
		});

		await plugin.app.workspace.openLinkText(notePath, '', false);
		new Notice(
			t(
				`✓ 회의록 생성: ${notePath} (${formatDuration(result.duration)})`,
				`✓ Note created: ${notePath} (${formatDuration(result.duration)})`,
			),
			NoticeDuration.Medium,
		);
	} catch (e) {
		progress.hide();
		plugin.reportError(e);
	}
}
