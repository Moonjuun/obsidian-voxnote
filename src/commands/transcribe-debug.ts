import { Notice, type TFile } from 'obsidian';
import type DeepgramSttPlugin from '../main';
import { AudioSuggestModal } from '../modals/audio-suggest-modal';
import { formatDuration } from '../utils/audio-utils';
import { checkReady, notifyIfBlocked } from '../utils/guards';
import { NoticeDuration } from '../utils/constants';

/**
 * Register the debug-only transcribe command. It runs the same API call
 * as the normal command but writes the full response to the DevTools
 * console instead of creating a note — useful when iterating on prompts
 * or inspecting Deepgram output during development.
 */
export function registerTranscribeDebugCommand(plugin: DeepgramSttPlugin): void {
	plugin.addCommand({
		id: 'transcribe-debug',
		name: plugin.t(
			'회의록 추출 (디버그: 콘솔만)',
			'Transcribe audio (debug — console only)',
		),
		callback: () => {
			if (!notifyIfBlocked(checkReady(plugin.settings), plugin.t)) return;
			new AudioSuggestModal(plugin.app, plugin.t, (file) => {
				void runDebugTranscribe(plugin, file);
			}).open();
		},
	});
}

async function runDebugTranscribe(plugin: DeepgramSttPlugin, file: TFile): Promise<void> {
	const t = plugin.t;
	const progress = new Notice(
		t(`Deepgram: ${file.name} 전송 중...`, `Deepgram: sending ${file.name}...`),
		0,
	);
	try {
		const result = await plugin.transcribeFile(file);
		progress.hide();

		const prefix = `[Deepgram STT] ${file.path}`;
		console.debug(`${prefix} duration (s):`, result.duration, `(${formatDuration(result.duration)})`);
		console.debug(`${prefix} paragraphs:`, result.paragraphs.length);
		console.debug(`${prefix} transcript (plain):`, result.transcript);
		console.debug(`${prefix} transcript (speakers):`, result.speakersTranscript);
		console.debug(`${prefix} raw:`, result.raw);

		const preview = result.transcript.slice(0, 80).replace(/\s+/g, ' ');
		new Notice(
			t(
				`✓ ${formatDuration(result.duration)} · ${result.paragraphs.length} paragraphs\n${preview}…\n\n(전체 결과는 DevTools 콘솔)`,
				`✓ ${formatDuration(result.duration)} · ${result.paragraphs.length} paragraphs\n${preview}…\n\n(Full result in DevTools console)`,
			),
			NoticeDuration.Long,
		);
	} catch (e) {
		progress.hide();
		plugin.reportError(e);
	}
}
