import { App, Modal, Setting } from 'obsidian';

export class ConsentModal extends Modal {
	private readonly onAcknowledge: () => Promise<void> | void;

	constructor(app: App, onAcknowledge: () => Promise<void> | void) {
		super(app);
		this.onAcknowledge = onAcknowledge;
	}

	onOpen() {
		const { contentEl, titleEl } = this;

		titleEl.setText('데이터 전송 안내');

		contentEl.createEl('p', {
			text: '이 플러그인은 회의 녹음 등 오디오 파일을 Deepgram(외부 API)에 전송하여 음성 인식 결과를 받아옵니다.',
		});

		const considerationsEl = contentEl.createEl('div');
		considerationsEl.createEl('p', {
			text: '사용 전 확인해주세요:',
			attr: { style: 'margin-bottom: 4px; font-weight: 600;' },
		});
		const ul = considerationsEl.createEl('ul');
		ul.createEl('li', {
			text: '회의 참석자에게 녹음·외부 전송에 대한 사전 동의를 받는 것을 권장합니다.',
		});
		ul.createEl('li', {
			text: 'API 키는 이 기기의 vault 설정 파일(data.json)에 평문으로 저장됩니다.',
		});
		ul.createEl('li', {
			text: '동의 시 vault 루트에 Audio/ 폴더를 자동 생성합니다. 회의 녹음 파일은 이 폴더에 넣으시면 됩니다.',
		});
		ul.createEl('li', {
			text: 'vault 루트의 .gitignore에 다음 두 가지 보호 룰을 자동 추가합니다 (.gitignore가 없는 경우 건너뜀): data.json (API 키 노출 차단), Audio/ (회의 녹음 외부 유출 차단).',
		});
		ul.createEl('li', {
			text: '필요 시 설정에서 Deepgram Zero Retention 옵션을 켜 외부 보관을 비활성화할 수 있습니다 (요금제 조건 확인 필요).',
		});

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText('동의하고 시작')
					.setCta()
					.onClick(async () => {
						await this.onAcknowledge();
						this.close();
					}),
			);
	}

	onClose() {
		this.contentEl.empty();
	}
}
