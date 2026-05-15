## [Unreleased]

## [2.0.0] - 2026-05-15

### Breaking
- **Plugin re-listed under new id `voxnote` (was `deepgram-meeting-stt`).** The Obsidian community directory does not allow renaming the catalog display name of an already-registered plugin via self-service editing, and PR-based updates to `obsidian-releases` have been deprecated. To complete the rebrand from "Deepgram Meeting STT" to "VoxNote", the old listing was withdrawn from the directory and the plugin was re-submitted as a new entry under id `voxnote`.

### Migration (REQUIRED for existing v1.x users)
v1.x users on `deepgram-meeting-stt` **will not receive 2.0.0 as an automatic update** — Obsidian treats it as an unrelated plugin because the id changed. To switch:

1. In Obsidian → Settings → Community plugins, **uninstall** the old "Deepgram Meeting STT" plugin (it may already show as "removed" / unavailable after the old listing was withdrawn).
2. **Search for "VoxNote"** in Community plugins → Browse, and install it.
3. **Re-enter your API keys** (Deepgram + Gemini if used) — the data.json path moved from `.obsidian/plugins/deepgram-meeting-stt/data.json` to `.obsidian/plugins/voxnote/data.json` and Obsidian does not migrate it automatically.
4. Your vault data (the `VoxNote/` workspace folder: Audio, STT, Templates, AI-Summaries) is **untouched** — it sits at the vault root, not under `.obsidian/plugins/`, so re-installing finds your existing recordings, transcripts, templates, and summaries as-is.

Functionally 2.0.0 ships the same feature set as the never-released 1.1.6 work below (consent recovery UX + VoxNote rebrand + Deepgram/ → VoxNote/ folder migration). The only reason for the major version bump is the id change.

### Why the id changed
v1.1.6 was rejected by the Obsidian automated review pipeline because the catalog `name` field (still "Deepgram Meeting STT" in `community-plugins.json`) did not match the new `manifest.json` name ("VoxNote — Meeting Transcription & AI Summary"). A prior attempt to rebrand to "ObsiDeep" was also rejected for containing parts of the "Obsidian" trademark. Submitting as a fresh `voxnote` listing was the only path forward — the alternative (a maintainer-side `community-plugins.json` edit) requires Obsidian staff action that this plugin's user-volume did not justify chasing.

## [1.1.6] - 2026-05-15 (never publicly released)

> Note: 1.1.6 was tagged on GitHub but the corresponding directory submission was withdrawn before merge in favor of the 2.0.0 re-listing above. The changes below are functionally shipped under 2.0.0.

### Added
- **Consent-not-completed recovery UX.** Closing the first-run consent modal without clicking "I agree" used to leave the workspace in an uninitialized state with no surfaced way to recover — users could click into Settings, paste an API key, and never realize the `VoxNote/` folders + `.gitignore` rules hadn't been applied. Two changes: (1) **dismissed-without-acknowledge Notice** — when the modal is closed via Esc / click-outside, a 10s Notice explains the workspace wasn't created and points to the two recovery paths; (2) **warning banner at the top of the settings tab** when `consentAcknowledged === false` — muted-background card with a "Re-open consent modal" CTA button (also styled in `styles.css`). The existing command-palette command `"동의 모달 다시 보기" / "Reset consent (show notice again)"` is unchanged but is now properly discoverable.

### Changed
- **Plugin renamed: "Deepgram Meeting STT" → "VoxNote — Meeting Transcription & AI Summary".** The old name only signalled STT and didn't reflect the AI summary path that the plugin has shipped since 1.1.0; the display name now reflects both capabilities. At the time of the 1.1.6 tag the plugin `id` was kept as `deepgram-meeting-stt`; under 2.0.0 the id changed to `voxnote` (see Breaking above).
- **Vault workspace folder renamed: `Deepgram/` → `VoxNote/`.** The auto-created vault folder (containing `Audio/`, `STT/`, `Templates/`, `AI-Summaries/`) now uses the new brand name. Default settings (`savedFolder`, `templatesFolder`, `summariesFolder`) point at `VoxNote/...`. The `.gitignore` rule added to the vault is updated accordingly.
- **Vault README + FEATURES (`VoxNote/README.md`, `VoxNote/FEATURES.md`) refreshed end-to-end.** Folder layout section now includes `Templates/` and `AI-Summaries/` (previously only `Audio/` + `STT/`). Cost section reframed as Deepgram + Gemini combined. **FEATURES gained a full "AI summary (Gemini)" section** documenting setup, flows (audio → STT+summary, re-summarize existing notes), built-in templates table, template file format, system placeholders, scaffold command, and failure behavior — bringing it to parity with the GitHub `FEATURES.md` which already covered this.
- Plugin-loaded toast, key-auth error notice, gitignore comment, settings tab descriptions, and right-click submenu label all updated to "VoxNote".

### Fixed
- **Consent banner styled as a subtle muted-background card** with a thin left-accent stripe in `--text-warning`, matching Obsidian's native callout/admonition pattern. The CTA button is left-aligned and the description hides the empty `setting-item-info` slot so the row stays compact.
- **Dismiss-without-acknowledge Notice could fire twice.** `ConsentModal.onClose` had no guard against re-entry — depending on how Obsidian routed Esc / click-outside / explicit `close()` calls, the close callback could fire twice and surface two stacked toasts. Added a `closeFired` flag so the callback fires at most once per modal lifetime.
- **Settings tab didn't re-render after acknowledging.** After clicking "동의하고 시작" the modal closed but the warning banner stayed visible (because `PluginSettingTab.display()` only runs on tab activation, not on internal state change) — making users think nothing happened and re-click the banner button, which fires `showConsentAgain()` and resets `consentAcknowledged` back to false, creating a loop. The plugin now stores a reference to the settings tab and calls `display()` once after the consent flow finishes (both acknowledge and dismiss paths) so the banner correctly disappears / reappears in sync with state.
- **Hardened the acknowledge button against double-clicks and side-effect errors.** Added an `inFlight` guard plus an `acknowledged` early-return so rapid repeated clicks no longer queue multiple `onAcknowledge` invocations; the button visibly disables and changes to "진행 중..." during processing; and `onAcknowledge` is wrapped in a try/catch/finally so an exception inside `applyConsentSideEffects` can no longer strand the modal in an open state — `close()` always runs.

### Migration
- Existing 1.1.3 users: the display name updates automatically on next Community Plugins refresh; no action needed for that. **However, the vault workspace folder is NOT auto-migrated.** Your existing `Deepgram/` folder will stay where it is — the plugin will create a fresh `VoxNote/` folder on next consent flow. To migrate your data:
  - **Option A (recommended for active users):** in Settings → VoxNote, change the three folder paths (Saved folder, Templates folder, Summaries folder) from `VoxNote/...` back to your existing `Deepgram/...` paths. The plugin will continue using your old folder transparently.
  - **Option B:** rename `Deepgram/` → `VoxNote/` in your vault (Obsidian's file explorer or your OS), then either reopen the plugin or run **"동의 모달 다시 보기"** to re-seed `README.md` / `FEATURES.md` inside.
  - Settings, API keys, and templates inside the renamed folder are untouched either way.

## [1.1.3] - 2026-05-14

### Fixed
- **Summary list fields rendering as a single run-on paragraph.** Gemini was returning bullet/checkbox/blockquote values as one string with items glued together by `.- ` / `.- [ ] ` / `.> ` instead of real newlines, so Obsidian rendered the whole `summary` block as one bullet with the rest as inline body text. Two-part fix: (1) `buildGeminiPrompt` now appends a universal FORMATTING RULES block instructing the model to put every list item on its own line with a real `\n` separator and explicitly forbidding the `- one.- two` shape; (2) new `normalizeListNewlines()` defensively splits any inline `.- `, `.- [ ] `, `.> ` patterns — and Korean noun-form endings (`함 / 됨 / 임 / 중 / 료`) followed by `- ` — into newline-separated form before placeholder substitution. Applies to all six built-in templates and works retroactively for users who already seeded older templates (the rule is added in code, not in template content).

### Changed
- **회의록 (KO) tone switched to 명사형 종결어미체.** The default Korean meeting-minutes prompt now demands noun-form endings (`결정함`, `확인함`, `논의됨`, `공유됨`, `예정임`, `진행 중`) and explicitly forbids `~합니다 / ~습니다 / ~다`. Better fit for Korean business meeting-minutes convention — terser and more scannable.
- **Meeting (EN) tone switched to concise note-style.** The default English meeting-minutes prompt now demands short past-tense / noun-phrase fragments ("Decided X.", "Reviewed Y.", "Pending: Z.") and discourages full conversational sentences.
- All six built-in templates' prompts and placeholder descriptions now explicitly require one item per line, reinforcing the universal formatting rule for new installs that read the template prompt directly.

### Migration
- Existing users who already seeded their templates keep the run-on-line fix automatically (the engine-level rule + post-processing applies regardless of template content). To pick up the new tone changes, delete `회의록.md` / `Meeting.md` from `VoxNote/Templates/` and re-run **"동의 모달 다시 보기"**, or edit the prompts in place.

## [1.1.2] - 2026-05-14

### Fixed
- **Summary output contaminated with template's guide-comment block + accidental transcript inside it.** The HTML comment we added inside built-in templates listed `{{transcript}}` and other tokens as documentation, but `renderBody`'s regex was substituting them blindly — so the entire STT transcript was being inlined into a `<!-- ... -->` block in the resulting summary file. Added `stripHtmlComments()` step before placeholder substitution; comments are now removed from the rendered output and their internal `{{...}}` references never substitute.

### Changed
- **All 6 built-in templates (KO + EN) hardened for list-shaped output.** Prompts now explicitly require markdown formatting; each placeholder description encodes the expected syntax (`- ...`, `- [ ] ...`, `> ...`, `- **concept**: ...`) so Gemini cannot drift into prose. Output is consistently bulleted / checkboxed / blockquoted for readability.
- **Right-click menu wording: "STT + 요약" → "STT + AI 요약"** (both flat-favorite and submenu entries; same in English: "Transcribe + AI summary"). Command palette label updated to match.

## [1.1.1] - 2026-05-14

### Fixed
- **VoxNote submenu disappearing on audio right-click after setting the Gemini key.** The file-menu callback is synchronous in Obsidian, but `buildAudioMenu` / `buildMarkdownMenu` were calling `await loadTemplates(...)` inside, so the `menu.addItem(...)` ran after the menu had already been rendered. The plugin now caches templates on the instance (`templatesCache`) and refreshes it on plugin load, on vault `create` / `modify` / `delete` / `rename` inside the templates folder, and when the Gemini key or templates folder setting changes. Menu callbacks read the cache synchronously.

### Changed
- **Built-in summary templates now localized.** First-install seeds the language set that matches the UI language: KO → `회의록.md` (favorite), `인터뷰.md`, `강의노트.md`; EN → `Meeting.md` (favorite), `Interview.md`, `Lecture.md`. The right-click menu and the resulting summary notes are in that language end-to-end. Each template body now also includes a guide comment block documenting every frontmatter field and every system placeholder, so the file is self-explanatory when opened.
- **Starter template** (`Create new summary template` command) also localized per UI language, with the same guide comment block.
- **README + README-ko** reframed around the audio → STT → AI summary pipeline. Menu labels updated to match the `VoxNote ▸` submenu structure. Gemini cost line and privacy notes added.

### Migration
- Users who already received the 1.1.0 English templates and switch UI language to Korean can run **"동의 모달 다시 보기"** to seed the Korean set alongside the English one. Filenames differ, so no collision.

## [1.1.0] - 2026-05-14

### Added
- **AI summary (Gemini)** — optional feature, fully gated on a Gemini API key.
  - File-based templates in `VoxNote/Templates/` (frontmatter declares `prompt`, `placeholders`, `favorite`); favorites surface as top-level menu items, the rest sit in an `AI 요약 ▸` submenu.
  - System placeholders filled by code: `{{transcript}}`, `{{title}}`, `{{date}}`, `{{datetime}}`, `{{source}}`, `{{language}}`, `{{duration}}`, `{{speakers}}`. AI placeholders declared per template, filled by Gemini 2.5 structured output (JSON mode).
  - Three commands: **"STT + AI 요약 (Transcribe and summarize)"**, **"현재 노트를 AI로 요약 (Summarize current note with AI)"**, **"새 요약 템플릿 만들기 (Create new summary template)"**.
  - Right-click submenu (`VoxNote ▸ ...`) on audio files (STT only / STT + favorite summaries / submenu of other templates) and on markdown notes (re-summarize with any template).
  - Summary notes saved to `VoxNote/AI-Summaries/{title} (요약).md` with `source: "[[...]]"` backlink and `template:` metadata.
  - Three starter templates seeded on first consent: `Meeting.md` (favorite), `Interview.md`, `Lecture.md`.
  - Two folders auto-created at consent time: `Templates/`, `AI-Summaries/`.
- Settings tab: new **"AI 요약 (Gemini)"** section (api key, model dropdown, templates folder, summaries folder).

### Changed
- Existing audio file menu item `"Transcribe with Deepgram"` moved under the new `VoxNote ▸` submenu (now `STT만 추출`). The command palette entry is unchanged.
- `MenuItem.setSubmenu()` typing added via module augmentation (Obsidian d.ts gap).

### Tests
- 67 new vitest cases across `providers/gemini`, `template-loader`, `summary-engine`, `summary-runner`, `template-starter`, `built-in-templates`. Total: 98 passing.

### Safe to upgrade
- STT-only flow is unchanged. With no Gemini key set, no AI menus appear and no new behavior triggers.

## [1.0.0] - 2026-05-12

### Summary
- 첫 정식 안정 릴리스 (Obsidian Community Plugin 등록 후보).
- 0.5.x 베타에서 누적된 기능을 그대로 가져오면서, 마켓 심사 통과를 위한 사전 정리를 거쳤습니다.

### Changed
- `obsidianmd/ui/sentence-case` ESLint 룰 다시 활성화 후 통과.
  - 설정 탭의 의미 없는 placeholder를 의미 있는 안내 텍스트(`Paste your Deepgram API key`, `e.g. VoxNote/STT`)로 교체.
- FEATURES 문서에 **"모바일에서 사용"** 섹션 추가 — iOS/Android에서의 입력 방식 차이 안내 (드래그앤드롭 → 공유, 우클릭 → long-press 등).

### Verified for submission
- 위험 DOM API 사용 없음 (innerHTML / eval / Function 생성자 / 직접 fetch).
- Node 모듈 의존성 없음 (모바일 호환).
- 하드코딩된 `.obsidian` 경로 없음 — `app.vault.configDir` 사용.
- `styles.css` 비어있음 — Obsidian 전역 스타일 안 건드림.

## [0.5.0] - 2026-05-12

### Added
- **시간 세그먼트 표시**: 화자별 transcript 블록에 `[HH:MM:SS - HH:MM:SS]` 시간 범위 표시 (paragraph 병합 시 그룹의 시작~끝 시간).
- **`{{speakers_list}}` 토큰**: 회의에 등장한 화자 목록을 YAML 배열로 frontmatter에 자동 기록 (`speakers: ["화자 0", "화자 1"]`).
- **명령어 "화자 이름 변경 (현재 노트)"**: 모달에서 기존 이름·새 이름 입력하면 본문 + frontmatter 일괄 치환. 변경된 횟수를 Notice로 알림.

### Changed
- 기본 회의록 템플릿 정리:
  * body의 메타 list(녹음/길이/모델) 제거 — 동일 정보가 frontmatter에 있어 중복.
  * frontmatter에서 `model` 제거.
  * frontmatter에 `speakers` 추가.
- 화자별 transcript 헤더 형식 변경: `**화자 0:** 내용` → `**화자 0** [00:00:01 - 00:00:08]\n내용` (라벨과 본문 분리, 시간 범위 추가).

## [0.4.0] - 2026-05-12

### Added
- 설정 탭에 **"정보"** 섹션 추가 — 현재 버전 표시 + GitHub 릴리스 페이지 바로가기 + **"업데이트 확인"** 버튼.
- 업데이트 확인 버튼: GitHub Releases API로 최신 버전을 조회해 더 새로운 버전이 있으면 자동으로 릴리스 페이지를 새 탭으로 엶 (BRAT 사용자에게는 부가 정보, BRAT 미사용 사용자는 수동 업데이트 진입점).

## [0.3.0] - 2026-05-12

### Added
- **다국어 (i18n)**: 한국어 / 영어 / 자동(옵시디언 locale 따름) 지원. 설정 → "UI 언어"에서 즉시 전환. 모든 modal, settings, command, Notice가 자동으로 해당 언어로 전환됩니다.
- **VoxNote/README.md 자동 생성**: 동의 시 폴더 안에 사용 가이드 README 자동 작성 (사용자 언어에 맞춰 한/영). 시작하기 3단계(가입→API 키→파일 넣기), 회의록 추출 흐름, 보안/GDPR/Zero Retention, 비용 안내 포함.

### Changed
- **동의 모달 축약**: 다섯 줄 안내 → 핵심 세 줄로 줄임. 자세한 사용법은 VoxNote/README.md로 위임.
- 모든 사용자 노출 텍스트를 인라인 i18n으로 분기.
- **Zero Retention 기본값 `false` → `true`**: 신규 사용자는 보수적 보안 정책으로 시작. Growth 이상 요금제에서 즉시 적용. 기존 사용자의 설정값은 유지됩니다.
- README/VoxNote README의 보안 섹션에 Deepgram GDPR / SOC 2 / HIPAA / CCPA / DPA 준수 정보, Zero Retention 작동 조건, Trust Center 링크 추가.

## [0.2.0] - 2026-05-12

### Added
- 첫 실행 동의 시 vault 루트에 **`VoxNote/` 폴더 자동 생성** — 그 안에 `Audio/` (녹음 파일 권장 위치)와 `STT/` (회의록 노트 기본 저장 위치) 하위 폴더 함께 생성.
- vault `.gitignore`에 `VoxNote/` 룰 자동 추가 (data.json과 함께) → 회의 녹음·회의록 통째로 vault git sync에서 보호.
- 명령어 **"동의 모달 다시 보기 (consent reset)"** 추가 — 의도적으로 모달을 다시 띄워 새 안내 확인·폴더 재생성 가능.

### Changed
- 기본 `savedFolder` 값을 `STT` → `VoxNote/STT`로 변경 (신규 사용자 한정. 기존 사용자는 본인 설정값 유지).
- 동의 후 부수 효과를 `applyConsentSideEffects`로 통합. 결과 Notice가 폴더 생성·gitignore 갱신 상태를 분리해서 보고.
- consent 모달 안내문 + README 사용법 섹션을 `VoxNote/` 구조 중심으로 재작성.

## [0.1.0] - 2026-05-12

### Added
- 첫 정식 베타 릴리스 (BRAT 배포 가능).
- Deepgram `/v1/listen`을 통한 한국어 회의 녹음 STT 변환.
- 화자 분리(Diarize) 결과를 마크다운 회의록 노트로 자동 저장
  (기본 경로: `STT/YYYY-MM-DD_제목.md`).
- 같은 화자의 연속 paragraph를 하나의 블록으로 자동 병합.
- 명령 팔레트 + 파일 우클릭 메뉴, 양쪽에서 변환 트리거.
- 첫 실행 시 데이터 전송 동의 모달 + vault `.gitignore` 자동 보호.
- API 키 유효성 검증 버튼.
- 외부 마크다운 템플릿 지원 (`{{date}}`, `{{title}}`, `{{transcript}}`,
  `{{speakers_transcript}}`, `{{plain_transcript}}`, `{{duration}}`,
  `{{audio_link}}`, `{{language}}`, `{{model}}`).
- 네트워크/5xx/429 오류 1회 자동 재시도 + 상황별 안내 메시지.

[Unreleased]: https://github.com/Moonjuun/obsidian-deepgram-stt/compare/1.0.0...HEAD
[1.0.0]: https://github.com/Moonjuun/obsidian-deepgram-stt/compare/0.5.4...1.0.0
[0.3.0]: https://github.com/Moonjuun/obsidian-deepgram-stt/compare/0.2.1...0.3.0
[0.2.0]: https://github.com/Moonjuun/obsidian-deepgram-stt/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/Moonjuun/obsidian-deepgram-stt/releases/tag/0.1.0
