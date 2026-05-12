import { App, Modal, Setting } from 'obsidian';
import type { T } from './i18n';

export class SpeakerRenameModal extends Modal {
	private oldName = '';
	private newName = '';
	private readonly t: T;
	private readonly onSubmit: (oldName: string, newName: string) => void;
	private submitted = false;

	constructor(app: App, t: T, onSubmit: (oldName: string, newName: string) => void) {
		super(app);
		this.t = t;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl, titleEl } = this;
		const t = this.t;

		titleEl.setText(t('화자 이름 변경', 'Rename speaker'));

		contentEl.createEl('p', {
			text: t(
				'현재 노트의 본문과 frontmatter에서 일치하는 모든 텍스트를 일괄 치환합니다.',
				'Replace every matching occurrence in the current note (body + frontmatter).',
			),
		});

		new Setting(contentEl)
			.setName(t('변경 전', 'From'))
			.setDesc(t('예: 화자 0', 'Example: 화자 0'))
			.addText((text) => {
				text.setPlaceholder('화자 0');
				text.onChange((v) => {
					this.oldName = v;
				});
				setTimeout(() => text.inputEl.focus(), 10);
			});

		new Setting(contentEl)
			.setName(t('변경 후', 'To'))
			.setDesc(t('예: 홍길동', 'Example: Hong Gildong'))
			.addText((text) => {
				text.setPlaceholder('홍길동');
				text.onChange((v) => {
					this.newName = v;
				});
				text.inputEl.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						this.submit();
					}
				});
			});

		new Setting(contentEl)
			.addButton((btn) => btn.setButtonText(t('취소', 'Cancel')).onClick(() => this.close()))
			.addButton((btn) =>
				btn
					.setButtonText(t('치환', 'Replace'))
					.setCta()
					.onClick(() => this.submit()),
			);
	}

	private submit() {
		if (this.submitted) return;
		const oldName = this.oldName.trim();
		const newName = this.newName.trim();
		if (!oldName || !newName) return;
		this.submitted = true;
		this.close();
		this.onSubmit(oldName, newName);
	}

	onClose() {
		this.contentEl.empty();
	}
}
