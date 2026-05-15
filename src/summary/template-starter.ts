import { type App, normalizePath } from 'obsidian';
import type { Lang } from '../utils/i18n';
import { ensureFolder } from './runner';

const STARTER_KO = `---
name: "새 템플릿"
favorite: false
prompt: |
  여기에 AI에게 시킬 작업을 적으세요.
  예: "회의 전사를 한국어로 요약해줘. action_items는 체크박스로."
placeholders:
  summary: "전반적인 짧은 요약"
  key_points: "핵심 포인트 불릿"
---
<!--
VoxNote AI 요약 템플릿입니다.

frontmatter 필드:
  name:         우클릭 메뉴에 표시될 이름
  favorite:     true면 우클릭 메뉴 평면에 노출 (false면 "AI 요약 ▸" 서브메뉴)
  prompt:       Gemini에게 보내는 지시문
  placeholders: Gemini가 채울 키와 그 설명. 본문의 {{key}}로 치환됩니다.

시스템 placeholder (자동으로 채워지는 변수):
  {{transcript}}  - STT 결과 전문
  {{title}}       - 노트 제목
  {{date}}        - YYYY-MM-DD
  {{datetime}}    - YYYY-MM-DD HH:MM
  {{source}}      - 원본 STT 노트로의 [[wikilink]]
  {{language}}    - UI 언어 라벨
  {{duration}}    - 회의 길이
  {{speakers}}    - 화자 목록 (콤마 구분)
-->

# {{title}}

> 출처: {{source}}

## 요약
{{summary}}

## 핵심 포인트
{{key_points}}
`;

const STARTER_EN = `---
name: "New template"
favorite: false
prompt: |
  Replace this with what you want the AI to do.
  Example: "Summarize the meeting in Korean. action_items should use checkboxes."
placeholders:
  summary: "Short overall summary"
  key_points: "Bullet list of key points"
---
<!--
VoxNote AI summary template.

Frontmatter fields:
  name:         Display name in the right-click menu.
  favorite:     true → flat in the right-click menu; false → under "AI 요약 ▸" submenu.
  prompt:       Instruction sent to Gemini.
  placeholders: Keys Gemini must fill, with descriptions. Referenced as {{key}} below.

System placeholders (filled by the plugin, not the AI):
  {{transcript}}  - full STT text
  {{title}}       - note title
  {{date}}        - YYYY-MM-DD
  {{datetime}}    - YYYY-MM-DD HH:MM
  {{source}}      - [[wikilink]] back to the source note
  {{language}}    - UI language label
  {{duration}}    - meeting length
  {{speakers}}    - speaker list (comma separated)
-->

# {{title}}

> Source: {{source}}

## Summary
{{summary}}

## Key Points
{{key_points}}
`;

export function getStarterTemplate(lang: Lang): string {
	return lang === 'ko' ? STARTER_KO : STARTER_EN;
}

export function defaultStarterBaseName(lang: Lang): string {
	return lang === 'ko' ? '새 템플릿' : 'new-template';
}

export async function resolveStarterPath(
	app: App,
	templatesFolder: string,
	baseName: string,
): Promise<string> {
	const folder = (templatesFolder || 'VoxNote/Templates').replace(/\/+$/, '');
	const safeBase =
		(baseName || 'new-template').replace(/[\\/:*?"<>|]/g, '_').trim() || 'new-template';
	let path = normalizePath(`${folder}/${safeBase}.md`);
	let counter = 2;
	while (await app.vault.adapter.exists(path)) {
		path = normalizePath(`${folder}/${safeBase} (${counter}).md`);
		counter++;
	}
	return path;
}

export async function createStarterTemplate(
	app: App,
	templatesFolder: string,
	lang: Lang,
	baseName?: string,
): Promise<string> {
	const name = baseName ?? defaultStarterBaseName(lang);
	const path = await resolveStarterPath(app, templatesFolder, name);
	await ensureFolder(app, path);
	await app.vault.create(path, getStarterTemplate(lang));
	return path;
}
