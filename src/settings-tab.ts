import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type DeepgramSttPlugin from './main';
import { validateApiKey } from './deepgram';

export class DeepgramSettingTab extends PluginSettingTab {
	plugin: DeepgramSttPlugin;

	constructor(app: App, plugin: DeepgramSttPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('API 키').setHeading();

		// API 키
		let apiKeyInputEl: HTMLInputElement | null = null;
		new Setting(containerEl)
			.setName('Deepgram API 키')
			.setDesc('Deepgram 콘솔에서 발급한 API 키. 로컬 data.json에 저장됩니다.')
			.addText((text) => {
				text
					.setPlaceholder('xxxxxxxxxxxx...')
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value.trim();
						await this.plugin.saveSettings();
					});
				text.inputEl.type = 'password';
				apiKeyInputEl = text.inputEl;
			})
			.addButton((btn) =>
				btn
					.setButtonText('검증')
					.onClick(async () => {
						btn.setDisabled(true).setButtonText('검증 중...');
						const result = await validateApiKey(this.plugin.settings.apiKey);
						new Notice(result.message);
						btn.setDisabled(false).setButtonText('검증');
						if (apiKeyInputEl) apiKeyInputEl.focus();
					}),
			);

		new Setting(containerEl).setName('저장').setHeading();

		// 저장 폴더
		new Setting(containerEl)
			.setName('회의록 저장 폴더')
			.setDesc('vault 내 상대 경로. 폴더가 없으면 자동 생성됩니다. 기본값: ObsiDeep/STT')
			.addText((text) =>
				text
					.setPlaceholder('ObsiDeep/STT')
					.setValue(this.plugin.settings.savedFolder)
					.onChange(async (value) => {
						this.plugin.settings.savedFolder = value.trim() || 'ObsiDeep/STT';
						await this.plugin.saveSettings();
					}),
			);

		// 템플릿 경로 (선택)
		new Setting(containerEl)
			.setName('템플릿 경로 (선택)')
			.setDesc('비워두면 내장 기본 템플릿을 사용합니다. 예: 90_Templates/meeting.md')
			.addText((text) =>
				text
					.setPlaceholder('(내장 템플릿 사용)')
					.setValue(this.plugin.settings.templatePath)
					.onChange(async (value) => {
						this.plugin.settings.templatePath = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl).setName('변환 옵션').setHeading();

		// 언어
		new Setting(containerEl)
			.setName('언어')
			.setDesc('회의록 주 사용 언어')
			.addDropdown((dd) =>
				dd
					.addOption('ko', '한국어')
					.addOption('en', '영어')
					.addOption('auto', '자동 감지')
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value as 'ko' | 'en' | 'auto';
						await this.plugin.saveSettings();
					}),
			);

		// 모델
		new Setting(containerEl)
			.setName('Deepgram 모델')
			.addDropdown((dd) =>
				dd
					.addOption('nova-3', 'nova-3 (최신, 권장)')
					.addOption('nova-2', 'nova-2 (안정)')
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value as 'nova-3' | 'nova-2';
						await this.plugin.saveSettings();
					}),
			);

		// 화자 분리
		new Setting(containerEl)
			.setName('화자 분리 (Diarize)')
			.setDesc('녹음 내 화자별로 분리된 transcript 생성')
			.addToggle((tg) =>
				tg.setValue(this.plugin.settings.diarize).onChange(async (value) => {
					this.plugin.settings.diarize = value;
					await this.plugin.saveSettings();
				}),
			);

		// Zero Retention
		new Setting(containerEl)
			.setName('Zero Retention')
			.setDesc('Deepgram 측 데이터 보관 비활성화 요청 (요금제에 따라 적용)')
			.addToggle((tg) =>
				tg.setValue(this.plugin.settings.zeroRetention).onChange(async (value) => {
					this.plugin.settings.zeroRetention = value;
					await this.plugin.saveSettings();
				}),
			);
	}
}
