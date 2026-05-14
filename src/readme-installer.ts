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

const KO_README = `# ObsiDeep — Meeting Transcription & AI Summary

이 폴더는 [ObsiDeep](https://github.com/Moonjuun/obsidian-deepgram-stt) 플러그인이 자동 생성한 작업 공간입니다. **사용 중 자주 보는 기능 가이드는 같은 폴더의 [[FEATURES]] 파일에 모아두었습니다.**

## 폴더 구조

- \`Audio/\` — 회의 녹음 파일을 여기에 넣으세요.
- \`STT/\` — 변환된 회의록 노트가 자동 저장됩니다.
- \`Templates/\` — AI 요약 템플릿 \`.md\` 파일 (\`회의록.md\`, \`인터뷰.md\`, \`강의노트.md\`가 자동 시드됨).
- \`AI-Summaries/\` — AI 요약 결과 노트가 \`{제목} (요약).md\`로 저장됩니다.

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

1. 옵시디언 → **설정** → **Community plugins** → "ObsiDeep" 옆 **톱니바퀴** 클릭.
2. **"Deepgram API 키"** 칸에 복사한 키 붙여넣기.
3. **"검증"** 버튼 클릭 → \`✓ API 키 유효\` 메시지 확인.

![플러그인 설정 — Deepgram 키 (필수) + Gemini 키 (AI 요약용, 선택)](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img3.webp)

> **(선택) AI 요약까지 쓰려면** — 같은 페이지의 **"AI 요약 (Gemini)"** 섹션에서 **"Gemini API 키"**에 [Google AI Studio](https://aistudio.google.com/apikey)에서 발급받은 키도 추가로 붙여넣으세요. Gemini 키가 비어있으면 AI 요약 메뉴는 표시되지 않고 STT 단독 도구로 동작합니다.

### 3단계 — 녹음 파일 넣고 변환 실행

1. **녹음 파일을 \`ObsiDeep/Audio/\`에 넣기**
   - **옵시디언 창에 직접 드래그앤드롭**: Finder에서 녹음 파일을 잡아 **옵시디언 창 좌측 사이드바**의 \`ObsiDeep/Audio/\` 폴더 위로 끌어다 놓기.
   - 또는 **Finder에서 직접 복사**: vault 폴더의 \`ObsiDeep/Audio/\` 안에 붙여넣기.

   > 💡 Finder에서 직접 복사한 경우 옵시디언 좌측 사이드바에 파일이 바로 안 보일 수 있습니다. 그 때는 \`Cmd+P\` (Windows/Linux: \`Ctrl+P\`) → **"저장하지 않고 앱 새로고침"** 실행 후 다음 단계로.

2. **변환 실행** — 사이드바에서 그 오디오 파일을 **우클릭 → \`ObsiDeep ▸\`** 서브메뉴에서 원하는 항목 선택:
   - **\`STT만 추출\`** — STT 회의록만 생성 (Deepgram 키만 있으면 됨)
   - **\`⭐ STT + AI 요약: 회의록\`** — STT + AI 요약을 한 번에 (Gemini 키 설정 시 노출)
   - **\`AI 요약 ▸\`** — 즐겨찾기가 아닌 다른 템플릿(인터뷰·강의노트 등)

   기존 마크다운 노트를 우클릭하면 \`ObsiDeep ▸ ⭐ AI 요약: 회의록\`으로 **재요약**도 가능합니다.

![ObsiDeep 우클릭 서브메뉴 (예시: 마크다운 노트의 재요약 메뉴)](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img4.webp)

3. **제목 입력 → Enter** → 약 1~2분 후 \`STT/\` 폴더에 \`.md\` 회의록이 자동 생성·열림. AI 요약을 함께 실행했다면 \`AI-Summaries/\` 폴더에 요약 노트도 같이 생성됩니다.

> 명령 팔레트(\`Cmd+P\` / \`Ctrl+P\`)에서 "회의록 추출 (Transcribe audio → meeting note)" 또는 "STT + AI 요약 (Transcribe and summarize)"으로도 동일하게 실행할 수 있습니다.

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

Deepgram **nova-3** + Gemini **2.5-flash** 기준:

| 길이 | Deepgram | Gemini (요약) | 합계 (약) |
|---|---|---|---|
| 30분 | $0.13 | ~$0.005 | ~$0.14 |
| 1시간 | $0.26 | ~$0.01 | ~$0.27 |
| 2시간 | $0.52 | ~$0.02 | ~$0.54 |

Deepgram 무료 $200 크레딧 + Gemini 무료 티어로 일반적인 사용량은 충분히 커버됩니다. 최신 가격: [Deepgram Pricing](https://deepgram.com/pricing) · [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing).

---

## 더 알아보기

- **기능 가이드** (정확도 팁·화자 이름 정리·AI 요약 템플릿·재요약·업데이트 확인): 같은 폴더의 [[FEATURES]] 파일
- **GitHub repo**: https://github.com/Moonjuun/obsidian-deepgram-stt
- **이슈/제안**: [GitHub Issues](https://github.com/Moonjuun/obsidian-deepgram-stt/issues)
`;

const EN_README = `# ObsiDeep — Meeting Transcription & AI Summary

This folder is the auto-created workspace for the [ObsiDeep](https://github.com/Moonjuun/obsidian-deepgram-stt) plugin. **Day-to-day feature guides live in [[FEATURES]] in this same folder.**

## Folder layout

- \`Audio/\` — drop your meeting recordings here.
- \`STT/\` — transcribed meeting notes land here automatically.
- \`Templates/\` — AI summary template \`.md\` files (\`Meeting.md\`, \`Interview.md\`, \`Lecture.md\` are auto-seeded).
- \`AI-Summaries/\` — AI summary results saved as \`{title} (요약).md\`.

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

1. Obsidian → **Settings** → **Community plugins** → click the **gear icon** next to "ObsiDeep".
2. Paste the key into **"Deepgram API key"**.
3. Click **"Validate"** → you should see \`✓ API key is valid\`.

![Plugin settings — Deepgram key (required) + Gemini key (optional, for AI summary)](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img3.webp)

> **(Optional) Enable AI summary too** — on the same page, scroll to the **"AI summary (Gemini)"** section and paste a [Google AI Studio](https://aistudio.google.com/apikey) key into **"Gemini API key"**. Leave it blank if you only want STT — the AI summary menu items stay hidden and the plugin acts as a pure STT tool.

### Step 3 — Drop a recording and transcribe

1. **Put the recording into \`ObsiDeep/Audio/\`**
   - **Drag-and-drop into the Obsidian window**: grab the file in Finder/Explorer and drop it onto the \`ObsiDeep/Audio/\` folder in **Obsidian's left sidebar**.
   - Or copy it directly into the \`ObsiDeep/Audio/\` directory in your vault folder.

   > 💡 If you copied via Finder/Explorer, Obsidian's left sidebar might not show the new file immediately. In that case, press \`Cmd+P\` (Windows/Linux: \`Ctrl+P\`) → **"Reload app without saving"** and continue.

2. **Run transcription** — in the sidebar, **right-click** the audio file → **\`ObsiDeep ▸\`** submenu and pick one:
   - **\`Transcribe only\`** — STT transcript only (just needs a Deepgram key)
   - **\`⭐ Transcribe + AI summary: Meeting\`** — STT + AI summary in one go (visible once a Gemini key is set)
   - **\`AI summary ▸\`** — non-favorite templates (Interview, Lecture, etc.)

   You can also right-click any existing markdown note → \`ObsiDeep ▸ ⭐ AI summary: Meeting\` to **re-summarize** it.

![ObsiDeep right-click submenu (example shows the re-summarize menu on a markdown note)](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img4.webp)

3. **Enter a title → press Enter** → after ~1–2 min a \`.md\` note appears in \`STT/\` and opens automatically. If you ran the AI summary path, a matching summary note is created in \`AI-Summaries/\`.

> The command palette (\`Cmd+P\` / \`Ctrl+P\`) → "Transcribe audio → meeting note" or "Transcribe and summarize" runs the same flows.

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

Using **nova-3** + **gemini-2.5-flash**:

| Length | Deepgram | Gemini (summary) | Total (approx.) |
|---|---|---|---|
| 30 min | $0.13 | ~$0.005 | ~$0.14 |
| 1 hour | $0.26 | ~$0.01 | ~$0.27 |
| 2 hours | $0.52 | ~$0.02 | ~$0.54 |

The free $200 Deepgram credit + Gemini's free tier cover a lot of typical usage. Current pricing: [Deepgram Pricing](https://deepgram.com/pricing) · [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing).

---

## Learn more

- **Feature guides** (accuracy tips, renaming speakers, AI summary templates, re-summarizing, update check): [[FEATURES]] in this same folder
- **GitHub repo**: https://github.com/Moonjuun/obsidian-deepgram-stt
- **Issues / suggestions**: [GitHub Issues](https://github.com/Moonjuun/obsidian-deepgram-stt/issues)
`;

// ─── FEATURES — 기능별 가이드 ─────────────────────────────────────────

const KO_FEATURES = `# 기능 & 가이드

이 파일은 plugin의 **기능별 상세 가이드** 모음입니다. 처음 시작·설치 정보는 [[README]]에 있고, 여기는 사용 중 자주 참고할 내용을 모았습니다. 새 기능이 추가되면 이 파일에 섹션이 늘어납니다.

## 목차

- [정확도 가이드 (오디오 품질·화자 수)](#정확도-가이드)
- [화자 이름 정리](#화자-이름-정리)
- [STT 템플릿 토큰](#stt-템플릿-토큰)
- [AI 요약 (Gemini)](#ai-요약-gemini)
- [모바일에서 사용](#모바일에서-사용)
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

## STT 템플릿 토큰

설정 → 변환 옵션 → **"템플릿 경로"** 에 vault 내 마크다운 파일을 지정하면, 그 안의 다음 토큰들이 자동 치환됩니다. (이건 STT 회의록 자체 양식을 커스터마이즈하는 용도입니다. AI 요약 템플릿은 별개 — 아래 [AI 요약](#ai-요약-gemini) 섹션 참고.)

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

## AI 요약 (Gemini)

STT만 써도 충분하지만, **Gemini API 키**를 등록하면 회의록 옆에 **구조화된 요약 노트**(요약·결정 사항·액션 아이템 등)를 같이 만들 수 있습니다.

### 설정

1. [Google AI Studio](https://aistudio.google.com/apikey)에서 API 키 발급
2. 설정 → ObsiDeep → **"Gemini API 키"**에 붙여넣기
3. 모델 선택 — 기본 \`gemini-2.5-flash\` (빠르고 저렴). 더 높은 품질이 필요하면 \`gemini-2.5-pro\`.

키가 비어있으면 AI 메뉴는 표시되지 않고 STT 단독 도구로 동작합니다.

### 사용 흐름

**(1) 오디오 → STT + 요약 (한 번에)**

오디오 파일 우클릭 → **\`ObsiDeep ▸\`**:
- **\`⭐ STT + AI 요약: 회의록\`** — favorite 템플릿은 평면 노출. 즉시 실행.
- **\`AI 요약 ▸\`** — 그 외 템플릿(인터뷰·강의노트 등)이 서브메뉴로.

결과: STT는 \`STT/\`, 요약은 \`AI-Summaries/{제목} (요약).md\`. 요약 노트 frontmatter엔 \`source: "[[...]]"\`로 원본 STT 백링크가 자동 삽입됩니다.

**(2) 기존 노트를 다시 요약**

기존 마크다운 노트 우클릭 → **\`ObsiDeep ▸ ⭐ AI 요약: 회의록\`** (favorite) 또는 **\`ObsiDeep ▸ AI 요약 ▸ <템플릿>\`** (그 외). 노트 본문이 입력 transcript가 됩니다 — 다른 템플릿으로 재요약하거나, 이 플러그인이 만들지 않은 노트도 요약 가능.

### 내장 템플릿

설치 시 \`Templates/\` 폴더에 자동 시드됩니다 (UI 언어에 따라 KO 또는 EN 셋):

| 파일 | favorite | 출력 형식 |
|---|---|---|
| \`회의록.md\` | ⭐ | 요약 / 결정 사항 / 액션 아이템 (명사형 종결어미체) |
| \`인터뷰.md\` | | 요약 / 주제 / 핵심 발언 (인용문) |
| \`강의노트.md\` | | 요약 / 핵심 개념 / 후속 학습 |

각 파일은 자유롭게 편집 가능합니다. \`favorite: true\`를 \`false\`로 바꾸면 서브메뉴로 이동하고, 반대도 가능합니다.

### 템플릿 파일 형식

\`\`\`markdown
---
name: "회의록"
favorite: true
prompt: |
  아래 회의 전사를 회의록 형식으로 한국어로 요약해줘.
  명사형 종결어미체 (결정함, 논의됨, 공유됨) 사용.
  - summary: 마크다운 불릿 3-5개, 각 항목은 새 줄.
  - decisions: 결정 사항마다 한 줄 불릿.
  - action_items: 마크다운 체크박스, 담당자 @이름.
placeholders:
  summary: "마크다운 불릿 목록, 줄마다 새 줄"
  decisions: "마크다운 불릿 목록, 줄마다 새 줄"
  action_items: "마크다운 체크박스, 줄마다 새 줄"
---
# {{title}}

> 출처: {{source}} · {{date}} · {{duration}}

## 요약
{{summary}}

## 결정 사항
{{decisions}}

## 액션 아이템
{{action_items}}
\`\`\`

- **\`prompt\`** — Gemini에게 보내는 지시문. 응답 언어는 UI 언어를 따라 자동으로 추가됩니다.
- **\`placeholders\`** — Gemini가 채울 키와 그 설명. Gemini 2.5의 structured output(JSON mode)으로 한 번에 채워지고, 본문의 \`{{key}}\`에 그대로 치환됩니다.
- **\`favorite\`** — true면 우클릭 메뉴 평면 노출, false면 \`AI 요약 ▸\` 서브메뉴.

### 시스템 placeholder (코드가 채움)

| 토큰 | 치환 결과 |
|---|---|
| \`{{transcript}}\` | STT 결과 본문 (요약 입력으로도 사용) |
| \`{{title}}\` | 사용자 입력 제목 |
| \`{{date}}\` | \`YYYY-MM-DD\` |
| \`{{datetime}}\` | \`YYYY-MM-DD HH:MM\` |
| \`{{source}}\` | 원본 STT 노트로의 \`[[wikilink]]\` |
| \`{{language}}\` | UI 언어 라벨 (예: \`Korean\`) |
| \`{{duration}}\` | \`HH:MM:SS\` 또는 \`MM:SS\` |
| \`{{speakers}}\` | 등장 화자 목록 (콤마 구분) |

### 새 템플릿 만들기

명령 팔레트 → **"새 요약 템플릿 만들기 (Create new summary template)"** 실행 → 모든 시스템 placeholder가 주석으로 정리된 스타터 파일이 \`Templates/\` 폴더에 생성되어 바로 열립니다.

### 실패 시 동작

- **STT 실패** → 전체 중단. 요약 단계 실행 안 함.
- **요약만 실패** → STT 노트는 보존되고 요약 에러만 Notice로 안내. Gemini가 잘못된 JSON을 반환하면 자동으로 1회 재시도합니다.

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
- [STT template tokens](#stt-template-tokens)
- [AI summary (Gemini)](#ai-summary-gemini)
- [Mobile usage](#mobile-usage)
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

The \`speakers\` frontmatter starts with anonymous labels (\`Speaker 1\`, \`Speaker 2\`, ...). Replacing those with real names makes the notes searchable.

1. Open the meeting note you want to edit.
2. Command palette (\`Cmd+P\` / \`Ctrl+P\`) → **"Rename speaker (current note)"**.

![Rename speaker command](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img5.webp)

3. The modal shows the **current note name** at the top, and the **From field is a dropdown** populated with speakers auto-detected from the note.
   - **From**: pick the speaker to rename (e.g. \`Speaker 1\`)
   - **To**: type the real name (e.g. \`Hong Gildong\`)
4. Click **Replace** — every occurrence in the body and in the \`speakers\` frontmatter array is renamed at once.

> Repeat the command for each speaker.

---

## STT template tokens

Set Settings → Transcription → **"Template path"** to any vault-relative markdown file. The plugin will substitute these tokens before saving. (This customizes the STT transcript note layout. AI summary templates are a separate system — see [AI summary](#ai-summary-gemini) below.)

| Token | Expansion |
|---|---|
| \`{{date}}\` | \`YYYY-MM-DD\` (time of transcription) |
| \`{{title}}\` | Title entered by the user |
| \`{{transcript}}\` | Speaker-formatted markdown when diarize is on, plain text otherwise |
| \`{{speakers_transcript}}\` | Always speaker-formatted markdown (with time ranges) |
| \`{{plain_transcript}}\` | Always plain text |
| \`{{speakers_list}}\` | Detected speakers as YAML inline array (e.g. \`["Speaker 1", "Speaker 2"]\`) |
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

## AI summary (Gemini)

STT alone is enough for most cases, but if you set a **Gemini API key** the plugin can produce a **structured summary note** (overview, decisions, action items, etc.) alongside the transcript.

### Setup

1. Get an API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Settings → ObsiDeep → **"Gemini API key"** → paste
3. Pick a model — default \`gemini-2.5-flash\` (fast & cheap). Switch to \`gemini-2.5-pro\` for higher quality.

Leave the key blank to keep AI menus hidden and use the plugin as a pure STT tool.

### Flows

**(1) Audio → STT + summary (one shot)**

Right-click an audio file → **\`ObsiDeep ▸\`**:
- **\`⭐ Transcribe + AI summary: Meeting\`** — favorite templates surface flat. Runs immediately.
- **\`AI summary ▸\`** — non-favorite templates (Interview, Lecture, etc.) live under this submenu.

Result: STT lands in \`STT/\`, summary in \`AI-Summaries/{title} (요약).md\`. The summary note's frontmatter has \`source: "[[...]]"\` linking back to the transcript.

**(2) Re-summarize an existing note**

Right-click any markdown note → **\`ObsiDeep ▸ ⭐ AI summary: Meeting\`** (favorite) or **\`ObsiDeep ▸ AI summary ▸ <template>\`** (others). The note body becomes the input transcript — useful for trying a different template, or summarizing notes that didn't come from this plugin.

### Built-in templates

Auto-seeded into \`Templates/\` on first install (language-matched to the UI):

| File | favorite | Output sections |
|---|---|---|
| \`Meeting.md\` | ⭐ | Summary / Decisions / Action items (concise note-style) |
| \`Interview.md\` | | Summary / Topics / Key quotes (blockquotes) |
| \`Lecture.md\` | | Summary / Key concepts / Follow-up questions |

Edit any of them freely. Toggling \`favorite: true / false\` moves the entry between the flat menu and the \`AI summary ▸\` submenu.

### Template file format

\`\`\`markdown
---
name: "Meeting"
favorite: true
prompt: |
  Summarize the transcript as meeting minutes.
  Use concise note-style fragments (Decided X, Reviewed Y).
  - summary: 3-5 markdown bullets, one per line.
  - decisions: one bullet per decision, one per line.
  - action_items: markdown checkboxes with @owner.
placeholders:
  summary: "Markdown bullet list, one item per line"
  decisions: "Markdown bullet list, one item per line"
  action_items: "Markdown checkbox list, one item per line"
---
# {{title}}

> Source: {{source}} · {{date}} · {{duration}}

## Summary
{{summary}}

## Decisions
{{decisions}}

## Action Items
{{action_items}}
\`\`\`

- **\`prompt\`** — instruction sent to Gemini. UI-language hint is auto-appended.
- **\`placeholders\`** — keys Gemini must fill, with descriptions. Gemini 2.5's structured output (JSON mode) fills them all in one call; the values are then substituted into \`{{key}}\` in the body.
- **\`favorite\`** — true → flat in the right-click menu; false → under \`AI summary ▸\` submenu.

### System placeholders (filled by the plugin)

| Token | Expansion |
|---|---|
| \`{{transcript}}\` | STT transcript body (also the AI input) |
| \`{{title}}\` | User-entered title |
| \`{{date}}\` | \`YYYY-MM-DD\` |
| \`{{datetime}}\` | \`YYYY-MM-DD HH:MM\` |
| \`{{source}}\` | \`[[wikilink]]\` to the source transcript |
| \`{{language}}\` | UI language label (e.g. \`Korean\`) |
| \`{{duration}}\` | \`HH:MM:SS\` or \`MM:SS\` |
| \`{{speakers}}\` | Comma-separated speaker list |

### Creating a new template

Command palette → **"Create new summary template"** scaffolds a starter file in \`Templates/\` with every system placeholder pre-documented as a comment, and opens it.

### Failure behavior

- **STT fails** → abort the whole flow. Summary step is skipped.
- **Summary fails only** → the STT note is preserved; the summary error is shown as a Notice. If Gemini returns invalid JSON the plugin auto-retries once.

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
