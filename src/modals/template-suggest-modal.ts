import { App, FuzzySuggestModal } from 'obsidian';
import type { TemplateMeta } from '../summary/template-loader';
import type { T } from '../utils/i18n';

export class TemplateSuggestModal extends FuzzySuggestModal<TemplateMeta> {
	private readonly templates: TemplateMeta[];
	private readonly onChoose: (template: TemplateMeta) => void;

	constructor(
		app: App,
		t: T,
		templates: TemplateMeta[],
		onChoose: (template: TemplateMeta) => void,
	) {
		super(app);
		this.templates = templates;
		this.onChoose = onChoose;
		this.setPlaceholder(
			t('사용할 요약 템플릿을 선택하세요...', 'Pick a summary template...'),
		);
	}

	getItems(): TemplateMeta[] {
		return this.templates;
	}

	getItemText(item: TemplateMeta): string {
		return item.favorite ? `⭐ ${item.name}` : item.name;
	}

	onChooseItem(item: TemplateMeta): void {
		this.onChoose(item);
	}
}
