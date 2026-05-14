# ObsiDeep — Meeting Transcription & AI Summary

옵시디언 안에서 회의 녹음을 마크다운 노트로 변환하는 플러그인. **[Deepgram](https://deepgram.com) STT로 화자 분리·시간 세그먼트 포함 회의록을 만들고**, **선택적으로 Google Gemini로 구조화된 요약 노트까지** 같이 떨어뜨립니다.

> 🇺🇸 English: [README.md](README.md)

---

## 핵심 기능

- **오디오 → 회의록**: vault에 녹음 파일을 넣고 우클릭 → 제목 입력 → 화자별 `[HH:MM:SS]` 타임스탬프가 붙은 마크다운 노트가 생성됩니다.
- **오디오 → 회의록 → AI 요약 (옵션)**: 한 번의 우클릭으로 STT 노트와 구조화된 요약 노트(액션 아이템·결정사항·핵심 인용 등 템플릿이 정의한 항목)를 동시에 생성. 요약 노트엔 원본 STT로의 백링크가 자동 삽입됩니다.
- **파일 기반 요약 템플릿**: `ObsiDeep/Templates/` 폴더의 `.md` 파일이 곧 템플릿. frontmatter에 `prompt`와 `placeholders`(키-설명 맵)를 정의하면 Gemini가 그 스키마에 맞춰 JSON으로 응답하고, 본문의 `{{key}}`에 치환되어 들어갑니다. favorite으로 표시한 템플릿은 우클릭 메뉴 평면에 노출, 나머지는 `AI 요약 ▸` 서브메뉴에 정리됩니다. 첫 실행 시 `Meeting` / `Interview` / `Lecture` 3개가 자동 시드됩니다.
- **작업 공간 자동 관리**: vault 루트에 `ObsiDeep/` (Audio · STT · Templates · AI-Summaries) 폴더를 자동 생성하고, `.gitignore`에 보호 룰을 추가해 녹음·API 키·요약본이 git sync에 절대 들어가지 않습니다.
- **이중 언어 UI**: 한국어 / 영어 / 옵시디언 locale 자동 감지.
- **Zero Retention 기본 ON** — Deepgram 서버에 데이터 보관 비활성화 요청. AI 요약은 완전 옵션이며 Gemini 키가 없으면 관련 메뉴 자체가 표시되지 않습니다.
- **모바일 호환** — iOS / Android 옵시디언에서도 동작.

> Gemini 키 없이도 STT 단독 도구로 그대로 사용 가능합니다. 키가 비어있으면 AI 메뉴는 보이지 않고, 사용자가 변환을 직접 트리거하지 않는 한 어떤 데이터도 외부로 나가지 않습니다.

---

## 설치

### 방법 1 — Obsidian Community Plugins (권장)

1. 옵시디언 설정 → Community plugins → Browse
2. **"ObsiDeep"** 검색
3. Install + Enable

### 방법 2 — 수동

1. [Releases](https://github.com/Moonjuun/obsidian-deepgram-stt/releases) 최신 버전에서 `main.js`, `manifest.json`, `styles.css` 다운로드.
2. 본인 vault의 `.obsidian/plugins/deepgram-meeting-stt/` 폴더(없으면 생성)에 3개 파일 복사.
3. 옵시디언 재시작 → Community plugins → "ObsiDeep" 활성화.

---

## 셋업

플러그인을 처음 활성화하면 동의 모달이 뜨면서 Deepgram에 무엇이 전송되는지 안내합니다. 동의 시 vault 루트에 `ObsiDeep/` 작업 공간이 자동 생성됩니다 — `Audio/`, `STT/`, `Templates/`(시드 템플릿 3개 포함), `AI-Summaries/`. `.gitignore`에는 녹음·API 키 보호 룰이 자동 추가됩니다.

### 1. Deepgram API 키 (STT 필수)

1. [Deepgram 콘솔](https://console.deepgram.com)에 가입 — 무료 **$200 크레딧** (nova-3 기준 약 770시간 분량).

   ![Deepgram API Keys 페이지](img/img1.webp)

2. **API Keys → Create New API Key** (이름 자유, 권한은 `Member` 이상).

   ![API 키 생성 화면](img/img2.webp)

3. 옵시디언 → 플러그인 설정 → **"Deepgram API 키"** 칸에 붙여넣기 → **"검증"** 클릭.

   ![플러그인 설정 탭](img/img3.webp)

### 2. Gemini API 키 (AI 요약을 쓸 때만)

STT만 사용할 거면 비워두면 됩니다. AI 요약을 활성화하려면:

1. [Google AI Studio → API keys](https://aistudio.google.com/apikey)에서 키 발급.
2. 플러그인 설정 → **"Gemini API 키"**에 붙여넣기.
3. 모델 선택 — 기본 `gemini-2.5-flash` (빠르고 저렴). 더 높은 품질이 필요하면 `gemini-2.5-pro`.

키가 비어있는 동안에는 AI 관련 메뉴가 표시되지 않습니다.

---

## 사용법

### 0. 회의 녹음 파일을 vault에 넣기

`ObsiDeep/Audio/`로 넣는 방법:
- **드래그앤드롭**: Finder에서 옵시디언 창의 `ObsiDeep/Audio/`로 드래그
- **Finder 직접 복사**: vault 폴더의 `ObsiDeep/Audio/` 안에 파일 복사

> 💡 Finder에서 직접 복사한 경우 옵시디언 사이드바에 즉시 안 보일 수 있습니다. `Cmd+P` (Windows: `Ctrl+P`) → **"저장하지 않고 앱 새로고침"** 실행 후 다시 확인하세요.

> 다른 폴더(`Attachments/`, `Meetings/` 등)에 두어도 변환은 동작하지만, git 보호를 받으려면 본인이 별도로 `.gitignore` 처리해야 합니다.

지원 포맷: `mp3`, `m4a`, `mp4`, `wav`, `flac`, `ogg`, `opus`, `webm`, `aac`

### 1. STT만 추출

1. `ObsiDeep/Audio/`의 파일을 사이드바에서 우클릭 → **`ObsiDeep ▸ STT만 추출`**.
2. 회의록 제목 입력 → Enter.
3. 1~2분 후 `ObsiDeep/STT/`에 회의록이 생성되어 자동으로 열립니다.

![우클릭 → ObsiDeep 서브메뉴](img/img4.webp)

명령 팔레트(`Cmd+P` / `Ctrl+P`)에서도 동일하게 **"회의록 추출 (Transcribe audio → meeting note)"**로 실행할 수 있습니다.

### 2. STT + AI 요약 한 번에 (Gemini 키 설정 시)

1. 오디오 파일 우클릭 → **`ObsiDeep ▸ ⭐ STT + AI 요약: 회의록`** (favorite 템플릿은 평면 노출, 나머지는 `AI 요약 ▸` 서브메뉴).
2. 제목 입력.
3. STT 결과가 그대로 Gemini로 흘러가 템플릿의 prompt에 맞게 요약됩니다.
4. **두 개의 노트가 생성됩니다** — STT는 `ObsiDeep/STT/`에, 요약은 `ObsiDeep/AI-Summaries/{제목} (요약).md`에. 요약 노트 frontmatter엔 `source: "[[...]]"`로 원본 STT 백링크가 자동 삽입됩니다.

STT가 실패하면 요약 단계는 실행되지 않습니다. STT는 성공했는데 요약만 실패하면 STT 노트는 살아남고 Notice로 에러가 안내됩니다.

### 3. 기존 노트를 다른 템플릿으로 다시 요약

기존 마크다운 노트 우클릭 → **`ObsiDeep ▸ ⭐ AI 요약: 회의록`** (favorite 템플릿) 또는 **`ObsiDeep ▸ AI 요약 ▸ <템플릿>`** (그 외). 노트 본문이 입력 transcript가 되고, 새 요약 파일이 `AI-Summaries/`에 추가됩니다. 다른 템플릿으로 같은 회의를 재요약하거나, 이 플러그인이 만들지 않은 노트를 요약할 때 유용합니다.

### 출력 예시

회의록 (`ObsiDeep/STT/...`):

```markdown
---
date: 2026-05-13
type: meeting
tags: [meeting, stt]
duration: 28m 41s
language: ko
source: [[ObsiDeep/Audio/standup.m4a]]
speakers: ["화자 1", "화자 2"]
---

# Stand-up 2026-05-13

**화자 1** [00:00:01 - 00:00:08]
좋은 아침입니다, 상태 업데이트부터 시작하죠.

**화자 2** [00:00:09 - 00:00:14]
네, 제가 먼저 할게요.
```

요약 (`ObsiDeep/AI-Summaries/...`, `Meeting` 템플릿):

```markdown
---
source: "[[ObsiDeep/STT/Stand-up 2026-05-13]]"
template: "Meeting"
date: 2026-05-13
language: Korean
type: ai-summary
---
# Stand-up 2026-05-13

> Source: [[ObsiDeep/STT/Stand-up 2026-05-13]] · 2026-05-13 · 28:41

## Summary
- ...

## Decisions
- ...

## Action Items
- [ ] @화자1 — ... 후속 진행
```

### 4. 템플릿 직접 만들고 고치기

`ObsiDeep/Templates/`의 어떤 `.md` 파일이든 열어서 frontmatter를 편집하면 됩니다:

```markdown
---
name: "Meeting"
favorite: true        # 우클릭 메뉴 평면 노출 여부
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
```

여기서 선언한 `placeholders`가 그대로 Gemini의 JSON 응답 스키마가 됩니다 — Gemini가 자유롭게 형식을 어기지 않도록 강제됨. 키는 원하는 만큼 추가하면 됩니다.

모든 시스템 placeholder가 주석으로 정리된 스타터 파일을 받고 싶으면 명령 팔레트 → **"새 요약 템플릿 만들기 (Create new summary template)"**.

---

## 화자 이름 정리

회의록의 frontmatter `speakers` 항목은 기본적으로 `화자 1`, `화자 2` 같은 익명 라벨로 채워집니다. 실제 이름으로 바꿔두면 검색·추적이 쉬워집니다.

1. 정리할 회의록 노트 열기.
2. 명령 팔레트(`Cmd+P` / `Ctrl+P`) → **"화자 이름 변경 (현재 노트)"** 실행.

![화자 이름 변경 명령](img/img5.webp)

3. 모달이 열리면 상단에 **현재 노트 이름**이 표시되고, **"변경 전" 칸은 드롭다운**으로 노트에서 자동 감지된 화자 목록이 채워집니다.
   - **변경 전**: 드롭다운에서 변경할 화자 선택 (예: `화자 1`)
   - **변경 후**: 실제 이름 입력 (예: `홍길동`)
4. **치환** 클릭 → 본문의 모든 `화자 1`과 frontmatter `speakers` 배열의 라벨이 일괄 치환됩니다.

> 화자가 여러 명이면 명령을 여러 번 실행하시면 됩니다.

---

## 더 알아보기

기능별 상세 가이드(정확도 팁, 시스템 placeholder 전체 목록, AI 요약 자세한 설명, 모바일 사용, 업데이트 확인 등)는 [**FEATURES.md**](FEATURES.md)에 모았습니다.

---

## 설정 항목

| 항목 | 설명 | 기본값 |
|---|---|---|
| UI 언어 | 플러그인 UI 언어 (한국어/영어/자동) | `auto` |
| Deepgram API 키 | STT 변환에 필요. 로컬 `data.json`에 저장 | (없음) |
| 회의록 저장 폴더 | vault 내 상대 경로 | `ObsiDeep/STT` |
| 템플릿 경로 | STT 노트 템플릿 (.md). 비우면 내장 템플릿 | (빈 값) |
| 회의 언어 | `ko` / `en` / `auto` (자동 감지) | `ko` |
| Deepgram 모델 | `nova-3` (최신) / `nova-2` | `nova-3` |
| 화자 분리 (Diarize) | 화자별로 분리된 transcript 생성 | `true` |
| Zero Retention | Deepgram 측 데이터 보관 비활성화 (요금제 조건) | `true` |
| Gemini API 키 | (옵션) AI 요약 메뉴를 활성화 | (없음) |
| Gemini 모델 | `gemini-2.5-flash` (빠르고 저렴) / `gemini-2.5-pro` (정확도 우선) | `gemini-2.5-flash` |
| 템플릿 폴더 | 요약 템플릿(.md)이 들어있는 폴더 | `ObsiDeep/Templates` |
| 요약 저장 폴더 | AI 요약 결과를 저장할 폴더 | `ObsiDeep/AI-Summaries` |

---

## 비용 (참고)

| 회의 길이 | Deepgram nova-3 | Gemini 2.5-flash (요약) | 합계 (약) |
|---|---|---|---|
| 30분 | $0.13 | ~$0.005 | ~$0.14 |
| 1시간 | $0.26 | ~$0.01 | ~$0.27 |
| 2시간 | $0.52 | ~$0.02 | ~$0.54 |

Deepgram 무료 $200 크레딧 + Gemini 무료 티어로 일반적인 사용량은 충분히 커버됩니다. 최신 가격은 [Deepgram Pricing](https://deepgram.com/pricing) · [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing).

---

## 프라이버시 / 보안

### 데이터 흐름

- 오디오는 HTTPS로 Deepgram에 전송됩니다.
- STT 결과 텍스트는 사용자가 **AI 요약을 트리거할 때만** Gemini에 전송됩니다. AI 요약을 실행하지 않으면 외부로 나가지 않습니다.

### Deepgram 자체 보안

| 표준 | 내용 |
|---|---|
| **GDPR** | EU/UK 일반 개인정보보호 규정 준수 |
| **SOC 2 Type II** | 외부 감사 완료 (보안·가용성·기밀성) |
| **HIPAA** | 의료 정보 처리 호환 가능 (별도 BAA 필요) |
| **CCPA** | 캘리포니아 소비자 개인정보 보호법 대응 |

상세: [Deepgram Trust Center](https://trust.deepgram.com) · [Privacy Policy](https://deepgram.com/privacy)

### Zero Retention (Deepgram, 기본 ON)

플러그인은 기본적으로 `dg-zero-retention: true` 헤더를 Deepgram에 전달합니다. Growth 이상 요금제에서 즉시 적용, 무료/PAYG에서는 표준 정책(~30일 보관)이 적용될 수 있습니다.

### Gemini

Gemini API 사용은 Google의 [Gemini API 약관](https://ai.google.dev/gemini-api/terms) 및 [개인정보처리방침](https://policies.google.com/privacy)을 따릅니다. 무료 티어 요청은 모델 개선에 사용될 수 있으므로, 민감 정보를 다룬다면 유료 티어 사용을 권장합니다.

### API 키 + 회의 녹음 자동 보호

- API 키는 vault 내 `.obsidian/plugins/deepgram-meeting-stt/data.json`에 **평문 JSON으로 저장**됩니다.
- 첫 실행 모달에서 동의 시 vault `.gitignore`에 자동 보호 룰을 추가합니다.
- 회의 참석자에게 **녹음 및 외부 API 전송에 대한 사전 동의**를 받으시는 것을 권장합니다.

---

## License

[MIT](LICENSE) © 2026 Moonjuun
