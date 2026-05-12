import { Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, DeepgramSettings } from './settings';
import { DeepgramSettingTab } from './settings-tab';
import { ConsentModal } from './consent-modal';
import { ensureGitignoreRule } from './gitignore';

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
				// 이미 보호 중 — 알릴 필요 없음
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
}
