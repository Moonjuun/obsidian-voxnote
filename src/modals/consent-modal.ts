import { App, Modal, Setting } from 'obsidian';
import type { T } from '../utils/i18n';

export class ConsentModal extends Modal {
	private readonly onAcknowledge: () => Promise<void> | void;
	private readonly onCloseCallback?: (acknowledged: boolean) => void;
	private readonly t: T;
	private acknowledged = false;
	private inFlight = false;
	private closeFired = false;

	constructor(
		app: App,
		t: T,
		onAcknowledge: () => Promise<void> | void,
		onCloseCallback?: (acknowledged: boolean) => void,
	) {
		super(app);
		this.t = t;
		this.onAcknowledge = onAcknowledge;
		this.onCloseCallback = onCloseCallback;
	}

	onOpen() {
		const { contentEl, titleEl } = this;
		const t = this.t;

		titleEl.setText(t('데이터 전송 안내', 'Data transmission notice'));

		contentEl.createEl('p', {
			text: t(
				'이 플러그인은 오디오 파일을 Deepgram(외부 API)에 전송해 STT 결과를 받아옵니다.',
				'This plugin sends audio files to Deepgram (external API) to receive STT results.',
			),
		});

		const ul = contentEl.createEl('ul');
		ul.createEl('li', {
			text: t(
				'회의 참석자에게 사전 동의를 받으시는 것을 권장합니다.',
				'We recommend obtaining prior consent from meeting participants.',
			),
		});
		ul.createEl('li', {
			text: t(
				'API 키는 로컬 data.json에 평문 저장되며 외부로 전송되지 않습니다.',
				'Your API key is stored as plain JSON locally (data.json) and is not transmitted elsewhere.',
			),
		});
		ul.createEl('li', {
			text: t(
				'동의 시 vault 루트에 VoxNote/ 폴더가 자동 생성되고 .gitignore 보호 룰이 추가됩니다.',
				'On consent, an VoxNote/ folder is auto-created at the vault root and .gitignore protection rules are added.',
			),
		});

		contentEl.createEl('p', {
			text: t(
				'자세한 사용법은 동의 후 생성되는 VoxNote/README.md를 참고해주세요.',
				'For detailed usage, see VoxNote/README.md (created after consent).',
			),
			attr: { style: 'margin-top: 12px; opacity: 0.8;' },
		});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText(t('동의하고 시작', 'I agree, get started'))
				.setCta()
				.onClick(async () => {
					if (this.inFlight || this.acknowledged) return;
					this.inFlight = true;
					this.acknowledged = true;
					btn.setDisabled(true).setButtonText(t('진행 중...', 'Processing...'));
					try {
						await this.onAcknowledge();
					} catch (e) {
						console.error('[VoxNote] consent side effects failed:', e);
					} finally {
						this.inFlight = false;
						this.close();
					}
				}),
		);
	}

	onClose() {
		if (this.closeFired) return;
		this.closeFired = true;
		this.contentEl.empty();
		this.onCloseCallback?.(this.acknowledged);
	}
}
