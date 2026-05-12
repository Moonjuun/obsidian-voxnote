import { Menu, Notice, Plugin, TAbstractFile, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, DeepgramSettings } from './settings';
import { DeepgramSettingTab } from './settings-tab';
import { ConsentModal } from './consent-modal';
import {
	applyConsentSideEffects,
	ConsentSideEffectsResult,
} from './gitignore';
import { checkReady, notifyIfBlocked } from './guards';
import { AudioSuggestModal } from './audio-suggest-modal';
import { TitleInputModal } from './title-input-modal';
import { audioMimeType, formatDuration, isAudioFile } from './audio-utils';
import { DeepgramApiError, transcribe, TranscribeResult } from './deepgram';
import { createTranscriptNote } from './note-writer';

export default class DeepgramSttPlugin extends Plugin {
	settings: DeepgramSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new DeepgramSettingTab(this.app, this));

		if (!this.settings.consentAcknowledged) {
			this.app.workspace.onLayoutReady(() => {
				new ConsentModal(this.app, async () => {
					this.settings.consentAcknowledged = true;
					await this.saveSettings();
					await this.runConsentSideEffects();
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
					this.askTitleAndTranscribe(file);
				}).open();
			},
		});

		this.addCommand({
			id: 'transcribe-debug',
			name: 'Transcribe audio file (debug — console only)',
			callback: () => {
				if (!notifyIfBlocked(checkReady(this.settings))) return;
				new AudioSuggestModal(this.app, (file) => {
					void this.runDebugTranscribe(file);
				}).open();
			},
		});

		this.addCommand({
			id: 'reset-consent',
			name: '동의 모달 다시 보기 (consent reset)',
			callback: () => {
				void this.showConsentAgain();
			},
		});

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
				if (!(file instanceof TFile) || !isAudioFile(file)) return;
				menu.addItem((item) =>
					item
						.setTitle('Deepgram으로 회의록 추출')
						.setIcon('mic')
						.onClick(() => {
							if (!notifyIfBlocked(checkReady(this.settings))) return;
							this.askTitleAndTranscribe(file);
						}),
				);
			}),
		);
	}

	onunload(): void {}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<DeepgramSettings>,
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private async runConsentSideEffects(): Promise<void> {
		const result = await applyConsentSideEffects(this.app);
		this.notifyConsentResult(result);
	}

	private async showConsentAgain(): Promise<void> {
		this.settings.consentAcknowledged = false;
		await this.saveSettings();
		new ConsentModal(this.app, async () => {
			this.settings.consentAcknowledged = true;
			await this.saveSettings();
			await this.runConsentSideEffects();
		}).open();
	}

	private notifyConsentResult(result: ConsentSideEffectsResult): void {
		const messages: string[] = [];

		switch (result.folders) {
			case 'created':
				messages.push('✓ vault 루트에 ObsiDeep/ 폴더를 생성했습니다 (Audio/, STT/ 포함). 녹음 파일은 ObsiDeep/Audio/에 넣어주세요.');
				break;
			case 'partial':
				messages.push('✓ ObsiDeep 폴더 구조를 보강했습니다.');
				break;
			case 'exists':
				break;
			case 'error':
				messages.push('⚠ ObsiDeep/ 폴더 자동 생성에 실패했습니다. 수동으로 만들어주세요.');
				break;
		}

		switch (result.gitignore) {
			case 'added':
				messages.push('✓ vault/.gitignore에 보호 룰을 추가했습니다 (data.json + ObsiDeep/).');
				break;
			case 'partial':
				messages.push('✓ vault/.gitignore에 누락된 보호 룰을 보강했습니다.');
				break;
			case 'exists':
				break;
			case 'no-gitignore':
				messages.push('ℹ vault에 .gitignore가 없어 자동 보호를 건너뛰었습니다. git sync 사용 시 수동 추가를 권장합니다.');
				break;
			case 'error':
				messages.push('⚠ .gitignore 자동 갱신 중 오류가 발생했습니다. 수동 확인이 필요합니다.');
				break;
		}

		if (messages.length > 0) {
			new Notice(messages.join('\n'), 10000);
		}
	}

	private askTitleAndTranscribe(file: TFile): void {
		new TitleInputModal(this.app, file.basename, (title) => {
			void this.runTranscribeToNote(file, title);
		}).open();
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

	private async runTranscribeToNote(file: TFile, title: string): Promise<void> {
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

	private async runDebugTranscribe(file: TFile): Promise<void> {
		const progress = new Notice(`Deepgram: ${file.name} 전송 중...`, 0);
		try {
			const result = await this.transcribeFile(file);
			progress.hide();

			const prefix = `[Deepgram STT] ${file.path}`;
			console.debug(`${prefix} duration (s):`, result.duration, `(${formatDuration(result.duration)})`);
			console.debug(`${prefix} paragraphs:`, result.paragraphs.length);
			console.debug(`${prefix} transcript (plain):`, result.transcript);
			console.debug(`${prefix} transcript (speakers):`, result.speakersTranscript);
			console.debug(`${prefix} raw:`, result.raw);

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

	private reportError(e: unknown): void {
		console.error('[Deepgram STT] error:', e);

		if (e instanceof DeepgramApiError) {
			new Notice(friendlyMessage(e), 12000);
			return;
		}

		const generic = e instanceof Error ? e.message : String(e);
		new Notice(`예상치 못한 오류: ${generic}`, 10000);
	}
}

function friendlyMessage(err: DeepgramApiError): string {
	switch (err.status) {
		case 401:
			return '⚠ API 키 인증 실패\n설정 → Deepgram Meeting STT에서 키를 다시 확인하세요. ("검증" 버튼으로 즉시 점검 가능)';
		case 413:
			return '⚠ 파일이 너무 큼\nDeepgram sync API 한도(~2GB)를 초과했거나 네트워크가 거부했습니다. 더 짧은 녹음으로 시도하세요.';
		case 429:
			return '⚠ 요청 한도 초과 (429)\n자동 1회 재시도 후에도 실패. 1~2분 후 다시 시도하세요.';
		default:
			if (err.status && err.status >= 500) {
				return `⚠ Deepgram 서버 오류 (HTTP ${err.status})\n자동 재시도 후에도 실패. 잠시 후 다시 시도하세요.`;
			}
			if (err.status === undefined) {
				return `⚠ 네트워크 오류\n인터넷 연결을 확인해주세요. (${err.message})`;
			}
			return `⚠ Deepgram 오류: ${err.message}`;
	}
}
