import { App, FuzzySuggestModal, TFile } from 'obsidian';
import { isAudioFile } from './audio-utils';

export class AudioSuggestModal extends FuzzySuggestModal<TFile> {
	private readonly onChoose: (file: TFile) => void;

	constructor(app: App, onChoose: (file: TFile) => void) {
		super(app);
		this.onChoose = onChoose;
		this.setPlaceholder('STT로 변환할 오디오 파일을 선택하세요...');
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
