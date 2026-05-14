import { Menu, TAbstractFile, TFile } from 'obsidian';
import type DeepgramSttPlugin from './main';
import { isAudioFile } from './utils/audio-utils';
import type { TemplateMeta } from './summary/template-loader';
import { TitleInputModal } from './modals/title-input-modal';
import { runTranscribeToNote } from './commands/transcribe-to-note';
import { runTranscribeAndSummarize } from './commands/transcribe-and-summarize';
import { summarizeNoteWithTemplate } from './commands/summarize-note';
import { checkReady, notifyIfBlocked } from './utils/guards';

declare module 'obsidian' {
	interface MenuItem {
		setSubmenu(): Menu;
	}
}

export function registerFileMenus(plugin: DeepgramSttPlugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
			if (!(file instanceof TFile)) return;
			if (isAudioFile(file)) {
				buildAudioMenu(plugin, menu, file);
				return;
			}
			if (file.extension === 'md') {
				buildMarkdownMenu(plugin, menu, file);
			}
		}),
	);
}

function buildAudioMenu(plugin: DeepgramSttPlugin, menu: Menu, file: TFile): void {
	const templates = hasGeminiKey(plugin) ? plugin.templatesCache : [];
	const favorites = templates.filter((t) => t.favorite);
	const others = templates.filter((t) => !t.favorite);

	menu.addItem((item) => {
		item.setTitle(plugin.t('ObsiDeep', 'ObsiDeep')).setIcon('mic');
		const submenu = item.setSubmenu();

		submenu.addItem((it) =>
			it
				.setTitle(plugin.t('STT만 추출', 'Transcribe only'))
				.setIcon('mic')
				.onClick(() => {
					if (!notifyIfBlocked(checkReady(plugin.settings), plugin.t)) return;
					askTitleThenTranscribeOnly(plugin, file);
				}),
		);

		if (favorites.length > 0 || others.length > 0) submenu.addSeparator();

		for (const tpl of favorites) {
			submenu.addItem((it) =>
				it
					.setTitle(
						plugin.t(
							`⭐ STT + 요약: ${tpl.name}`,
							`⭐ Transcribe + summary: ${tpl.name}`,
						),
					)
					.setIcon('sparkles')
					.onClick(() => askTitleThenTranscribeAndSummarize(plugin, file, tpl)),
			);
		}

		if (others.length > 0) {
			if (favorites.length > 0) submenu.addSeparator();
			submenu.addItem((aiItem) => {
				aiItem.setTitle(plugin.t('AI 요약', 'AI summary')).setIcon('sparkles');
				const aiSub = aiItem.setSubmenu();
				for (const tpl of others) {
					aiSub.addItem((it) =>
						it
							.setTitle(`STT + ${tpl.name}`)
							.onClick(() => askTitleThenTranscribeAndSummarize(plugin, file, tpl)),
					);
				}
			});
		}
	});
}

function buildMarkdownMenu(plugin: DeepgramSttPlugin, menu: Menu, file: TFile): void {
	if (!hasGeminiKey(plugin)) return;
	const templates = plugin.templatesCache;
	if (templates.length === 0) return;
	const favorites = templates.filter((t) => t.favorite);
	const others = templates.filter((t) => !t.favorite);

	menu.addItem((item) => {
		item.setTitle(plugin.t('ObsiDeep', 'ObsiDeep')).setIcon('sparkles');
		const submenu = item.setSubmenu();

		for (const tpl of favorites) {
			submenu.addItem((it) =>
				it
					.setTitle(
						plugin.t(`⭐ AI 요약: ${tpl.name}`, `⭐ AI summary: ${tpl.name}`),
					)
					.setIcon('sparkles')
					.onClick(() => void summarizeNoteWithTemplate(plugin, file, tpl)),
			);
		}

		if (others.length > 0) {
			if (favorites.length > 0) submenu.addSeparator();
			submenu.addItem((aiItem) => {
				aiItem.setTitle(plugin.t('AI 요약', 'AI summary')).setIcon('sparkles');
				const aiSub = aiItem.setSubmenu();
				for (const tpl of others) {
					aiSub.addItem((it) =>
						it
							.setTitle(tpl.name)
							.onClick(() => void summarizeNoteWithTemplate(plugin, file, tpl)),
					);
				}
			});
		}
	});
}

function hasGeminiKey(plugin: DeepgramSttPlugin): boolean {
	return Boolean(plugin.settings.geminiApiKey && plugin.settings.geminiApiKey.trim());
}

function askTitleThenTranscribeOnly(plugin: DeepgramSttPlugin, file: TFile): void {
	new TitleInputModal(plugin.app, plugin.t, file.basename, (title) => {
		void runTranscribeToNote(plugin, file, title);
	}).open();
}

function askTitleThenTranscribeAndSummarize(
	plugin: DeepgramSttPlugin,
	file: TFile,
	template: TemplateMeta,
): void {
	if (!notifyIfBlocked(checkReady(plugin.settings), plugin.t)) return;
	new TitleInputModal(plugin.app, plugin.t, file.basename, (title) => {
		void runTranscribeAndSummarize(plugin, file, title, template);
	}).open();
}
