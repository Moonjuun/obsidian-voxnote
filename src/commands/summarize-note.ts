import { Notice, TFile } from 'obsidian';
import type DeepgramSttPlugin from '../main';
import { GeminiProvider } from '../providers/gemini';
import { loadTemplates, type TemplateMeta } from '../summary/template-loader';
import {
	extractTranscriptFromMarkdown,
	runSummary,
} from '../summary/runner';
import { TemplateSuggestModal } from '../modals/template-suggest-modal';
import { detectLang, languageLabel } from '../utils/i18n';
import { NoticeDuration } from '../utils/constants';

export function registerSummarizeNoteCommand(plugin: DeepgramSttPlugin): void {
	plugin.addCommand({
		id: 'summarize-note',
		name: plugin.t(
			'현재 노트를 AI로 요약',
			'Summarize current note with AI',
		),
		checkCallback: (checking: boolean) => {
			const file = plugin.app.workspace.getActiveFile();
			const ready = isReady(plugin) && file instanceof TFile && file.extension === 'md';
			if (checking) return ready;
			if (!ready || !(file instanceof TFile)) return false;
			void pickTemplateAndSummarize(plugin, file);
			return true;
		},
	});
}

export function isReady(plugin: DeepgramSttPlugin): boolean {
	return Boolean(plugin.settings.geminiApiKey && plugin.settings.geminiApiKey.trim());
}

export async function pickTemplateAndSummarize(
	plugin: DeepgramSttPlugin,
	file: TFile,
): Promise<void> {
	const templates = await loadTemplates(plugin.app, plugin.settings.templatesFolder);
	if (templates.length === 0) {
		new Notice(
			plugin.t(
				'사용 가능한 템플릿이 없습니다. Templates 폴더에 템플릿을 추가하세요.',
				'No templates available. Add one to the Templates folder.',
			),
			NoticeDuration.Long,
		);
		return;
	}
	new TemplateSuggestModal(plugin.app, plugin.t, templates, (template) => {
		void summarizeNoteWithTemplate(plugin, file, template);
	}).open();
}

export async function summarizeNoteWithTemplate(
	plugin: DeepgramSttPlugin,
	file: TFile,
	template: TemplateMeta,
): Promise<void> {
	const t = plugin.t;
	const progress = new Notice(
		t(`AI 요약 생성 중: ${template.name}...`, `Generating summary: ${template.name}...`),
		0,
	);
	try {
		const raw = await plugin.app.vault.read(file);
		const transcript = extractTranscriptFromMarkdown(raw);
		const provider = new GeminiProvider({
			apiKey: plugin.settings.geminiApiKey,
			model: plugin.settings.geminiModel,
		});
		const lang = detectLang(plugin.settings.uiLanguage);
		const { path } = await runSummary(
			plugin.app,
			provider,
			plugin.settings.summariesFolder,
			{
				template,
				transcript,
				title: file.basename,
				sourcePath: file.path,
				uiLanguageLabel: languageLabel(lang),
			},
		);
		progress.hide();
		await plugin.app.workspace.openLinkText(path, '', false);
		new Notice(t(`✓ 요약 생성: ${path}`, `✓ Summary created: ${path}`), NoticeDuration.Medium);
	} catch (e) {
		progress.hide();
		plugin.reportError(e);
	}
}
