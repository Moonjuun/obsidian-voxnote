import { App, FuzzySuggestModal, TFile } from 'obsidian';
import { isAudioFile } from './audio-utils';
import type { T } from './i18n';

export class AudioSuggestModal extends FuzzySuggestModal<TFile> {
	private readonly onChoose: (file: TFile) => void;

	constructor(app: App, t: T, onChoose: (file: TFile) => void) {
		super(app);
		this.onChoose = onChoose;
		this.setPlaceholder(t('STT로 변환할 오디오 파일을 선택하세요...', 'Select an audio file to transcribe...'));
	}

	getItems(): TFile[] {
		return this.app.vault
			.getFiles()
			.filter(isAudioFile)
			.sort((a, b) => b.stat.mtime - a.stat.mtime);
	}

	getItemText(file: TFile): string {
		return file.path;
	}

	onChooseItem(file: TFile): void {
		this.onChoose(file);
	}
}
