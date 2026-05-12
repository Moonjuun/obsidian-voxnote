import { App, Modal, Setting } from 'obsidian';

export class TitleInputModal extends Modal {
	private title: string;
	private readonly defaultTitle: string;
	private readonly onSubmit: (title: string) => void;
	private submitted = false;

	constructor(app: App, defaultTitle: string, onSubmit: (title: string) => void) {
		super(app);
		this.defaultTitle = defaultTitle;
		this.title = defaultTitle;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl, titleEl } = this;
		titleEl.setText('회의록 제목');

		new Setting(contentEl)
			.setName('제목')
			.setDesc('비워두면 오디오 파일명으로 저장됩니다.')
			.addText((text) => {
				text.setValue(this.title);
				text.inputEl.style.width = '100%';
				text.onChange((v) => {
					this.title = v;
				});
				text.inputEl.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						this.submit();
					}
				});
				setTimeout(() => {
					text.inputEl.focus();
					text.inputEl.select();
				}, 10);
			});

		new Setting(contentEl)
			.addButton((btn) => btn.setButtonText('취소').onClick(() => this.close()))
			.addButton((btn) =>
				btn
					.setButtonText('생성')
					.setCta()
					.onClick(() => this.submit()),
			);
	}

	private submit() {
		if (this.submitted) return;
		this.submitted = true;
		const value = this.title.trim() || this.defaultTitle;
		this.close();
		this.onSubmit(value);
	}

	onClose() {
		this.contentEl.empty();
	}
}
