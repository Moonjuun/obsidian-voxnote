import { type App, normalizePath } from 'obsidian';
import { ensureFolder } from './runner';

export const STARTER_TEMPLATE_CONTENT = `---
name: "새 템플릿"
favorite: false
prompt: |
  Replace this with what you want the AI to do.
  Example: "Summarize the meeting in Korean. action_items should use checkboxes."
placeholders:
  summary: "Short overall summary"
  key_points: "Bullet list of key points"
---
<!--
System placeholders (filled by the plugin, not the AI):
  {{transcript}}  - full STT text
  {{title}}       - note title
  {{date}}        - YYYY-MM-DD
  {{datetime}}    - YYYY-MM-DD HH:MM
  {{source}}      - [[wikilink]] back to source note
  {{language}}    - UI language label
  {{duration}}    - HH:MM:SS or MM:SS
  {{speakers}}    - comma-separated speaker labels

AI placeholders are declared above in the "placeholders" map.
Use them inside the body with {{key}} just like the system ones.
-->

# {{title}}

> Source: {{source}}

## Summary
{{summary}}

## Key Points
{{key_points}}
`;

export async function resolveStarterPath(
	app: App,
	templatesFolder: string,
	baseName: string,
): Promise<string> {
	const folder = (templatesFolder || 'ObsiDeep/Templates').replace(/\/+$/, '');
	const safeBase = (baseName || 'new-template').replace(/[\\/:*?"<>|]/g, '_').trim() || 'new-template';
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
	baseName = 'new-template',
): Promise<string> {
	const path = await resolveStarterPath(app, templatesFolder, baseName);
	await ensureFolder(app, path);
	await app.vault.create(path, STARTER_TEMPLATE_CONTENT);
	return path;
}
