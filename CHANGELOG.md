## [Unreleased]

## [1.1.0] - 2026-05-14

### Added
- **AI summary (Gemini)** — optional feature, fully gated on a Gemini API key.
  - File-based templates in `ObsiDeep/Templates/` (frontmatter declares `prompt`, `placeholders`, `favorite`); favorites surface as top-level menu items, the rest sit in an `AI 요약 ▸` submenu.
  - System placeholders filled by code: `{{transcript}}`, `{{title}}`, `{{date}}`, `{{datetime}}`, `{{source}}`, `{{language}}`, `{{duration}}`, `{{speakers}}`. AI placeholders declared per template, filled by Gemini 2.5 structured output (JSON mode).
  - Three commands: **"STT + AI 요약 (Transcribe and summarize)"**, **"현재 노트를 AI로 요약 (Summarize current note with AI)"**, **"새 요약 템플릿 만들기 (Create new summary template)"**.
  - Right-click submenu (`ObsiDeep ▸ ...`) on audio files (STT only / STT + favorite summaries / submenu of other templates) and on markdown notes (re-summarize with any template).
  - Summary notes saved to `ObsiDeep/AI-Summaries/{title} (요약).md` with `source: "[[...]]"` backlink and `template:` metadata.
  - Three starter templates seeded on first consent: `Meeting.md` (favorite), `Interview.md`, `Lecture.md`.
  - Two folders auto-created at consent time: `Templates/`, `AI-Summaries/`.
- Settings tab: new **"AI 요약 (Gemini)"** section (api key, model dropdown, templates folder, summaries folder).

### Changed
- Existing audio file menu item `"Transcribe with Deepgram"` moved under the new `ObsiDeep ▸` submenu (now `STT만 추출`). The command palette entry is unchanged.
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
  - 설정 탭의 의미 없는 placeholder를 의미 있는 안내 텍스트(`Paste your Deepgram API key`, `e.g. ObsiDeep/STT`)로 교체.
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
- **ObsiDeep/README.md 자동 생성**: 동의 시 폴더 안에 사용 가이드 README 자동 작성 (사용자 언어에 맞춰 한/영). 시작하기 3단계(가입→API 키→파일 넣기), 회의록 추출 흐름, 보안/GDPR/Zero Retention, 비용 안내 포함.

### Changed
- **동의 모달 축약**: 다섯 줄 안내 → 핵심 세 줄로 줄임. 자세한 사용법은 ObsiDeep/README.md로 위임.
- 모든 사용자 노출 텍스트를 인라인 i18n으로 분기.
- **Zero Retention 기본값 `false` → `true`**: 신규 사용자는 보수적 보안 정책으로 시작. Growth 이상 요금제에서 즉시 적용. 기존 사용자의 설정값은 유지됩니다.
- README/ObsiDeep README의 보안 섹션에 Deepgram GDPR / SOC 2 / HIPAA / CCPA / DPA 준수 정보, Zero Retention 작동 조건, Trust Center 링크 추가.

## [0.2.0] - 2026-05-12

### Added
- 첫 실행 동의 시 vault 루트에 **`ObsiDeep/` 폴더 자동 생성** — 그 안에 `Audio/` (녹음 파일 권장 위치)와 `STT/` (회의록 노트 기본 저장 위치) 하위 폴더 함께 생성.
- vault `.gitignore`에 `ObsiDeep/` 룰 자동 추가 (data.json과 함께) → 회의 녹음·회의록 통째로 vault git sync에서 보호.
- 명령어 **"동의 모달 다시 보기 (consent reset)"** 추가 — 의도적으로 모달을 다시 띄워 새 안내 확인·폴더 재생성 가능.

### Changed
- 기본 `savedFolder` 값을 `STT` → `ObsiDeep/STT`로 변경 (신규 사용자 한정. 기존 사용자는 본인 설정값 유지).
- 동의 후 부수 효과를 `applyConsentSideEffects`로 통합. 결과 Notice가 폴더 생성·gitignore 갱신 상태를 분리해서 보고.
- consent 모달 안내문 + README 사용법 섹션을 `ObsiDeep/` 구조 중심으로 재작성.

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
