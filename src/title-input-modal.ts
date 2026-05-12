import { App, Modal, Setting } from 'obsidian';
import type { T } from './i18n';

export class TitleInputModal extends Modal {
	private title: string;
	private readonly defaultTitle: string;
	private readonly onSubmit: (title: string) => void;
	private readonly t: T;
	private submitted = false;

	constructor(app: App, t: T, defaultTitle: string, onSubmit: (title: string) => void) {
		super(app);
		this.t = t;
		this.defaultTitle = defaultTitle;
		this.title = defaultTitle;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl, titleEl } = this;
		const t = this.t;

		titleEl.setText(t('회의록 제목', 'Meeting note title'));

		new Setting(contentEl)
			.setName(t('제목', 'Title'))
			.setDesc(t('비워두면 오디오 파일명으로 저장됩니다.', 'Leave blank to use the audio file name.'))
			.addText((text) => {
				text.setValue(this.title);
				text.onChange((v) => {
					this.title = v;
				});
				text.inputEl.addEventListener('keydown', (e) => {
					if (e.key !== 'Enter') return;
					// IME 합성 중인 Enter는 무시 (한글 마지막 글자 확정 시점)
					if (e.isComposing) return;
					e.preventDefault();
					e.stopPropagation();
					this.submit();
				});
				setTimeout(() => {
					text.inputEl.focus();
					text.inputEl.select();
				}, 10);
			});

		new Setting(contentEl)
			.addButton((btn) => btn.setButtonText(t('취소', 'Cancel')).onClick(() => this.close()))
			.addButton((btn) =>
				btn
					.setButtonText(t('생성', 'Create'))
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
