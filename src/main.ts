import { Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, DeepgramSettings } from './settings';

export default class DeepgramSttPlugin extends Plugin {
	settings: DeepgramSettings;

	async onload() {
		await this.loadSettings();

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
}
