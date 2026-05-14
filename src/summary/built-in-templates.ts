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
  아래 회의 전사를 회의록 형식으로 한국어로 요약해줘. 모든 응답은 마크다운 형식이며, **명사형 종결어미체**(예: 결정함, 확인함, 논의됨, 공유됨, 예정임, 진행 중)를 사용한다. "~합니다 / ~습니다 / ~다"체는 사용 금지.
  - summary: 마크다운 불릿(\`- ...\`) 3-5개. 각 불릿은 명사형 종결의 한 문장이며, 끝에는 마침표를 붙인다. 각 불릿은 반드시 실제 줄바꿈(\\n)으로 분리.
  - decisions: 결정 사항마다 한 줄 불릿(\`- ...\`). 명사형 종결. 각 항목은 실제 줄바꿈으로 분리. 결정이 없으면 빈 문자열.
  - action_items: 마크다운 체크박스(\`- [ ] ...\`). 담당자가 언급되면 \`@이름\` 명시. 명사형 종결. 각 항목은 실제 줄바꿈으로 분리. 없으면 빈 문자열.
placeholders:
  summary: "마크다운 불릿 목록 (- ...), 명사형 종결, 줄마다 새 줄"
  decisions: "마크다운 불릿 목록 (- ...), 명사형 종결, 줄마다 새 줄"
  action_items: "마크다운 체크박스 목록 (- [ ] ...), 줄마다 새 줄"
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
  아래 인터뷰 전사를 한국어로 요약해줘. 모든 응답은 마크다운 형식.
  - summary: 마크다운 불릿(\`- ...\`) 3-5개. 각 불릿은 실제 줄바꿈(\\n)으로 분리.
  - topics: 다뤄진 주요 주제를 짧은 불릿(\`- ...\`)으로. 각 항목은 새 줄.
  - key_quotes: 인터뷰이의 발언을 마크다운 인용문(\`> ...\`) 형식으로 3-7개. 가능한 원문 유지. 각 인용은 새 줄.
placeholders:
  summary: "마크다운 불릿 목록 (- ...), 줄마다 새 줄"
  topics: "마크다운 불릿 목록 (- ...), 줄마다 새 줄"
  key_quotes: "마크다운 인용문 목록 (> ..., 3-7개), 줄마다 새 줄"
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
  아래 강의 전사를 학습용 노트로 한국어로 요약해줘. 모든 응답은 마크다운 형식.
  - summary: 마크다운 불릿(\`- ...\`) 3-5개. 각 불릿은 실제 줄바꿈(\\n)으로 분리.
  - key_concepts: 핵심 개념을 \`- **개념명**: 한 줄 설명\` 형식의 불릿으로. 각 항목은 새 줄.
  - questions: 후속 학습 거리를 마크다운 불릿(\`- ...\`)으로. 각 항목은 새 줄.
placeholders:
  summary: "마크다운 불릿 목록 (- ...), 줄마다 새 줄"
  key_concepts: "마크다운 불릿 (- **개념**: 설명), 줄마다 새 줄"
  questions: "마크다운 불릿 목록 (- ...), 줄마다 새 줄"
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
  Summarize the transcript as meeting minutes. All responses must be markdown. Use a **concise note-style tone** — short past-tense or noun-phrase fragments (e.g., "Decided to ship by Friday.", "Reviewed Q2 roadmap.", "Pending: legal review."). Avoid full conversational sentences such as "We decided that we should..." or "The team discussed how...".
  - summary: markdown bullets (\`- ...\`), 3-5 items, one short sentence each. Each bullet MUST be on its own line, separated by a real newline (\\n).
  - decisions: one-line markdown bullet (\`- ...\`) per decision, note-style. Each on its own line. Empty string if none.
  - action_items: markdown checkboxes (\`- [ ] ...\`). Include \`@owner\` when an owner is mentioned. Each on its own line. Empty if none.
placeholders:
  summary: "Markdown bullet list (- ...), concise note-style, one item per line"
  decisions: "Markdown bullet list (- ...), one item per line"
  action_items: "Markdown checkbox list (- [ ] ...), one item per line"
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
  Summarize the interview transcript. All responses must be markdown.
  - summary: markdown bullets (\`- ...\`), 3-5 items. Each bullet on its own line, separated by a real newline (\\n).
  - topics: short markdown bullets (\`- ...\`) of themes covered. Each on its own line.
  - key_quotes: 3-7 quotes as markdown blockquotes (\`> ...\`). Preserve the speaker's exact wording. Each quote on its own line.
placeholders:
  summary: "Markdown bullet list (- ...), one item per line"
  topics: "Markdown bullet list (- ...), one item per line"
  key_quotes: "Markdown blockquote list (> ..., 3-7 items), one quote per line"
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
  Summarize the lecture transcript for study purposes. All responses must be markdown.
  - summary: markdown bullets (\`- ...\`), 3-5 items. Each bullet on its own line, separated by a real newline (\\n).
  - key_concepts: markdown bullets formatted as \`- **concept**: one-line explanation\`. Each on its own line.
  - questions: markdown bullets (\`- ...\`) of open questions or follow-up topics. Each on its own line.
placeholders:
  summary: "Markdown bullet list (- ...), one item per line"
  key_concepts: "Markdown bullets (- **concept**: explanation), one item per line"
  questions: "Markdown bullet list (- ...), one item per line"
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
