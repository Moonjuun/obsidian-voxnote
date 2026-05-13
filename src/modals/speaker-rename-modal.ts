import { App, Modal, Setting } from 'obsidian';
import type { T } from '../utils/i18n';

const FOCUS_DELAY_MS = 10;

export class SpeakerRenameModal extends Modal {
	private oldName = '';
	private newName = '';
	private readonly t: T;
	private readonly noteName: string;
	private readonly candidates: string[];
	private readonly onSubmit: (oldName: string, newName: string) => void;
	private submitted = false;

	constructor(
		app: App,
		t: T,
		noteName: string,
		candidates: string[],
		onSubmit: (oldName: string, newName: string) => void,
	) {
		super(app);
		this.t = t;
		this.noteName = noteName;
		this.candidates = candidates;
		this.onSubmit = onSubmit;
		this.oldName = candidates[0] ?? '';
	}

	onOpen() {
		const { contentEl, titleEl } = this;
		const t = this.t;

		titleEl.setText(t('화자 이름 변경', 'Rename speaker'));

		contentEl.createEl('p', {
			text: t(`현재 노트: ${this.noteName}`, `Current note: ${this.noteName}`),
		});

		if (this.candidates.length === 0) {
			contentEl.createEl('p', {
				text: t(
					'이 노트에서 화자 라벨을 찾지 못했습니다. 변경할 라벨을 직접 입력하세요.',
					'No speaker labels detected in this note. Type the label to replace manually.',
				),
			});

			new Setting(contentEl)
				.setName(t('변경 전', 'From'))
				.addText((text) => {
					text.setPlaceholder('화자 1');
					text.onChange((v) => {
						this.oldName = v;
					});
				});
		} else {
			new Setting(contentEl)
				.setName(t('변경 전', 'From'))
				.setDesc(t('현재 노트의 화자 목록에서 선택', 'Pick a speaker detected in this note'))
				.addDropdown((dd) => {
					for (const c of this.candidates) {
						dd.addOption(c, c);
					}
					dd.setValue(this.oldName);
					dd.onChange((v) => {
						this.oldName = v;
					});
				});
		}

		new Setting(contentEl)
			.setName(t('변경 후', 'To'))
			.setDesc(t('예: 홍길동', 'Example: Hong Gildong'))
			.addText((text) => {
				text.setPlaceholder(t('홍길동', 'Hong Gildong'));
				text.onChange((v) => {
					this.newName = v;
				});
				text.inputEl.addEventListener('keydown', (e) => {
					if (e.key !== 'Enter') return;
					// IME 합성 중인 Enter는 무시 (한글 마지막 글자 확정 시점)
					if (e.isComposing) return;
					e.preventDefault();
					e.stopPropagation();
					this.submit();
				});
				window.setTimeout(() => text.inputEl.focus(), FOCUS_DELAY_MS);
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
