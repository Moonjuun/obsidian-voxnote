import { Notice, TFile } from 'obsidian';
import type DeepgramSttPlugin from '../main';
import { AudioSuggestModal } from '../modals/audio-suggest-modal';
import { TitleInputModal } from '../modals/title-input-modal';
import { TemplateSuggestModal } from '../modals/template-suggest-modal';
import { GeminiProvider } from '../providers/gemini';
import { loadTemplates, type TemplateMeta } from '../summary/template-loader';
import { createTranscriptNote } from '../note-writer';
import { runSummary } from '../summary/runner';
import { checkReady, notifyIfBlocked } from '../utils/guards';
import { isAudioFile, formatDuration } from '../utils/audio-utils';
import { detectLang, languageLabel } from '../utils/i18n';
import { NoticeDuration } from '../utils/constants';

export function registerTranscribeAndSummarizeCommand(plugin: DeepgramSttPlugin): void {
	plugin.addCommand({
		id: 'transcribe-and-summarize',
		name: plugin.t(
			'STT + AI 요약 (Transcribe and summarize)',
			'Transcribe + AI summary',
		),
		callback: () => {
			if (!notifyIfBlocked(checkReady(plugin.settings), plugin.t)) return;
			if (!hasGeminiKey(plugin)) {
				new Notice(
					plugin.t(
						'Gemini API 키가 설정되지 않았습니다. 설정 탭에서 키를 입력하세요.',
						'Gemini API key is not set. Configure it in settings.',
					),
					NoticeDuration.Long,
				);
				return;
			}
			new AudioSuggestModal(plugin.app, plugin.t, (file) => {
				askTitleAndPickTemplate(plugin, file);
			}).open();
		},
	});
}

export function hasGeminiKey(plugin: DeepgramSttPlugin): boolean {
	return Boolean(plugin.settings.geminiApiKey && plugin.settings.geminiApiKey.trim());
}

function askTitleAndPickTemplate(plugin: DeepgramSttPlugin, file: TFile): void {
	new TitleInputModal(plugin.app, plugin.t, file.basename, (title) => {
		void pickTemplateAndRun(plugin, file, title);
	}).open();
}

async function pickTemplateAndRun(
	plugin: DeepgramSttPlugin,
	file: TFile,
	title: string,
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
		void runTranscribeAndSummarize(plugin, file, title, template);
	}).open();
}

export async function runTranscribeAndSummarize(
	plugin: DeepgramSttPlugin,
	file: TFile,
	title: string,
	template: TemplateMeta,
): Promise<void> {
	if (!isAudioFile(file)) {
		new Notice(plugin.t('오디오 파일이 아닙니다.', 'Not an audio file.'));
		return;
	}
	const t = plugin.t;

	const sttProgress = new Notice(
		t(`Deepgram: ${file.name} 변환 중...`, `Deepgram: transcribing ${file.name}...`),
		0,
	);
	let sttPath: string;
	let transcript: string;
	let durationSeconds: number;
	let speakers: string[];
	try {
		const result = await plugin.transcribeFile(file);
		sttPath = await createTranscriptNote(plugin.app, {
			title,
			audioPath: file.path,
			result,
			settings: plugin.settings,
		});
		transcript = plugin.settings.diarize ? result.speakersTranscript : result.transcript;
		durationSeconds = result.duration;
		speakers = result.speakers;
		sttProgress.hide();
		new Notice(
			t(
				`✓ 회의록 생성: ${sttPath} (${formatDuration(durationSeconds)})`,
				`✓ Note created: ${sttPath} (${formatDuration(durationSeconds)})`,
			),
			NoticeDuration.Medium,
		);
	} catch (e) {
		sttProgress.hide();
		plugin.reportError(e);
		return;
	}

	const summaryProgress = new Notice(
		t(
			`AI 요약 생성 중: ${template.name}...`,
			`Generating summary: ${template.name}...`,
		),
		0,
	);
	try {
		const provider = new GeminiProvider({
			apiKey: plugin.settings.geminiApiKey,
			model: plugin.settings.geminiModel,
		});
		const lang = detectLang(plugin.settings.uiLanguage);
		const { path: summaryPath } = await runSummary(
			plugin.app,
			provider,
			plugin.settings.summariesFolder,
			{
				template,
				transcript,
				title,
				sourcePath: sttPath,
				uiLanguageLabel: languageLabel(lang),
				durationSeconds,
				speakers,
			},
		);
		summaryProgress.hide();
		await plugin.app.workspace.openLinkText(summaryPath, '', false);
		new Notice(
			t(`✓ 요약 생성: ${summaryPath}`, `✓ Summary created: ${summaryPath}`),
			NoticeDuration.Medium,
		);
	} catch (e) {
		summaryProgress.hide();
		const msg = e instanceof Error ? e.message : String(e);
		new Notice(
			t(
				`⚠ 요약 실패 (STT는 저장됨): ${msg}`,
				`⚠ Summary failed (STT preserved): ${msg}`,
			),
			NoticeDuration.Error,
		);
		console.error('[ObsiDeep] summary failed after STT:', e);
	}
}
