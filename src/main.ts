import { Menu, Notice, Plugin, TAbstractFile, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, type DeepgramSettings } from './settings';
import { DeepgramSettingTab } from './settings-tab';
import { ConsentModal } from './consent-modal';
import { applyConsentSideEffects, type ConsentSideEffectsResult } from './gitignore';
import { checkReady, notifyIfBlocked } from './guards';
import { AudioSuggestModal } from './audio-suggest-modal';
import { TitleInputModal } from './title-input-modal';
import { SpeakerRenameModal } from './speaker-rename-modal';
import { audioMimeType, formatDuration, isAudioFile } from './audio-utils';
import { DeepgramApiError, transcribe, type TranscribeResult } from './deepgram';
import { createTranscriptNote } from './note-writer';
import { detectLang, makeT, type T } from './i18n';
import { NoticeDuration } from './constants';
import { friendlyMessage } from './errors';

export default class DeepgramSttPlugin extends Plugin {
	settings: DeepgramSettings;
	private consentModalOpen = false;

	get t(): T {
		return makeT(detectLang(this.settings.uiLanguage));
	}

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new DeepgramSettingTab(this.app, this));

		if (!this.settings.consentAcknowledged) {
			this.app.workspace.onLayoutReady(() => {
				this.openConsentModal();
			});
		}

		this.addCommand({
			id: 'hello',
			name: this.t('Hello (sanity check)', 'Hello (sanity check)'),
			callback: () => {
				new Notice(this.t('Deepgram Meeting STT — 플러그인이 로드되었습니다.', 'Deepgram Meeting STT — plugin loaded!'));
			},
		});

		this.addCommand({
			id: 'transcribe-to-note',
			name: this.t('회의록 추출 (Transcribe audio → meeting note)', 'Transcribe audio → meeting note'),
			callback: () => {
				if (!notifyIfBlocked(checkReady(this.settings), this.t)) return;
				new AudioSuggestModal(this.app, this.t, (file) => {
					this.askTitleAndTranscribe(file);
				}).open();
			},
		});

		this.addCommand({
			id: 'transcribe-debug',
			name: this.t('회의록 추출 (디버그: 콘솔만)', 'Transcribe audio (debug — console only)'),
			callback: () => {
				if (!notifyIfBlocked(checkReady(this.settings), this.t)) return;
				new AudioSuggestModal(this.app, this.t, (file) => {
					void this.runDebugTranscribe(file);
				}).open();
			},
		});

		this.addCommand({
			id: 'reset-consent',
			name: this.t('동의 모달 다시 보기', 'Reset consent (show notice again)'),
			callback: () => {
				void this.showConsentAgain();
			},
		});

		this.addCommand({
			id: 'rename-speaker',
			name: this.t('화자 이름 변경 (현재 노트)', 'Rename speaker (current note)'),
			callback: () => {
				void this.openSpeakerRename();
			},
		});

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
				if (!(file instanceof TFile) || !isAudioFile(file)) return;
				menu.addItem((item) =>
					item
						.setTitle(this.t('Deepgram으로 회의록 추출', 'Transcribe with Deepgram'))
						.setIcon('mic')
						.onClick(() => {
							if (!notifyIfBlocked(checkReady(this.settings), this.t)) return;
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

	private openConsentModal(): void {
		// 중복 호출 가드: 이미 열려있거나 이미 동의 처리됐으면 무시
		if (this.consentModalOpen) return;
		if (this.settings.consentAcknowledged) return;

		this.consentModalOpen = true;
		new ConsentModal(
			this.app,
			this.t,
			async () => {
				this.settings.consentAcknowledged = true;
				await this.saveSettings();
				await this.runConsentSideEffects();
			},
			() => {
				this.consentModalOpen = false;
			},
		).open();
	}

	private async runConsentSideEffects(): Promise<void> {
		const result = await applyConsentSideEffects(this.app, detectLang(this.settings.uiLanguage));
		this.notifyConsentResult(result);
	}

	private async showConsentAgain(): Promise<void> {
		this.settings.consentAcknowledged = false;
		await this.saveSettings();
		this.openConsentModal();
	}

	private async openSpeakerRename(): Promise<void> {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice(this.t('현재 활성화된 노트가 없습니다.', 'No active note.'));
			return;
		}
		const candidates = await this.detectSpeakers(file);
		new SpeakerRenameModal(this.app, this.t, file.basename, candidates, (oldName, newName) => {
			void this.replaceSpeakerInFile(file, oldName, newName);
		}).open();
	}

	private async detectSpeakers(file: TFile): Promise<string[]> {
		const cache = this.app.metadataCache.getFileCache(file);
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
		const content = await this.app.vault.read(file);
		const set = new Set<string>();
		const re = /\*\*([^*\n]+?)\*\*\s*\[\d/g;
		let match: RegExpExecArray | null;
		while ((match = re.exec(content)) !== null) {
			const label = match[1];
			if (label) set.add(label.trim());
		}
		return [...set];
	}

	private async replaceSpeakerInFile(file: TFile, oldName: string, newName: string): Promise<void> {
		const t = this.t;
		try {
			const content = await this.app.vault.read(file);
			const matches = occurrenceCount(content, oldName);
			if (matches === 0) {
				new Notice(t(`"${oldName}"을(를) 찾지 못했습니다.`, `"${oldName}" not found in this note.`));
				return;
			}
			const updated = content.split(oldName).join(newName);
			await this.app.vault.modify(file, updated);
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

	private notifyConsentResult(result: ConsentSideEffectsResult): void {
		const t = this.t;
		const messages: string[] = [];

		switch (result.folders) {
			case 'created':
				messages.push(t('✓ ObsiDeep/ 폴더를 생성했습니다 (Audio/, STT/ 포함).', '✓ Created ObsiDeep/ (with Audio/ and STT/).'));
				break;
			case 'partial':
				messages.push(t('✓ ObsiDeep 폴더 구조를 보강했습니다.', '✓ Repaired ObsiDeep folder structure.'));
				break;
			case 'exists':
				break;
			case 'error':
				messages.push(t('⚠ ObsiDeep/ 폴더 자동 생성에 실패했습니다.', '⚠ Failed to auto-create ObsiDeep/.'));
				break;
		}

		switch (result.gitignore) {
			case 'added':
				messages.push(t('✓ vault/.gitignore에 보호 룰을 추가했습니다.', '✓ Added protection rules to vault/.gitignore.'));
				break;
			case 'partial':
				messages.push(t('✓ vault/.gitignore에 누락된 룰을 보강했습니다.', '✓ Filled in missing rules in vault/.gitignore.'));
				break;
			case 'exists':
				break;
			case 'no-gitignore':
				messages.push(t('ℹ vault에 .gitignore가 없어 보호를 건너뛰었습니다.', 'ℹ No .gitignore in vault — skipped auto-protection.'));
				break;
			case 'error':
				messages.push(t('⚠ .gitignore 갱신 중 오류가 발생했습니다.', '⚠ Error while updating .gitignore.'));
				break;
		}

		switch (result.readme) {
			case 'created':
				messages.push(t('✓ ObsiDeep/README.md 안내 파일을 생성했습니다.', '✓ Created ObsiDeep/README.md with usage guide.'));
				break;
			case 'exists':
				break;
			case 'error':
				messages.push(t('⚠ ObsiDeep/README.md 생성 실패.', '⚠ Failed to create ObsiDeep/README.md.'));
				break;
		}

		switch (result.features) {
			case 'created':
				messages.push(t('✓ ObsiDeep/FEATURES.md 기능 가이드를 생성했습니다.', '✓ Created ObsiDeep/FEATURES.md with feature guides.'));
				break;
			case 'exists':
				break;
			case 'error':
				messages.push(t('⚠ ObsiDeep/FEATURES.md 생성 실패.', '⚠ Failed to create ObsiDeep/FEATURES.md.'));
				break;
		}

		if (messages.length > 0) {
			new Notice(messages.join('\n'), NoticeDuration.Long);
		}
	}

	private askTitleAndTranscribe(file: TFile): void {
		new TitleInputModal(this.app, this.t, file.basename, (title) => {
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
		const t = this.t;
		const progress = new Notice(t(`Deepgram: ${file.name} 변환 중...`, `Deepgram: transcribing ${file.name}...`), 0);
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
				t(
					`✓ 회의록 생성: ${notePath} (${formatDuration(result.duration)})`,
					`✓ Note created: ${notePath} (${formatDuration(result.duration)})`,
				),
				NoticeDuration.Medium,
			);
		} catch (e) {
			progress.hide();
			this.reportError(e);
		}
	}

	private async runDebugTranscribe(file: TFile): Promise<void> {
		const t = this.t;
		const progress = new Notice(t(`Deepgram: ${file.name} 전송 중...`, `Deepgram: sending ${file.name}...`), 0);
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
				t(
					`✓ ${formatDuration(result.duration)} · ${result.paragraphs.length} paragraphs\n${preview}…\n\n(전체 결과는 DevTools 콘솔)`,
					`✓ ${formatDuration(result.duration)} · ${result.paragraphs.length} paragraphs\n${preview}…\n\n(Full result in DevTools console)`,
				),
				NoticeDuration.Long,
			);
		} catch (e) {
			progress.hide();
			this.reportError(e);
		}
	}

	private reportError(e: unknown): void {
		console.error('[Deepgram STT] error:', e);

		if (e instanceof DeepgramApiError) {
			new Notice(friendlyMessage(e, this.t), NoticeDuration.Error);
			return;
		}

		const generic = e instanceof Error ? e.message : String(e);
		new Notice(this.t(`예상치 못한 오류: ${generic}`, `Unexpected error: ${generic}`), NoticeDuration.Long);
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

