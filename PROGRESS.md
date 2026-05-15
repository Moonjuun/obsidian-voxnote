# Gemini AI Summary Feature — Progress

Track for the Ralph Loop. Each loop iteration: read this file, pick the lowest-numbered unchecked item with dependencies satisfied, complete it (implementation + colocated test if applicable), then update status. Run `npm run build` and `vitest run` at the end of every loop and record the result at the bottom.

## Implementation

- [x] 1. `src/settings.ts` — add `geminiApiKey`, `geminiModel` (`'gemini-2.5-flash' | 'gemini-2.5-pro'`), `templatesFolder` (default `'VoxNote/Templates'`), `summariesFolder` (default `'VoxNote/AI-Summaries'`)
- [x] 2. `src/providers/types.ts` — `SummaryProvider` interface
- [x] 3. `src/providers/gemini.ts` — Gemini 2.5 structured output via fetch; dynamic JSON schema from `placeholders`; 1× retry on parse failure
- [x] 4. `src/template-loader.ts` — scan templates folder, parse frontmatter via Obsidian `parseYaml`, sort favorites-first then alphabetic
- [x] 5. `src/summary-engine.ts` — placeholder substitution (system + AI), source backlink frontmatter injection
- [x] 6. `src/commands/summarize-note.ts` — summarize an existing STT note with a chosen template (palette command + helpers; menu wiring deferred to item 9). Includes `src/summary-runner.ts`, `src/modals/template-suggest-modal.ts`, and `languageLabel()` helper in `src/utils/i18n.ts`.
- [x] 7. `src/commands/transcribe-and-summarize.ts` — STT then summarize, 2 files; STT-failure aborts, summary-failure preserves STT + Notice
- [x] 8. `src/commands/create-template.ts` — create starter template in templates folder; (2), (3) suffix on collision. Pure logic in `src/template-starter.ts`.
- [x] 9. `src/main.ts` — register file-menu handlers for audio + markdown files; submenu structure; favorites flat; hide AI items when no API key. Implemented as `src/menu-registration.ts` with `MenuItem.setSubmenu()` typing augmentation. Existing `transcribe-to-note.ts` file-menu removed (now centralized).
- [x] 10. `src/settings-tab.ts` — Gemini section (api key, model dropdown, templates folder, summaries folder) inserted between "Save" and "Transcription"
- [x] 11. `src/built-in-templates.ts` — seed Meeting (favorite), Interview, Lecture; wired into `consent-side-effects.ts` (`templates` result) and `main.ts` notify; folders Templates/ and AI-Summaries/ also created at consent time
- [x] 12. `src/utils/i18n.ts` — `languageLabel()` helper added. All new user-visible strings throughout new files use inline `t(ko, en)` (project convention).
- [x] 13. Docs — README.md, README-ko.md, FEATURES.md (new "AI 요약 (Gemini)" section), CHANGELOG.md (new [1.1.0] entry)
- [x] 14. Version bump — manifest.json 1.0.9 → 1.1.0, package.json 1.0.9 → 1.1.0. versions.json untouched (existing 1.8.7 entry covers; version-bump.mjs only adds when minAppVersion changes).

## Tests

- [x] T1. `tests/providers/gemini.test.ts` — fetch mocked via injected requester; success/4xx/5xx/bad JSON/missing-key/retry/network-error/non-string coercion
- [x] T2. `tests/template-loader.test.ts` — splitFrontmatter (incl. CRLF), interpretTemplate (full/fallback/missing fields/non-object/coercion/favorite-strictness/language), parseTemplate (full/no-fm/yaml-throws), sortTemplates (favorites-first, alpha, empty)
- [x] T3. `tests/summary-engine.test.ts` — buildSystemPlaceholders (date/datetime/duration/speakers/source), renderBody (AI/system/unknown/non-recursive/AI-overrides-system), buildSummaryFrontmatter, composeSummaryFile, buildGeminiPrompt, escapeYaml
- [x] T4. `tests/commands/summarize-note.test.ts` — sanitizeFilename, extractTranscriptFromMarkdown, resolveSummaryPath (collision (2)/(3)), ensureFolder, runSummary (full path/folder auto-create/provider error/prompt-transcript wiring)
- [x] T5. `tests/commands/create-template.test.ts` — resolveStarterPath (base/(2)/(3)/sanitize/empty fallback), createStarterTemplate (folder auto-create, collision), STARTER_TEMPLATE_CONTENT shape checks

## Each-loop gates

- [x] G1. `npm run build` passes (tsc strict + esbuild)
- [x] G2. `vitest run` passes (existing + new tests)
- [x] G3. `npm run lint` passes (no errors, no warnings)

## Completion criterion

All items in Implementation + Tests checked, and the final loop run records G1 + G2 both green in the status block below.

## Last build/test status

- Iteration: 3 (final)
- `npm run build`: pass (v1.1.0)
- `vitest run`: 98 passed (8 files)
- `npm run lint`: clean (0 errors, 0 warnings)
- Notes: items 7, 9, 10, 11, 12, 13, 14 all done in iteration 3. All 14 implementation items + all 5 test items complete. Manifest/package version bumped to 1.1.0. Loop completion_promise satisfied.

## Completion summary

- 14 new/modified source files: `settings.ts`, `providers/types.ts`, `providers/gemini.ts`, `template-loader.ts`, `summary-engine.ts`, `summary-runner.ts`, `template-starter.ts`, `built-in-templates.ts`, `menu-registration.ts`, `commands/summarize-note.ts`, `commands/transcribe-and-summarize.ts`, `commands/create-template.ts`, `modals/template-suggest-modal.ts`, plus updates to `commands/transcribe-to-note.ts`, `settings-tab.ts`, `consent-side-effects.ts`, `main.ts`, `utils/i18n.ts`.
- 6 new test files: `tests/providers/gemini.test.ts`, `tests/template-loader.test.ts`, `tests/summary-engine.test.ts`, `tests/commands/summarize-note.test.ts`, `tests/commands/create-template.test.ts`, `tests/built-in-templates.test.ts` — 77 new cases.
- Existing functionality (STT-only flow) unchanged; AI menus auto-hide when no Gemini key is set.
- The right-click flat `"Transcribe with Deepgram"` audio menu item moved into the new `VoxNote ▸` submenu (the in-app affordance changes, but the command palette entry "Transcribe audio → meeting note" is unchanged).

## Open questions

_(record uncertainties here for the next loop / user)_
