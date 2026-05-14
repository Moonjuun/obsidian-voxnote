import { Notice } from 'obsidian';
import type DeepgramSttPlugin from '../main';
import { createStarterTemplate } from '../summary/template-starter';
import { detectLang } from '../utils/i18n';
import { NoticeDuration } from '../utils/constants';

export function registerCreateTemplateCommand(plugin: DeepgramSttPlugin): void {
	plugin.addCommand({
		id: 'create-summary-template',
		name: plugin.t(
			'새 요약 템플릿 만들기',
			'Create new summary template',
		),
		callback: () => {
			void runCreateTemplate(plugin);
		},
	});
}

async function runCreateTemplate(plugin: DeepgramSttPlugin): Promise<void> {
	const t = plugin.t;
	try {
		const lang = detectLang(plugin.settings.uiLanguage);
		const path = await createStarterTemplate(
			plugin.app,
			plugin.settings.templatesFolder,
			lang,
		);
		await plugin.app.workspace.openLinkText(path, '', false);
		new Notice(
			t(`✓ 템플릿 생성: ${path}`, `✓ Template created: ${path}`),
			NoticeDuration.Medium,
		);
	} catch (e) {
		plugin.reportError(e);
	}
}
