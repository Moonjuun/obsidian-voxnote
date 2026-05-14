import { type App, normalizePath } from 'obsidian';
import type { Lang } from '../utils/i18n';

export interface BuiltInTemplate {
	filename: string;
	content: string;
}

const KO_GUIDE = `<!--
ObsiDeep AI 요약 템플릿입니다.

frontmatter 필드:
  name:         우클릭 메뉴에 표시될 이름
  favorite:     true면 우클릭 메뉴 평면에 노출 (false면 "AI 요약 ▸" 서브메뉴)
  prompt:       Gemini에게 보내는 지시문 (자유롭게 수정 가능)
  placeholders: Gemini가 채울 키와 그 설명. 본문의 {{key}}로 치환됩니다.
                여기에 키를 추가하면 본문에서도 새 키를 사용할 수 있어요.

시스템 placeholder (자동으로 채워지는 변수):
  {{transcript}}  - STT 결과 전문
  {{title}}       - 노트 제목
  {{date}}        - YYYY-MM-DD
  {{datetime}}    - YYYY-MM-DD HH:MM
  {{source}}      - 원본 STT 노트로의 [[wikilink]]
  {{language}}    - UI 언어 라벨
  {{duration}}    - 회의 길이
  {{speakers}}    - 화자 목록 (콤마 구분)

이 파일을 그대로 수정해도 되고, 명령 팔레트의
"새 요약 템플릿 만들기"로 빈 템플릿을 새로 받아도 됩니다.
-->`;

const EN_GUIDE = `<!--
ObsiDeep AI summary template.

Frontmatter fields:
  name:         Display name in the right-click menu.
  favorite:     true → flat in the right-click menu; false → under "AI 요약 ▸" submenu.
  prompt:       Instruction sent to Gemini. Edit freely.
  placeholders: Keys Gemini must fill, with descriptions. Referenced as {{key}} below.
                Add more keys here to expose new fields in the body.

System placeholders (filled by the plugin, not the AI):
  {{transcript}}  - full STT text
  {{title}}       - note title
  {{date}}        - YYYY-MM-DD
  {{datetime}}    - YYYY-MM-DD HH:MM
  {{source}}      - [[wikilink]] back to the source note
  {{language}}    - UI language label
  {{duration}}    - meeting length
  {{speakers}}    - speaker list (comma separated)

Edit this file in place, or run the command palette
"Create new summary template" to scaffold a fresh one.
-->`;

export const BUILT_IN_TEMPLATES_KO: readonly BuiltInTemplate[] = [
	{
		filename: '회의록.md',
		content: `---
name: "회의록"
favorite: true
prompt: |
  아래 회의 전사를 회의록 형식으로 한국어로 요약해줘.
  - decisions: 결정 사항마다 한 줄 불릿, 명확하게.
  - action_items: 마크다운 체크박스 사용. 담당자가 언급되면 "@이름" 형식으로 명시.
placeholders:
  summary: "회의 논의 내용 3-5개 불릿 요약"
  decisions: "결정 사항 불릿 목록"
  action_items: "액션 아이템 체크박스 목록 (담당자 있으면 명시)"
---
${KO_GUIDE}

# {{title}}

> 출처: {{source}} · {{date}} · {{duration}}

## 요약
{{summary}}

## 결정 사항
{{decisions}}

## 액션 아이템
{{action_items}}
`,
	},
	{
		filename: '인터뷰.md',
		content: `---
name: "인터뷰"
favorite: false
prompt: |
  아래 인터뷰 전사를 한국어로 요약해줘.
  - key_quotes: 인터뷰이의 발언을 가능한 한 원문 그대로 유지.
  - topics: 인터뷰에서 다뤄진 주요 주제를 짧은 불릿으로.
placeholders:
  summary: "인터뷰 전반에 대한 간단 요약"
  key_quotes: "대표 발언 3-7개 (가능한 원문 유지)"
  topics: "다뤄진 주제 불릿 목록"
---
${KO_GUIDE}

# {{title}}

> 출처: {{source}} · {{date}}

## 요약
{{summary}}

## 주제
{{topics}}

## 핵심 발언
{{key_quotes}}
`,
	},
	{
		filename: '강의노트.md',
		content: `---
name: "강의노트"
favorite: false
prompt: |
  아래 강의 전사를 학습용 노트로 한국어로 요약해줘.
  - key_concepts: 핵심 개념을 한 줄 설명과 함께 불릿으로.
  - questions: 추가로 공부해볼 만한 질문 / 후속 학습 거리를 불릿으로.
placeholders:
  summary: "강의 전반에 대한 간단 요약"
  key_concepts: "핵심 개념 불릿 + 한 줄 설명"
  questions: "후속 질문 / 학습 거리 불릿"
---
${KO_GUIDE}

# {{title}}

> 출처: {{source}} · {{date}} · {{duration}}

## 요약
{{summary}}

## 핵심 개념
{{key_concepts}}

## 후속 학습
{{questions}}
`,
	},
] as const;

export const BUILT_IN_TEMPLATES_EN: readonly BuiltInTemplate[] = [
	{
		filename: 'Meeting.md',
		content: `---
name: "Meeting"
favorite: true
prompt: |
  Summarize the transcript as meeting minutes.
  - decisions: clear, one bullet per decision.
  - action_items: use checkbox markdown; include "@owner" when an owner is mentioned.
placeholders:
  summary: "3-5 bullet overview of the discussion"
  decisions: "Bullet list of decisions made"
  action_items: "Checkbox list of action items (with owner if mentioned)"
---
${EN_GUIDE}

# {{title}}

> Source: {{source}} · {{date}} · {{duration}}

## Summary
{{summary}}

## Decisions
{{decisions}}

## Action Items
{{action_items}}
`,
	},
	{
		filename: 'Interview.md',
		content: `---
name: "Interview"
favorite: false
prompt: |
  Summarize the interview transcript.
  - key_quotes should preserve the speaker's exact wording.
  - topics is a short list of themes that came up.
placeholders:
  summary: "Brief overview of the interview"
  key_quotes: "3-7 representative quotes (preserved verbatim)"
  topics: "Bullet list of topics covered"
---
${EN_GUIDE}

# {{title}}

> Source: {{source}} · {{date}}

## Summary
{{summary}}

## Topics
{{topics}}

## Key Quotes
{{key_quotes}}
`,
	},
	{
		filename: 'Lecture.md',
		content: `---
name: "Lecture"
favorite: false
prompt: |
  Summarize the lecture transcript for study purposes.
  - key_concepts: main ideas, briefly explained.
  - questions: open questions worth following up on.
placeholders:
  summary: "Concise overview of the lecture"
  key_concepts: "Bullet list of key concepts with one-line explanations"
  questions: "Bullet list of open questions or things to follow up on"
---
${EN_GUIDE}

# {{title}}

> Source: {{source}} · {{date}} · {{duration}}

## Summary
{{summary}}

## Key Concepts
{{key_concepts}}

## Follow-up Questions
{{questions}}
`,
	},
] as const;

export function getBuiltInTemplates(lang: Lang): readonly BuiltInTemplate[] {
	return lang === 'ko' ? BUILT_IN_TEMPLATES_KO : BUILT_IN_TEMPLATES_EN;
}

export type SeedResult = 'seeded' | 'exists' | 'partial' | 'error';

export async function seedBuiltInTemplates(
	app: App,
	templatesFolder: string,
	lang: Lang,
): Promise<SeedResult> {
	const folder = (templatesFolder || 'ObsiDeep/Templates').replace(/\/+$/, '');
	const templates = getBuiltInTemplates(lang);
	try {
		if (!(await app.vault.adapter.exists(folder))) {
			await app.vault.createFolder(folder);
		}
		let createdCount = 0;
		for (const tpl of templates) {
			const path = normalizePath(`${folder}/${tpl.filename}`);
			if (await app.vault.adapter.exists(path)) continue;
			await app.vault.create(path, tpl.content);
			createdCount++;
		}
		if (createdCount === 0) return 'exists';
		if (createdCount === templates.length) return 'seeded';
		return 'partial';
	} catch {
		return 'error';
	}
}
