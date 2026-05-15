import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type DeepgramSttPlugin from './main';
import { validateApiKey } from './deepgram';
import type { UiLang } from './utils/i18n';
import { compareSemver, fetchLatestRelease, UpdateCheckError } from './update-checker';
import type { GeminiModel } from './settings';

const RELEASES_PAGE_URL = 'https://github.com/Moonjuun/obsidian-voxnote/releases';

export class DeepgramSettingTab extends PluginSettingTab {
	plugin: DeepgramSttPlugin;

	constructor(app: App, plugin: DeepgramSttPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private renderConsentBanner(containerEl: HTMLElement): void {
		const t = this.plugin.t;
		const banner = containerEl.createDiv({ cls: 'obsideep-consent-banner' });
		banner.createEl('div', {
			cls: 'obsideep-consent-banner-title',
			text: t(
				'⚠ 동의가 완료되지 않았습니다',
				'⚠ Consent not completed',
			),
		});
		banner.createEl('p', {
			cls: 'obsideep-consent-banner-body',
			text: t(
				'VoxNote/ 작업 공간(Audio·STT·Templates·AI-Summaries 폴더)과 vault .gitignore 보호 룰이 아직 생성되지 않았습니다. 동의 모달을 다시 열어 확인 후 진행해주세요.',
				'The VoxNote/ workspace (Audio · STT · Templates · AI-Summaries folders) and vault .gitignore protection rules have not been created yet. Re-open the consent modal to continue.',
			),
		});
		new Setting(banner).addButton((btn) =>
			btn
				.setButtonText(t('동의 모달 다시 보기', 'Re-open consent modal'))
				.setCta()
				.onClick(() => void this.plugin.showConsentAgain()),
		);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		const t = this.plugin.t;

		if (!this.plugin.settings.consentAcknowledged) {
			this.renderConsentBanner(containerEl);
		}

		// ─── General ─────────────────────────────────────────────────
		new Setting(containerEl).setName(t('일반', 'General')).setHeading();

		new Setting(containerEl)
			.setName(t('UI 언어', 'UI language'))
			.setDesc(t('플러그인 UI 언어. auto는 옵시디언 locale에 따름. 변경 후 옵시디언 재시작 권장.', 'UI language for this plugin. "auto" follows your Obsidian locale. Restart recommended after change.'))
			.addDropdown((dd) =>
				dd
					.addOption('auto', t('자동 (옵시디언 locale)', 'Auto (Obsidian locale)'))
					.addOption('ko', '한국어')
					.addOption('en', 'English')
					.setValue(this.plugin.settings.uiLanguage)
					.onChange(async (value) => {
						this.plugin.settings.uiLanguage = value as UiLang;
						await this.plugin.saveSettings();
						this.display(); // 즉시 새 언어로 다시 그림
					}),
			);

		// ─── API key ─────────────────────────────────────────────────
		new Setting(containerEl).setName(t('API 키', 'API key')).setHeading();

		let apiKeyInputEl: HTMLInputElement | null = null;
		new Setting(containerEl)
			.setName(t('Deepgram API 키', 'Deepgram API key'))
			.setDesc(t('Deepgram 콘솔에서 발급한 키. 로컬 data.json에 저장됩니다.', 'API key from your Deepgram console. Stored locally in data.json.'))
			.addText((text) => {
				text
					.setPlaceholder(t('Deepgram API 키 붙여넣기', 'Paste your Deepgram API key'))
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value.trim();
						await this.plugin.saveSettings();
					});
				text.inputEl.type = 'password';
				apiKeyInputEl = text.inputEl;
			})
			.addButton((btn) =>
				btn.setButtonText(t('검증', 'Validate')).onClick(async () => {
					btn.setDisabled(true).setButtonText(t('검증 중...', 'Validating...'));
					const result = await validateApiKey(this.plugin.settings.apiKey);
					new Notice(
						result.ok
							? t('✓ API 키 유효', '✓ API key is valid')
							: t(`API 키가 유효하지 않습니다 (${result.message})`, `API key is invalid (${result.message})`),
					);
					btn.setDisabled(false).setButtonText(t('검증', 'Validate'));
					if (apiKeyInputEl) apiKeyInputEl.focus();
				}),
			);

		// ─── Save ────────────────────────────────────────────────────
		new Setting(containerEl).setName(t('저장', 'Save')).setHeading();

		new Setting(containerEl)
			.setName(t('회의록 저장 폴더', 'Note folder'))
			.setDesc(t('vault 내 상대 경로. 없으면 자동 생성. 기본값: VoxNote/STT', 'Vault-relative path. Auto-created if missing. Default: VoxNote/STT'))
			.addText((text) =>
				text
					.setPlaceholder(t('예: VoxNote/STT', 'e.g. VoxNote/STT'))
					.setValue(this.plugin.settings.savedFolder)
					.onChange(async (value) => {
						this.plugin.settings.savedFolder = value.trim() || 'VoxNote/STT';
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('템플릿 경로 (선택)', 'Template path (optional)'))
			.setDesc(t('비우면 내장 기본 템플릿 사용. 예: 90_Templates/meeting.md', 'Leave blank to use the built-in template. Example: 90_Templates/meeting.md'))
			.addText((text) =>
				text
					.setPlaceholder(t('(내장 템플릿 사용)', '(built-in template)'))
					.setValue(this.plugin.settings.templatePath)
					.onChange(async (value) => {
						this.plugin.settings.templatePath = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		// ─── AI summary (Gemini) ────────────────────────────────────
		new Setting(containerEl)
			.setName(t('AI 요약 (Gemini)', 'AI summary (Gemini)'))
			.setHeading();

		new Setting(containerEl)
			.setName(t('Gemini API 키', 'Gemini API key'))
			.setDesc(
				t(
					'Google AI Studio에서 발급한 키. 비워두면 STT만 동작하고 AI 요약 메뉴는 숨겨집니다.',
					'API key from Google AI Studio. Leave blank to use STT only; AI menus stay hidden.',
				),
			)
			.addText((text) => {
				text
					.setPlaceholder(
						t('Gemini API 키 붙여넣기 (선택)', 'Paste your Gemini API key (optional)'),
					)
					.setValue(this.plugin.settings.geminiApiKey)
					.onChange(async (value) => {
						this.plugin.settings.geminiApiKey = value.trim();
						await this.plugin.saveSettings();
						await this.plugin.refreshTemplatesCache();
					});
				text.inputEl.type = 'password';
			});

		new Setting(containerEl)
			.setName(t('Gemini 모델', 'Gemini model'))
			.addDropdown((dd) =>
				dd
					.addOption(
						'gemini-2.5-flash',
						t('gemini-2.5-flash (빠르고 저렴, 권장)', 'gemini-2.5-flash (fast & cheap, recommended)'),
					)
					.addOption(
						'gemini-2.5-pro',
						t('gemini-2.5-pro (정확도 우선)', 'gemini-2.5-pro (higher quality)'),
					)
					.setValue(this.plugin.settings.geminiModel)
					.onChange(async (value) => {
						this.plugin.settings.geminiModel = value as GeminiModel;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('템플릿 폴더', 'Templates folder'))
			.setDesc(
				t(
					'요약 템플릿(.md)이 있는 폴더. 기본값: VoxNote/Templates',
					'Folder containing summary templates (.md). Default: VoxNote/Templates',
				),
			)
			.addText((text) =>
				text
					.setPlaceholder(
						t('예: VoxNote/Templates', 'e.g. VoxNote/Templates'),
					)
					.setValue(this.plugin.settings.templatesFolder)
					.onChange(async (value) => {
						this.plugin.settings.templatesFolder =
							value.trim() || 'VoxNote/Templates';
						await this.plugin.saveSettings();
						await this.plugin.refreshTemplatesCache();
					}),
			);

		new Setting(containerEl)
			.setName(t('요약 저장 폴더', 'Summaries folder'))
			.setDesc(
				t(
					'AI 요약 결과를 저장할 폴더. 기본값: VoxNote/AI-Summaries',
					'Folder to save AI summary notes. Default: VoxNote/AI-Summaries',
				),
			)
			.addText((text) =>
				text
					.setPlaceholder(
						t('예: VoxNote/AI-Summaries', 'e.g. VoxNote/AI-Summaries'),
					)
					.setValue(this.plugin.settings.summariesFolder)
					.onChange(async (value) => {
						this.plugin.settings.summariesFolder =
							value.trim() || 'VoxNote/AI-Summaries';
						await this.plugin.saveSettings();
					}),
			);

		// ─── Transcription ──────────────────────────────────────────
		new Setting(containerEl).setName(t('변환 옵션', 'Transcription')).setHeading();

		new Setting(containerEl)
			.setName(t('회의 언어', 'Audio language'))
			.setDesc(t('회의록 주 사용 언어 (Deepgram에 전달)', 'Primary language of the recording (passed to Deepgram)'))
			.addDropdown((dd) =>
				dd
					.addOption('ko', t('한국어', 'Korean'))
					.addOption('en', t('영어', 'English'))
					.addOption('auto', t('자동 감지', 'Auto detect'))
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value as 'ko' | 'en' | 'auto';
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('Deepgram 모델', 'Deepgram model'))
			.addDropdown((dd) =>
				dd
					.addOption('nova-3', t('nova-3 (최신, 권장)', 'nova-3 (latest, recommended)'))
					.addOption('nova-2', t('nova-2 (안정)', 'nova-2 (stable)'))
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value as 'nova-3' | 'nova-2';
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('화자 분리 (Diarize)', 'Speaker diarization'))
			.setDesc(t('녹음 내 화자별로 분리된 transcript 생성', 'Produce per-speaker transcripts'))
			.addToggle((tg) =>
				tg.setValue(this.plugin.settings.diarize).onChange(async (value) => {
					this.plugin.settings.diarize = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName(t('Zero Retention', 'Zero Retention'))
			.setDesc(t('Deepgram 측 데이터 보관 비활성화 요청 (요금제에 따라 적용)', 'Request Deepgram to not retain data (subject to your plan)'))
			.addToggle((tg) =>
				tg.setValue(this.plugin.settings.zeroRetention).onChange(async (value) => {
					this.plugin.settings.zeroRetention = value;
					await this.plugin.saveSettings();
				}),
			);

		// ─── About ───────────────────────────────────────────────────
		new Setting(containerEl).setName(t('정보', 'About')).setHeading();

		const currentVersion = this.plugin.manifest.version;
		new Setting(containerEl)
			.setName(t('현재 버전', 'Current version'))
			.setDesc(`v${currentVersion}`)
			.addButton((btn) =>
				btn
					.setButtonText(t('GitHub 릴리스', 'GitHub releases'))
					.onClick(() => {
						window.open(RELEASES_PAGE_URL, '_blank');
					}),
			);

		new Setting(containerEl)
			.setName(t('업데이트 확인', 'Check for updates'))
			.setDesc(t('GitHub에서 최신 릴리스를 확인합니다. 새 버전이 있으면 안내합니다.', 'Look up the latest release on GitHub and notify if a newer version exists.'))
			.addButton((btn) =>
				btn
					.setButtonText(t('확인', 'Check'))
					.onClick(async () => {
						btn.setDisabled(true).setButtonText(t('확인 중...', 'Checking...'));
						try {
							const release = await fetchLatestRelease();
							const cmp = compareSemver(release.tag, currentVersion);
							if (cmp > 0) {
								new Notice(
									t(
										`업데이트 가능: ${release.tag} (현재 ${currentVersion})\n옵시디언 → Community plugins → "Check for updates"에서 자동 업데이트되거나, 위의 "GitHub 릴리스" 버튼으로 페이지를 여세요.`,
										`Update available: ${release.tag} (current ${currentVersion})\nObsidian's Community plugins → "Check for updates" will fetch it automatically, or use the "GitHub releases" button above.`,
									),
									12000,
								);
							} else if (cmp === 0) {
								new Notice(
									t(
										`최신 버전입니다 (${currentVersion}).`,
										`You're on the latest version (${currentVersion}).`,
									),
									6000,
								);
							} else {
								new Notice(
									t(
										`로컬 버전(${currentVersion})이 릴리스(${release.tag})보다 앞서 있습니다.`,
										`Local version (${currentVersion}) is ahead of latest release (${release.tag}).`,
									),
									6000,
								);
							}
						} catch (e) {
							const msg =
								e instanceof UpdateCheckError
									? e.message
									: e instanceof Error
										? e.message
										: String(e);
							new Notice(
								t(`업데이트 확인 실패: ${msg}`, `Update check failed: ${msg}`),
								8000,
							);
						} finally {
							btn.setDisabled(false).setButtonText(t('확인', 'Check'));
						}
					}),
			);
	}
}
