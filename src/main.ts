import { Notice, Plugin, TAbstractFile, type TFile } from 'obsidian';
import { DEFAULT_SETTINGS, type DeepgramSettings } from './settings';
import { DeepgramSettingTab } from './settings-tab';
import { ConsentModal } from './modals/consent-modal';
import {
	applyConsentSideEffects,
	type ConsentSideEffectsResult,
} from './consent-side-effects';
import { audioMimeType } from './utils/audio-utils';
import { DeepgramApiError, transcribe, type TranscribeResult } from './deepgram';
import { detectLang, makeT, type T } from './utils/i18n';
import { NoticeDuration } from './utils/constants';
import { friendlyMessage } from './utils/errors';
import { registerTranscribeToNoteCommand } from './commands/transcribe-to-note';
import { registerTranscribeDebugCommand } from './commands/transcribe-debug';
import { registerRenameSpeakerCommand } from './commands/rename-speaker';
import { registerSummarizeNoteCommand } from './commands/summarize-note';
import { registerTranscribeAndSummarizeCommand } from './commands/transcribe-and-summarize';
import { registerCreateTemplateCommand } from './commands/create-template';
import { registerFileMenus } from './menu-registration';
import { loadTemplates, type TemplateMeta } from './summary/template-loader';

export default class DeepgramSttPlugin extends Plugin {
	settings: DeepgramSettings;
	templatesCache: TemplateMeta[] = [];
	private consentModalOpen = false;
	private settingTab: DeepgramSettingTab | null = null;

	get t(): T {
		return makeT(detectLang(this.settings.uiLanguage));
	}

	async onload(): Promise<void> {
		await this.loadSettings();

		this.settingTab = new DeepgramSettingTab(this.app, this);
		this.addSettingTab(this.settingTab);

		if (!this.settings.consentAcknowledged) {
			this.app.workspace.onLayoutReady(() => {
				this.openConsentModal();
			});
		}

		// Sanity-check command (kept simple)
		this.addCommand({
			id: 'hello',
			name: this.t('Hello (sanity check)', 'Hello (sanity check)'),
			callback: () => {
				new Notice(
					this.t(
						'VoxNote — 플러그인이 로드되었습니다.',
						'VoxNote — plugin loaded!',
					),
				);
			},
		});

		// Re-show consent modal on demand
		this.addCommand({
			id: 'reset-consent',
			name: this.t('동의 모달 다시 보기', 'Reset consent (show notice again)'),
			callback: () => {
				void this.showConsentAgain();
			},
		});

		// Domain commands live in commands/*
		registerTranscribeToNoteCommand(this);
		registerTranscribeDebugCommand(this);
		registerRenameSpeakerCommand(this);
		registerSummarizeNoteCommand(this);
		registerTranscribeAndSummarizeCommand(this);
		registerCreateTemplateCommand(this);
		registerFileMenus(this);

		this.app.workspace.onLayoutReady(() => {
			void this.refreshTemplatesCache();
		});
		const watch = this.onTemplateMaybeChanged.bind(this);
		this.registerEvent(this.app.vault.on('create', watch));
		this.registerEvent(this.app.vault.on('modify', watch));
		this.registerEvent(this.app.vault.on('delete', watch));
		this.registerEvent(
			this.app.vault.on('rename', (file, oldPath) => {
				this.onTemplateMaybeChanged(file, oldPath);
			}),
		);
	}

	async refreshTemplatesCache(): Promise<void> {
		const key = this.settings.geminiApiKey?.trim();
		if (!key) {
			this.templatesCache = [];
			return;
		}
		try {
			this.templatesCache = await loadTemplates(
				this.app,
				this.settings.templatesFolder,
			);
		} catch (e) {
			console.warn('[VoxNote] failed to refresh templates cache:', e);
			this.templatesCache = [];
		}
	}

	private onTemplateMaybeChanged(file: TAbstractFile, oldPath?: string): void {
		const folder = (this.settings.templatesFolder || 'VoxNote/Templates').replace(
			/\/+$/,
			'',
		);
		const prefix = `${folder}/`;
		if (
			file.path === folder ||
			file.path.startsWith(prefix) ||
			(oldPath !== undefined && (oldPath === folder || oldPath.startsWith(prefix)))
		) {
			void this.refreshTemplatesCache();
		}
	}

	onunload(): void {
		this.consentModalOpen = false;
		this.settingTab = null;
	}

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

	/**
	 * Shared transcription helper used by both the primary and debug commands.
	 * Public so command modules can call it without owning Deepgram state.
	 */
	async transcribeFile(file: TFile): Promise<TranscribeResult> {
		const audio = await this.app.vault.readBinary(file);
		return await transcribe(audio, {
			apiKey: this.settings.apiKey,
			model: this.settings.model,
			language: this.settings.language,
			diarize: this.settings.diarize,
			zeroRetention: this.settings.zeroRetention,
			mimeType: audioMimeType(file.extension),
			speakerLabelPrefix: this.t('화자', 'Speaker'),
		});
	}

	/**
	 * Centralized error notice. Public so command modules can hand off
	 * caught errors without duplicating message translation.
	 */
	reportError(e: unknown): void {
		console.error('[Deepgram STT] error:', e);

		if (e instanceof DeepgramApiError) {
			new Notice(friendlyMessage(e, this.t), NoticeDuration.Error);
			return;
		}

		const generic = e instanceof Error ? e.message : String(e);
		new Notice(
			this.t(`예상치 못한 오류: ${generic}`, `Unexpected error: ${generic}`),
			NoticeDuration.Long,
		);
	}

	// ─── Consent flow ────────────────────────────────────────────────

	private openConsentModal(): void {
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
				this.settingTab?.display();
			},
			(acknowledged: boolean) => {
				this.consentModalOpen = false;
				if (!acknowledged) {
					new Notice(
						this.t(
							'동의가 완료되지 않아 VoxNote 폴더가 생성되지 않았습니다.\n설정 → VoxNote 상단의 "동의 모달 다시 보기" 버튼, 또는 명령 팔레트의 "동의 모달 다시 보기"로 다시 열 수 있습니다.',
							'Consent not completed — the VoxNote workspace folders were not created.\nRe-open via Settings → VoxNote (banner at the top) or the command palette ("Reset consent").',
						),
						10000,
					);
				}
				this.settingTab?.display();
			},
		).open();
	}

	private async runConsentSideEffects(): Promise<void> {
		const result = await applyConsentSideEffects(
			this.app,
			detectLang(this.settings.uiLanguage),
		);
		this.notifyConsentResult(result);
	}

	async showConsentAgain(): Promise<void> {
		this.settings.consentAcknowledged = false;
		await this.saveSettings();
		this.openConsentModal();
	}

	private notifyConsentResult(result: ConsentSideEffectsResult): void {
		const t = this.t;
		const messages: string[] = [];

		switch (result.folders) {
			case 'created':
				messages.push(
					t(
						'✓ VoxNote/ 폴더를 생성했습니다 (Audio/, STT/, Templates/, AI-Summaries/ 포함).',
						'✓ Created VoxNote/ (with Audio/, STT/, Templates/, AI-Summaries/).',
					),
				);
				break;
			case 'partial':
				messages.push(
					t('✓ VoxNote 폴더 구조를 보강했습니다.', '✓ Repaired VoxNote folder structure.'),
				);
				break;
			case 'exists':
				break;
			case 'error':
				messages.push(
					t(
						'⚠ VoxNote/ 폴더 자동 생성에 실패했습니다.',
						'⚠ Failed to auto-create VoxNote/.',
					),
				);
				break;
		}

		switch (result.gitignore) {
			case 'added':
				messages.push(
					t(
						'✓ vault/.gitignore에 보호 룰을 추가했습니다.',
						'✓ Added protection rules to vault/.gitignore.',
					),
				);
				break;
			case 'partial':
				messages.push(
					t(
						'✓ vault/.gitignore에 누락된 룰을 보강했습니다.',
						'✓ Filled in missing rules in vault/.gitignore.',
					),
				);
				break;
			case 'exists':
				break;
			case 'no-gitignore':
				messages.push(
					t(
						'ℹ vault에 .gitignore가 없어 보호를 건너뛰었습니다.',
						'ℹ No .gitignore in vault — skipped auto-protection.',
					),
				);
				break;
			case 'error':
				messages.push(
					t(
						'⚠ .gitignore 갱신 중 오류가 발생했습니다.',
						'⚠ Error while updating .gitignore.',
					),
				);
				break;
		}

		switch (result.readme) {
			case 'created':
				messages.push(
					t(
						'✓ VoxNote/README.md 안내 파일을 생성했습니다.',
						'✓ Created VoxNote/README.md with usage guide.',
					),
				);
				break;
			case 'exists':
				break;
			case 'error':
				messages.push(
					t('⚠ VoxNote/README.md 생성 실패.', '⚠ Failed to create VoxNote/README.md.'),
				);
				break;
		}

		switch (result.features) {
			case 'created':
				messages.push(
					t(
						'✓ VoxNote/FEATURES.md 기능 가이드를 생성했습니다.',
						'✓ Created VoxNote/FEATURES.md with feature guides.',
					),
				);
				break;
			case 'exists':
				break;
			case 'error':
				messages.push(
					t(
						'⚠ VoxNote/FEATURES.md 생성 실패.',
						'⚠ Failed to create VoxNote/FEATURES.md.',
					),
				);
				break;
		}

		switch (result.templates) {
			case 'seeded':
				messages.push(
					t(
						'✓ 기본 요약 템플릿 3개를 Templates/ 폴더에 추가했습니다.',
						'✓ Seeded 3 starter summary templates into Templates/.',
					),
				);
				break;
			case 'partial':
				messages.push(
					t(
						'✓ Templates/ 폴더에 누락된 기본 템플릿을 보강했습니다.',
						'✓ Filled in missing starter templates in Templates/.',
					),
				);
				break;
			case 'exists':
				break;
			case 'error':
				messages.push(
					t(
						'⚠ 기본 요약 템플릿 생성에 실패했습니다.',
						'⚠ Failed to seed starter summary templates.',
					),
				);
				break;
		}

		if (messages.length > 0) {
			new Notice(messages.join('\n'), NoticeDuration.Long);
		}
	}
}
