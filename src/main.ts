import { Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, DeepgramSettings } from './settings';
import { DeepgramSettingTab } from './settings-tab';
import { ConsentModal } from './consent-modal';
import { ensureGitignoreRule } from './gitignore';
import { checkReady, notifyIfBlocked } from './guards';
import { AudioSuggestModal } from './audio-suggest-modal';
import { TitleInputModal } from './title-input-modal';
import { audioMimeType, formatDuration } from './audio-utils';
import { DeepgramApiError, transcribe, TranscribeResult } from './deepgram';
import { createTranscriptNote } from './note-writer';

export default class DeepgramSttPlugin extends Plugin {
	settings: DeepgramSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new DeepgramSettingTab(this.app, this));

		if (!this.settings.consentAcknowledged) {
			this.app.workspace.onLayoutReady(() => {
				new ConsentModal(this.app, async () => {
					this.settings.consentAcknowledged = true;
					await this.saveSettings();
					await this.applyGitignoreProtection();
				}).open();
			});
		}

		this.addCommand({
			id: 'hello',
			name: 'Hello (sanity check)',
			callback: () => {
				new Notice('Deepgram Meeting STT — plugin loaded!');
			},
		});

		this.addCommand({
			id: 'transcribe-to-note',
			name: 'Transcribe audio → meeting note',
			callback: () => {
				if (!notifyIfBlocked(checkReady(this.settings))) return;
				new AudioSuggestModal(this.app, (file) => {
					const defaultTitle = file.basename;
					new TitleInputModal(this.app, defaultTitle, (title) => {
						this.runTranscribeToNote(file, title);
					}).open();
				}).open();
			},
		});

		this.addCommand({
			id: 'transcribe-debug',
			name: 'Transcribe audio file (debug — console only)',
			callback: () => {
				if (!notifyIfBlocked(checkReady(this.settings))) return;
				new AudioSuggestModal(this.app, (file) => this.runDebugTranscribe(file)).open();
			},
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<DeepgramSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async applyGitignoreProtection() {
		const result = await ensureGitignoreRule(this.app);
		switch (result) {
			case 'added':
				new Notice('vault/.gitignore에 API 키 보호 룰을 추가했습니다.', 6000);
				break;
			case 'exists':
				break;
			case 'no-gitignore':
				new Notice(
					'vault에 .gitignore가 없어 자동 보호를 건너뛰었습니다. git sync 사용 시 수동 추가를 권장합니다.',
					8000,
				);
				break;
			case 'error':
				new Notice('.gitignore 자동 갱신 중 오류가 발생했습니다. 수동 확인이 필요합니다.', 8000);
				break;
		}
	}

	private async transcribeFile(file: TFile): Promise<TranscribeResult> {
		const audio = await this.app.vault.readBinary(file);
		return await transcribe(audio, {
			apiKey: this.settings.apiKey,
			model: this.settings.model,
			language: this.settings.language,
			diarize: this.settings.diarize,
			zeroRetention: this.settings.zeroRetention,
			mimeType: audioMimeType(file.extension),
		});
	}

	private async runTranscribeToNote(file: TFile, title: string) {
		const progress = new Notice(`Deepgram: ${file.name} 변환 중...`, 0);
		try {
			const result = await this.transcribeFile(file);
			progress.hide();

			const notePath = await createTranscriptNote(this.app, {
				title,
				audioPath: file.path,
				result,
				settings: this.settings,
			});

			await this.app.workspace.openLinkText(notePath, '', false);
			new Notice(
				`✓ 회의록 생성: ${notePath} (${formatDuration(result.duration)})`,
				8000,
			);
		} catch (e) {
			progress.hide();
			this.reportError(e);
		}
	}

	private async runDebugTranscribe(file: TFile) {
		const progress = new Notice(`Deepgram: ${file.name} 전송 중...`, 0);
		try {
			const result = await this.transcribeFile(file);
			progress.hide();

			console.group(`[Deepgram STT] ${file.path}`);
			console.log('duration (s):', result.duration, `(${formatDuration(result.duration)})`);
			console.log('paragraphs:', result.paragraphs.length);
			console.log('transcript (plain):', result.transcript);
			console.log('transcript (speakers):', result.speakersTranscript);
			console.log('raw:', result.raw);
			console.groupEnd();

			const preview = result.transcript.slice(0, 80).replace(/\s+/g, ' ');
			new Notice(
				`✓ ${formatDuration(result.duration)} · ${result.paragraphs.length} paragraphs\n${preview}…\n\n(전체 결과는 DevTools 콘솔)`,
				10000,
			);
		} catch (e) {
			progress.hide();
			this.reportError(e);
		}
	}

	private reportError(e: unknown) {
		const msg =
			e instanceof DeepgramApiError
				? e.message
				: `예상치 못한 오류: ${e instanceof Error ? e.message : String(e)}`;
		console.error('[Deepgram STT] error:', e);
		new Notice(`Deepgram 오류: ${msg}`, 10000);
	}
}
