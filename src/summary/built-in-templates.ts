import { type App, normalizePath } from 'obsidian';

export interface BuiltInTemplate {
	filename: string;
	content: string;
}

export const BUILT_IN_TEMPLATES: readonly BuiltInTemplate[] = [
	{
		filename: 'Meeting.md',
		content: `---
name: "Meeting"
favorite: true
prompt: |
  Summarize the transcript as meeting minutes.
  - decisions: clear, one bullet per decision.
  - action_items: use checkbox markdown; include owner name when present.
placeholders:
  summary: "3-5 bullet overview of the discussion"
  decisions: "Bullet list of decisions made"
  action_items: "Checkbox list of action items (with owner if mentioned)"
---
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
  - key_concepts should be the main ideas, briefly explained.
  - questions are open questions worth following up on.
placeholders:
  summary: "Concise overview of the lecture"
  key_concepts: "Bullet list of key concepts with one-line explanations"
  questions: "Bullet list of open questions or things to follow up on"
---
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

export type SeedResult = 'seeded' | 'exists' | 'partial' | 'error';

export async function seedBuiltInTemplates(
	app: App,
	templatesFolder: string,
): Promise<SeedResult> {
	const folder = (templatesFolder || 'ObsiDeep/Templates').replace(/\/+$/, '');
	try {
		if (!(await app.vault.adapter.exists(folder))) {
			await app.vault.createFolder(folder);
		}
		let createdCount = 0;
		for (const tpl of BUILT_IN_TEMPLATES) {
			const path = normalizePath(`${folder}/${tpl.filename}`);
			if (await app.vault.adapter.exists(path)) continue;
			await app.vault.create(path, tpl.content);
			createdCount++;
		}
		if (createdCount === 0) return 'exists';
		if (createdCount === BUILT_IN_TEMPLATES.length) return 'seeded';
		return 'partial';
	} catch {
		return 'error';
	}
}
