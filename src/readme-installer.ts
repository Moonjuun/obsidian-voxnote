import type { App } from 'obsidian';
import type { Lang } from './utils/i18n';

const README_PATH = 'ObsiDeep/README.md';
const FEATURES_PATH = 'ObsiDeep/FEATURES.md';

export type FileInstallResult = 'created' | 'exists' | 'error';

export async function installReadme(app: App, lang: Lang): Promise<FileInstallResult> {
	return installFile(app, README_PATH, lang === 'ko' ? KO_README : EN_README);
}

export async function installFeatures(app: App, lang: Lang): Promise<FileInstallResult> {
	return installFile(app, FEATURES_PATH, lang === 'ko' ? KO_FEATURES : EN_FEATURES);
}

async function installFile(app: App, path: string, content: string): Promise<FileInstallResult> {
	try {
		const exists = await app.vault.adapter.exists(path);
		if (exists) return 'exists';
		await app.vault.create(path, content);
		return 'created';
	} catch {
		return 'error';
	}
}

// ─── README — 시작·보안·비용 중심 ─────────────────────────────────────

const KO_README = `# ObsiDeep — Deepgram Meeting STT

이 폴더는 [Deepgram Meeting STT](https://github.com/Moonjuun/obsidian-deepgram-stt) 플러그인이 자동 생성한 작업 공간입니다. **사용 중 자주 보는 기능 가이드는 같은 폴더의 [[FEATURES]] 파일에 모아두었습니다.**

## 폴더 구조

- \`Audio/\` — 회의 녹음 파일을 여기에 넣으세요.
- \`STT/\` — 변환된 회의록 노트가 자동 저장됩니다.

---

## 시작하기 (3단계)

### 1단계 — Deepgram 회원가입 & API 키 발급

1. [Deepgram 콘솔](https://console.deepgram.com)에 가입 (Google 또는 이메일).
   - 가입 즉시 **무료 $200 크레딧** 자동 지급 (nova-3 기준 약 770시간 분량).

![Deepgram 회원가입 화면](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img1.webp)

2. 대시보드 좌측 메뉴 → **API Keys** → **Create New API Key** 클릭.
3. 키 이름은 자유 (예: \`obsidian-stt\`), 권한은 \`Member\` 이상이면 충분.
4. 생성된 \`xxxxxxx...\` 형식 키를 즉시 복사 (페이지 떠나면 다시 못 봄).

![API 키 생성 화면](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img2.webp)

### 2단계 — 플러그인에 API 키 입력

1. 옵시디언 → **설정** → **Community plugins** → "Deepgram Meeting STT" 옆 **톱니바퀴** 클릭.
2. **"Deepgram API 키"** 칸에 복사한 키 붙여넣기.
3. **"검증"** 버튼 클릭 → \`✓ API 키 유효\` 메시지 확인.

![플러그인 설정 탭](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img3.webp)

### 3단계 — 녹음 파일 넣고 변환 실행

1. **녹음 파일을 \`ObsiDeep/Audio/\`에 넣기**
   - **옵시디언 창에 직접 드래그앤드롭**: Finder에서 녹음 파일을 잡아 **옵시디언 창 좌측 사이드바**의 \`ObsiDeep/Audio/\` 폴더 위로 끌어다 놓기.
   - 또는 **Finder에서 직접 복사**: vault 폴더의 \`ObsiDeep/Audio/\` 안에 붙여넣기.

   > 💡 Finder에서 직접 복사한 경우 옵시디언 좌측 사이드바에 파일이 바로 안 보일 수 있습니다. 그 때는 \`Cmd+P\` (Windows/Linux: \`Ctrl+P\`) → **"저장하지 않고 앱 새로고침"** 실행 후 다음 단계로.

2. **변환 실행** — 옵시디언 좌측 사이드바에서 그 오디오 파일을 **우클릭 → "Transcribe with Deepgram"** (한국어 UI에서는 "Deepgram으로 회의록 추출")

![파일 우클릭 → Transcribe with Deepgram](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img4.webp)

3. **제목 입력 → Enter** → 약 1~2분 후 \`STT/\` 폴더에 \`.md\` 회의록이 자동 생성·열림.

> 명령 팔레트(\`Cmd+P\` / \`Ctrl+P\`)에서 "Transcribe audio → meeting note"로도 동일하게 실행할 수 있습니다.

---

## 보안 & 프라이버시

### Deepgram 자체 보안

Deepgram은 다음 보안·규제 표준을 준수합니다:

| 표준 | 내용 |
|---|---|
| **GDPR** | EU/UK 일반 개인정보보호 규정 준수 |
| **SOC 2 Type II** | 외부 감사 완료 (보안·가용성·기밀성) |
| **HIPAA** | 의료 정보 처리 호환 가능 (별도 BAA 필요) |
| **CCPA** | 캘리포니아 소비자 개인정보 보호법 대응 |
| **DPA** | 기업 고객용 데이터 처리 동의서 제공 |

상세: [Deepgram Trust Center](https://trust.deepgram.com) · [Privacy Policy](https://deepgram.com/privacy)

### Zero Retention (기본 **ON**)

기본적으로 \`dg-zero-retention: true\` 헤더를 Deepgram에 전달합니다.

- **효과**: Deepgram이 변환 후 오디오·텍스트를 **즉시 폐기** (서버 측 보관 0).
- **요금제 조건**: Growth 이상 요금제에서만 즉시 적용 보장. 무료/Pay-as-you-go에서는 표준 정책(~30일 보관)이 적용될 수 있습니다.
- **변경**: 설정 → "Zero Retention" 토글로 끄기 가능.

### vault 측 보호

- 이 폴더(\`ObsiDeep/\`)는 vault \`.gitignore\`에 등록되어 git에 올라가지 않습니다.
- API 키 파일(\`.obsidian/plugins/deepgram-meeting-stt/data.json\`)도 \`.gitignore\`로 보호.

### 권장 사항

- 회의 참석자에게 **녹음·외부 API 전송에 대한 사전 동의**를 받는 것을 권장합니다.
- 매우 민감한 회의는 **Deepgram Growth 이상 + Zero Retention** 조합, 또는 자체 호스팅 모델 검토.

---

## 비용 (참고)

Deepgram **nova-3** 모델 기준:

| 길이 | 비용 (약, USD) |
|---|---|
| 30분 | $0.13 |
| 1시간 | $0.26 |
| 2시간 | $0.52 |

최신 가격: [Deepgram Pricing](https://deepgram.com/pricing). 무료 가입 시 $200 크레딧이라 한참 사용 가능합니다.

---

## 더 알아보기

- **기능 가이드** (정확도 팁·화자 이름 정리·템플릿 토큰·업데이트 확인): 같은 폴더의 [[FEATURES]] 파일
- **GitHub repo**: https://github.com/Moonjuun/obsidian-deepgram-stt
- **이슈/제안**: [GitHub Issues](https://github.com/Moonjuun/obsidian-deepgram-stt/issues)
`;

const EN_README = `# ObsiDeep — Deepgram Meeting STT

This folder is the auto-created workspace for the [Deepgram Meeting STT](https://github.com/Moonjuun/obsidian-deepgram-stt) plugin. **Day-to-day feature guides live in [[FEATURES]] in this same folder.**

## Folder layout

- \`Audio/\` — drop your meeting recordings here.
- \`STT/\` — transcribed meeting notes land here automatically.

---

## Getting started (3 steps)

### Step 1 — Sign up to Deepgram & get an API key

1. Create an account at [Deepgram Console](https://console.deepgram.com) (Google or email).
   - You automatically receive **$200 in free credits** on signup (~770 hours of nova-3 transcription).

![Deepgram signup screen](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img1.webp)

2. In the dashboard sidebar → **API Keys** → **Create New API Key**.
3. Pick any name (e.g. \`obsidian-stt\`); \`Member\` permission is enough.
4. Copy the \`xxxxxxx...\` key immediately — you can't view it again after leaving the page.

![Create API Key](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img2.webp)

### Step 2 — Paste the API key into the plugin

1. Obsidian → **Settings** → **Community plugins** → click the **gear icon** next to "Deepgram Meeting STT".
2. Paste the key into **"Deepgram API key"**.
3. Click **"Validate"** → you should see \`✓ API key is valid\`.

![Plugin settings tab](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img3.webp)

### Step 3 — Drop a recording and transcribe

1. **Put the recording into \`ObsiDeep/Audio/\`**
   - **Drag-and-drop into the Obsidian window**: grab the file in Finder/Explorer and drop it onto the \`ObsiDeep/Audio/\` folder in **Obsidian's left sidebar**.
   - Or copy it directly into the \`ObsiDeep/Audio/\` directory in your vault folder.

   > 💡 If you copied via Finder/Explorer, Obsidian's left sidebar might not show the new file immediately. In that case, press \`Cmd+P\` (Windows/Linux: \`Ctrl+P\`) → **"Reload app without saving"** and continue.

2. **Run transcription** — in Obsidian's left sidebar, **right-click** the audio file → **"Transcribe with Deepgram"** (label is localized; "Deepgram으로 회의록 추출" in Korean UI).

![Right-click → Transcribe with Deepgram](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img4.webp)

3. **Enter a title → press Enter** → after ~1–2 min a \`.md\` note appears in \`STT/\` and opens automatically.

> The command palette (\`Cmd+P\` / \`Ctrl+P\`) → "Transcribe audio → meeting note" runs the same flow.

---

## Security & privacy

### Deepgram's security posture

| Standard | Coverage |
|---|---|
| **GDPR** | EU/UK general data protection regulation |
| **SOC 2 Type II** | Audited (security, availability, confidentiality) |
| **HIPAA** | Healthcare-compatible (BAA available) |
| **CCPA** | California consumer privacy compliance |
| **DPA** | Data Processing Agreement available for business |

Details: [Deepgram Trust Center](https://trust.deepgram.com) · [Privacy Policy](https://deepgram.com/privacy)

### Zero Retention (default **ON**)

The plugin sends \`dg-zero-retention: true\` to Deepgram by default.

- **Effect**: Deepgram discards audio and transcripts **immediately** after processing.
- **Plan requirements**: Guaranteed on Growth or higher plans. Free / Pay-as-you-go may still retain (~30 days).
- **Toggle off**: Settings → "Zero Retention" if you want transcripts visible in the Deepgram dashboard for debugging.

### Vault-side protection

- This \`ObsiDeep/\` folder is added to your vault's \`.gitignore\`, so its contents never enter vault git sync.
- Your API key (\`.obsidian/plugins/deepgram-meeting-stt/data.json\`) is excluded the same way.

### Recommendations

- Always obtain **prior consent** from meeting participants.
- For highly sensitive material: combine **Deepgram Growth+** with **Zero Retention**, or evaluate self-hosted alternatives.

---

## Cost (reference)

Using **nova-3**:

| Length | Cost (approx., USD) |
|---|---|
| 30 min | $0.13 |
| 1 hour | $0.26 |
| 2 hours | $0.52 |

Current pricing: [Deepgram Pricing](https://deepgram.com/pricing). The free $200 credit covers a lot.

---

## Learn more

- **Feature guides** (accuracy tips, renaming speakers, template tokens, update check): [[FEATURES]] in this same folder
- **GitHub repo**: https://github.com/Moonjuun/obsidian-deepgram-stt
- **Issues / suggestions**: [GitHub Issues](https://github.com/Moonjuun/obsidian-deepgram-stt/issues)
`;

// ─── FEATURES — 기능별 가이드 ─────────────────────────────────────────

const KO_FEATURES = `# 기능 & 가이드

이 파일은 plugin의 **기능별 상세 가이드** 모음입니다. 처음 시작·설치 정보는 [[README]]에 있고, 여기는 사용 중 자주 참고할 내용을 모았습니다. 새 기능이 추가되면 이 파일에 섹션이 늘어납니다.

## 목차

- [정확도 가이드 (오디오 품질·화자 수)](#정확도-가이드)
- [화자 이름 정리](#화자-이름-정리)
- [템플릿 토큰](#템플릿-토큰)
- [업데이트 확인](#업데이트-확인)

---

## 정확도 가이드

STT 정확도는 **녹음 환경의 영향을 크게 받습니다**. 좋은 회의록을 위해 입력 단계에서 신경 써주세요.

### 오디오 품질

- **권장 sample rate**: 16 kHz 이상 (Deepgram은 8/16/24/32/48 kHz 지원).
- **권장 포맷**: 품질 우선이면 \`FLAC\` / \`WAV\` (Linear PCM), 파일 크기 우선이면 \`MP3\` / \`AAC\` / \`Opus\`.
- 새 녹음 환경 도입 시 **5~10분 샘플로 먼저 테스트**해 인식률을 확인하는 것을 Deepgram이 권장합니다.

### 화자 수

- Deepgram diarize는 **명시적 화자 수 상한이 없음** — 공식적으로 16명 이상에서도 검증됐다고 발표 ([출처](https://deepgram.com/learn/what-is-speaker-diarization)).
- 화자가 늘수록 오인식(speaker confusion) 가능성이 올라갑니다. 4명·CER 10% 기준으로 1시간 회의에서 약 6분 분량의 발언이 잘못된 화자로 매핑될 수 있습니다.
- **권장**: 정확도가 중요한 회의는 **8명 이하** + 발언이 어느 정도 연속되는 환경.
- 격렬한 turn-taking(자주 끼어드는 토론)은 화자 분리 실패율이 높습니다.

### 회의실 녹음 체크리스트

| 항목 | 권장 |
|---|---|
| 마이크 종류 | 화자 가까이(~30cm) 또는 회의실 천장 array 마이크 |
| 화자 ↔ 마이크 거리 | 가까울수록 ↑ |
| 백색 노이즈 | 에어컨·키보드·빔프로젝터 fan 등 최소화 |
| 에코 / 반향 | 유리·벽 반사가 많은 공간은 ↓ — 흡음재가 있는 공간이 유리 |
| 동시 발화 | 두 명 이상 동시 발언 시 분리 실패 가능 |
| 사전 테스트 | 새 회의실 / 녹음기 도입 시 짧은 샘플로 결과 검토 |

> 결과가 만족스럽지 않다면 같은 녹음을 [Deepgram Playground](https://playground.deepgram.com)에 올려 다른 모델(\`nova-2\` 등)과 비교해볼 수 있습니다.

---

## 화자 이름 정리

회의록의 frontmatter \`speakers\` 항목은 기본적으로 \`화자 1\`, \`화자 2\`... 같은 익명 라벨로 채워집니다. 실제 이름으로 바꿔두면 검색·추적이 쉬워집니다.

1. 정리하려는 회의록 노트를 엽니다.
2. 명령 팔레트(\`Cmd+P\` / \`Ctrl+P\`) → **"화자 이름 변경 (현재 노트)"** 실행.

![화자 이름 변경 명령](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img5.webp)

3. 모달이 열리면 상단에 **현재 노트 이름**이 표시되고, **"변경 전" 칸은 드롭다운**으로 노트에서 자동 감지된 화자 목록이 채워집니다.
   - **변경 전**: 드롭다운에서 변경할 화자 선택 (예: \`화자 1\`)
   - **변경 후**: 실제 이름 입력 (예: \`홍길동\`)
4. **치환** 클릭 → 본문의 모든 \`화자 1\`과 frontmatter \`speakers\` 배열의 라벨이 일괄 치환됩니다.

> 화자가 여러 명이면 명령을 여러 번 실행하시면 됩니다.

---

## 템플릿 토큰

설정 → 변환 옵션 → **"템플릿 경로"** 에 vault 내 마크다운 파일을 지정하면, 그 안의 다음 토큰들이 자동 치환됩니다.

| 토큰 | 치환 결과 |
|---|---|
| \`{{date}}\` | \`YYYY-MM-DD\` (변환 실행 시각 기준) |
| \`{{title}}\` | 사용자 입력 제목 |
| \`{{transcript}}\` | diarize on이면 화자별 마크다운, off면 plain text |
| \`{{speakers_transcript}}\` | 항상 화자별 마크다운 (시간 세그먼트 포함) |
| \`{{plain_transcript}}\` | 항상 plain text |
| \`{{speakers_list}}\` | 등장 화자 목록을 YAML 배열로 (예: \`["화자 1", "화자 2"]\`) |
| \`{{duration}}\` | \`5m 30s\` 같은 형식 |
| \`{{audio_link}}\` | \`[[ObsiDeep/Audio/녹음.m4a]]\` wikilink |
| \`{{language}}\` | \`ko\` / \`en\` / \`auto\` |
| \`{{model}}\` | \`nova-3\` / \`nova-2\` |

내장 기본 템플릿(템플릿 경로를 비웠을 때):

\`\`\`markdown
---
date: {{date}}
type: meeting
tags: [meeting, stt]
duration: {{duration}}
language: {{language}}
source: {{audio_link}}
speakers: {{speakers_list}}
---

# {{title}}

{{transcript}}
\`\`\`

---

## 모바일에서 사용

이 플러그인은 옵시디언 **iOS / Android에서도 동작**합니다. 데스크톱과 거의 동일하되 입력 방식이 다릅니다:

| 데스크톱 | 모바일 대안 |
|---|---|
| Finder/Explorer에서 드래그앤드롭 | 다른 앱 → 공유 → Obsidian, 또는 옵시디언 안 파일 import |
| 좌측 사이드바에서 우클릭 | 파일을 **길게 누르기 (long-press)** → 컨텍스트 메뉴 |
| 명령 팔레트 \`Cmd+P\` | 좌측 ⋯ → "Command palette" |

> 큰 녹음 파일은 모바일 메모리·셀룰러 데이터 사용량에 주의하세요. 1시간 회의(~50MB)는 일반적으로 무리 없습니다.

---

## 업데이트 확인

설정 → "정보" 섹션에 두 가지 항목이 있습니다:

- **GitHub 릴리스**: 클릭 시 전체 release 목록 페이지를 새 탭으로 엽니다.
- **업데이트 확인**: GitHub Releases API로 최신 버전을 조회 → Notice로 결과 표시.
  - 새 버전 있음: \`업데이트 가능: 0.5.1 (현재 0.5.0)\` — 페이지를 자동으로 열지 않으니 "GitHub 릴리스" 버튼으로 열면 됩니다.
  - 최신: \`최신 버전입니다\`
  - 로컬이 앞섬(개발자 케이스): \`로컬 버전이 릴리스보다 앞섭니다\`

Community Plugins로 설치한 경우 옵시디언이 새 버전을 자동으로 안내하므로 이 버튼은 보조 진입점입니다.
`;

const EN_FEATURES = `# Features & Guides

This file collects **per-feature guides** for the plugin. Onboarding / install lives in [[README]]; this file covers day-to-day usage. New features get a section added here as they ship.

## Table of contents

- [Accuracy guide (audio quality & speaker count)](#accuracy-guide)
- [Renaming speakers](#renaming-speakers)
- [Template tokens](#template-tokens)
- [Update check](#update-check)

---

## Accuracy guide

STT accuracy is **heavily influenced by the recording environment**. A few input-side tweaks go a long way.

### Audio quality

- **Recommended sample rate**: 16 kHz or higher (Deepgram supports 8 / 16 / 24 / 32 / 48 kHz).
- **Recommended formats**: \`FLAC\` / \`WAV\` (Linear PCM) for fidelity, \`MP3\` / \`AAC\` / \`Opus\` for size.
- Deepgram recommends **testing with a 5–10 min sample** whenever you adopt a new recording setup.

### Number of speakers

- Deepgram diarize has **no hard cap on speaker count** — they publicly report validated accuracy at 16+ speakers ([source](https://deepgram.com/learn/what-is-speaker-diarization)).
- More speakers means more chances of speaker-confusion. At 4 speakers with 10% CER, roughly 6 minutes per hour of audio could be attributed to the wrong speaker.
- **Practical recommendation**: for accuracy-sensitive meetings, keep it to **≤ 8 speakers** with reasonably long contiguous turns.
- Fast turn-taking debates have a notably higher diarization error rate than meetings with longer speaker turns.

### Meeting-room recording checklist

| Item | Recommendation |
|---|---|
| Microphone | Close-talking (~30cm) or ceiling array mic |
| Speaker ↔ mic distance | Closer is always better |
| White noise | Minimize AC, keyboards, projector fans |
| Echo / reverb | Glass-and-concrete rooms hurt accuracy — prefer rooms with soft absorbing surfaces |
| Overlapping speech | Two or more speakers at once breaks diarization |
| Pilot test | Run a short sample whenever you change rooms or recorders |

> If a recording doesn't transcribe well, drop the same file into the [Deepgram Playground](https://playground.deepgram.com) and compare with \`nova-2\` or other models.

---

## Renaming speakers

The \`speakers\` frontmatter starts with anonymous labels (\`화자 1\`, \`화자 2\`, ...). Replacing those with real names makes the notes searchable.

1. Open the meeting note you want to edit.
2. Command palette (\`Cmd+P\` / \`Ctrl+P\`) → **"Rename speaker (current note)"**.

![Rename speaker command](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img5.webp)

3. The modal shows the **current note name** at the top, and the **From field is a dropdown** populated with speakers auto-detected from the note.
   - **From**: pick the speaker to rename (e.g. \`화자 1\`)
   - **To**: type the real name (e.g. \`홍길동\`)
4. Click **Replace** — every occurrence in the body and in the \`speakers\` frontmatter array is renamed at once.

> Repeat the command for each speaker.

---

## Template tokens

Set Settings → Transcription → **"Template path"** to any vault-relative markdown file. The plugin will substitute these tokens before saving:

| Token | Expansion |
|---|---|
| \`{{date}}\` | \`YYYY-MM-DD\` (time of transcription) |
| \`{{title}}\` | Title entered by the user |
| \`{{transcript}}\` | Speaker-formatted markdown when diarize is on, plain text otherwise |
| \`{{speakers_transcript}}\` | Always speaker-formatted markdown (with time ranges) |
| \`{{plain_transcript}}\` | Always plain text |
| \`{{speakers_list}}\` | Detected speakers as YAML inline array (e.g. \`["화자 1", "화자 2"]\`) |
| \`{{duration}}\` | Formatted like \`5m 30s\` |
| \`{{audio_link}}\` | Wikilink such as \`[[ObsiDeep/Audio/recording.m4a]]\` |
| \`{{language}}\` | \`ko\` / \`en\` / \`auto\` |
| \`{{model}}\` | \`nova-3\` / \`nova-2\` |

Built-in default template (when no template path is set):

\`\`\`markdown
---
date: {{date}}
type: meeting
tags: [meeting, stt]
duration: {{duration}}
language: {{language}}
source: {{audio_link}}
speakers: {{speakers_list}}
---

# {{title}}

{{transcript}}
\`\`\`

---

## Mobile usage

The plugin works on **Obsidian for iOS / Android** as well. Inputs differ a bit:

| Desktop | Mobile equivalent |
|---|---|
| Drag-and-drop from Finder/Explorer | Share → Obsidian from another app, or use in-app file import |
| Right-click in the left sidebar | **Long-press** the file for the context menu |
| Command palette \`Cmd+P\` | Left ⋯ menu → "Command palette" |

> Watch memory and mobile data usage for very large recordings. 1-hour meetings (~50MB) are usually fine.

---

## Update check

In Settings → "About" you have two controls:

- **GitHub releases** — opens the full release list in a new tab.
- **Check for updates** — queries the GitHub Releases API and reports the result as a Notice:
  - Newer release: \`Update available: 0.5.1 (current 0.5.0)\` (does not auto-open; use the GitHub releases button)
  - You're up to date: \`You're on the latest version\`
  - Local ahead (dev case): \`Local version is ahead of latest release\`

If you installed via Community Plugins, Obsidian will notify you of new versions automatically — this button is just a secondary entry point.
`;
