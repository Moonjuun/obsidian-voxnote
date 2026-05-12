import type { App } from 'obsidian';
import type { Lang } from './i18n';

const README_PATH = 'ObsiDeep/README.md';

export type ReadmeResult = 'created' | 'exists' | 'error';

export async function installReadme(app: App, lang: Lang): Promise<ReadmeResult> {
	try {
		const exists = await app.vault.adapter.exists(README_PATH);
		if (exists) return 'exists';

		const content = lang === 'ko' ? KO_README : EN_README;
		await app.vault.create(README_PATH, content);
		return 'created';
	} catch {
		return 'error';
	}
}

const KO_README = `# ObsiDeep — Deepgram Meeting STT

이 폴더는 [Deepgram Meeting STT](https://github.com/Moonjuun/obsidian-deepgram-stt) 플러그인이 자동 생성한 작업 공간입니다.

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

## 화자 이름 정리

회의록의 frontmatter \`speakers\` 항목은 기본적으로 \`화자 0\`, \`화자 1\`... 같은 익명 라벨로 채워집니다. 누구인지 알면 이름으로 바꿔두는 게 검색·추적에 좋습니다.

1. 정리하려는 회의록 노트를 엽니다.
2. 명령 팔레트(\`Cmd+P\` / \`Ctrl+P\`) → **"화자 이름 변경 (현재 노트)"** 실행.

![화자 이름 변경 명령](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img5.webp)

3. 모달이 열리면 상단에 **현재 노트 이름**이 표시되고, **변경 전 칸은 드롭다운**으로 노트에서 자동 감지된 화자 목록이 채워집니다.
   - **변경 전**: 드롭다운에서 변경할 화자 선택 (예: \`화자 0\`)
   - **변경 후**: 실제 이름 입력 (예: \`홍길동\`)
4. **치환** 클릭 → 본문의 모든 \`화자 0\`과 frontmatter \`speakers\` 배열의 라벨이 일괄로 치환됩니다.

> 화자가 여러 명이면 명령을 여러 번 실행하면 됩니다.

---

## 정확도 가이드 (오디오 품질·화자 수)

STT 정확도는 **녹음 환경의 영향을 크게 받습니다**. 좋은 회의록을 얻으려면 입력 단계에서 신경 써주세요.

### 오디오 품질

- **권장 sample rate**: 16 kHz 이상 (Deepgram은 8/16/24/32/48 kHz 지원).
- **권장 포맷**: 품질 우선이면 \`FLAC\` / \`WAV\` (Linear PCM), 파일 크기 우선이면 \`MP3\` / \`AAC\` / \`Opus\`.
- **새 녹음 환경 도입 시 5~10분 샘플로 먼저 테스트**해 인식률을 확인하는 것을 Deepgram이 권장합니다.

### 화자 수

- Deepgram diarize는 **명시적 화자 수 상한이 없음** — 공식적으로 16명 이상에서도 검증됐다고 발표 ([출처](https://deepgram.com/learn/what-is-speaker-diarization)).
- 다만 화자가 늘수록 오인식(speaker confusion) 가능성이 올라갑니다. 4명·CER 10% 기준으로 1시간 회의에서 약 6분 분량의 발언이 잘못된 화자로 매핑될 수 있습니다.
- **권장**: 정확도가 중요한 회의는 **8명 이하** + 발언이 어느 정도 연속되는 환경에서 사용.
- 격렬한 turn-taking(자주 끼어드는 토론)은 화자 분리 실패율이 높습니다.

### 회의실 녹음 체크리스트

| 항목 | 권장 |
|---|---|
| 마이크 종류 | 화자 가까이(~30cm) 또는 회의실 천장 array 마이크 |
| 화자 ↔ 마이크 거리 | 가까울수록 인식률 ↑ |
| 백색 노이즈 | 에어컨·키보드·빔프로젝터 fan 등 최소화 |
| 에코 / 반향 | 유리·벽 반사가 많은 공간은 정확도 저하 — 흡음재가 있는 공간이 유리 |
| 동시 발화 | 두 명 이상이 동시에 말하면 화자 분리 실패 가능 |
| 사전 테스트 | 새 회의실 / 녹음기 도입 시 짧은 샘플로 결과 검토 |

> 결과가 만족스럽지 않다면 같은 녹음을 [Deepgram Playground](https://playground.deepgram.com)에 올려 다른 모델(\`nova-2\` 등)과 비교해볼 수 있습니다.

---

## 보안 & 프라이버시

### Deepgram 자체 보안 (외부 API 신뢰성)

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

이 플러그인은 기본적으로 Deepgram에 \`dg-zero-retention: true\` 헤더를 전달합니다.

- **효과**: Deepgram이 변환 후 오디오·텍스트를 **즉시 폐기** (서버 측 보관 0).
- **요금제 조건**: Growth 이상 요금제에서만 즉시 적용 보장. 무료/Pay-as-you-go 요금제에서는 표준 정책 (~30일 보관)이 적용될 수 있습니다.
- **변경**: 설정 → "Zero Retention" 토글로 끄기 가능 (대시보드에서 transcript 이력 보고 싶을 때 등).

### vault 측 보호

- 이 폴더(\`ObsiDeep/\`)는 vault \`.gitignore\`에 등록되어 **git에 올라가지 않습니다**.
- API 키 파일(\`.obsidian/plugins/deepgram-meeting-stt/data.json\`)도 \`.gitignore\`로 보호.

### 권장 사항

- 회의 참석자에게 **녹음·외부 API 전송에 대한 사전 동의**를 받는 것을 권장합니다.
- 매우 민감한 회의는 **Deepgram Growth 이상 + Zero Retention** 조합, 또는 자체 호스팅 모델(예: Whisper local) 검토.

---

## 비용 (참고)

Deepgram **nova-3** 모델 기준:

| 길이 | 비용 (약, USD) |
|---|---|
| 30분 | $0.13 |
| 1시간 | $0.26 |
| 2시간 | $0.52 |

최신 가격은 [Deepgram Pricing](https://deepgram.com/pricing) 확인. 무료 가입 시 $200 크레딧으로 한참 사용 가능합니다.

---

## 더 알아보기

- 설정·언어·모델 변경: 옵시디언 설정 → Community plugins → "Deepgram Meeting STT" 톱니바퀴.
- UI 언어 변경 (한국어/English): 설정 탭 맨 위 **"UI 언어"** 드롭다운.
- 동의 모달 다시 보기: 명령 팔레트 → **"동의 모달 다시 보기"**.
- 이슈/제안: [GitHub Issues](https://github.com/Moonjuun/obsidian-deepgram-stt/issues)
`;

const EN_README = `# ObsiDeep — Deepgram Meeting STT

This folder is the auto-created workspace for the [Deepgram Meeting STT](https://github.com/Moonjuun/obsidian-deepgram-stt) plugin.

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

## Renaming speakers

The \`speakers\` frontmatter starts with anonymous labels (\`화자 0\`, \`화자 1\`, ...). If you know who's who, replacing those labels with real names makes notes searchable.

1. Open the meeting note you want to edit.
2. Command palette (\`Cmd+P\` / \`Ctrl+P\`) → **"Rename speaker (current note)"**.

![Rename speaker command](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img5.webp)

3. The modal shows the **current note name** at the top, and the **From field is a dropdown** populated with speakers auto-detected from the note.
   - **From**: pick the speaker to rename from the dropdown (e.g. \`화자 0\`)
   - **To**: type the real name (e.g. \`홍길동\`)
4. Click **Replace** — every occurrence in the body and in the \`speakers\` frontmatter array is renamed at once.

> Repeat the command for each speaker.

---

## Accuracy guide (audio quality & speaker count)

STT accuracy is **heavily influenced by the recording environment**. A few input-side tweaks go a long way.

### Audio quality

- **Recommended sample rate**: 16 kHz or higher (Deepgram supports 8 / 16 / 24 / 32 / 48 kHz).
- **Recommended formats**: \`FLAC\` / \`WAV\` (Linear PCM) for fidelity, \`MP3\` / \`AAC\` / \`Opus\` for size.
- Deepgram recommends **testing with a short 5–10 min sample** when adopting a new recording setup, before committing to longer meetings.

### Number of speakers

- Deepgram diarize has **no hard cap on speaker count** — they publicly report validated accuracy at 16+ speakers ([source](https://deepgram.com/learn/what-is-speaker-diarization)).
- That said, more speakers means more chances of speaker-confusion. At 4 speakers with 10% CER, roughly 6 minutes per hour of audio could be attributed to the wrong speaker.
- **Practical recommendation**: for accuracy-sensitive meetings, keep it to **≤ 8 speakers** with reasonably long contiguous turns.
- Fast turn-taking debates have a notably higher diarization error rate than meetings with longer speaker turns.

### Meeting-room recording checklist

| Item | Recommendation |
|---|---|
| Microphone | Close-talking (~30cm) or ceiling array mic |
| Speaker ↔ mic distance | Closer is always better |
| White noise | Minimize AC, keyboards, projector fans |
| Echo / reverb | Glass-and-concrete rooms hurt accuracy — prefer rooms with soft absorbing surfaces |
| Overlapping speech | Two or more speakers talking at once breaks diarization |
| Pilot test | Run a short sample whenever you change rooms or recorders |

> If a recording doesn't transcribe well, drop the same file into the [Deepgram Playground](https://playground.deepgram.com) and compare with \`nova-2\` or other models.

---

## Security & privacy

### Deepgram's security posture

Deepgram complies with the following standards:

| Standard | Coverage |
|---|---|
| **GDPR** | EU/UK general data protection regulation |
| **SOC 2 Type II** | Audited (security, availability, confidentiality) |
| **HIPAA** | Healthcare-compatible (BAA available) |
| **CCPA** | California consumer privacy compliance |
| **DPA** | Data Processing Agreement available for business |

Details: [Deepgram Trust Center](https://trust.deepgram.com) · [Privacy Policy](https://deepgram.com/privacy)

### Zero Retention (default **ON**)

This plugin sends \`dg-zero-retention: true\` to Deepgram by default.

- **Effect**: Deepgram discards audio and transcripts **immediately** after processing (no server-side retention).
- **Plan requirements**: Immediate effect is guaranteed on Growth or higher plans. On the free / Pay-as-you-go tier, standard retention (~30 days) may still apply.
- **Toggle off**: Settings → "Zero Retention" if you want transcripts visible in the Deepgram dashboard for debugging.

### Vault-side protection

- This \`ObsiDeep/\` folder is added to your vault's \`.gitignore\`, so its contents never enter vault git sync.
- Your API key (\`.obsidian/plugins/deepgram-meeting-stt/data.json\`) is excluded from git the same way.

### Recommendations

- Always obtain **prior consent** from meeting participants before recording and transmitting audio to an external API.
- For highly sensitive material: combine **Deepgram Growth+** with **Zero Retention**, or evaluate self-hosted alternatives (e.g. local Whisper).

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

- Settings (language, model, etc.): Obsidian Settings → Community plugins → "Deepgram Meeting STT" gear icon.
- Switch UI language (한국어/English): top of the settings tab → **"UI language"** dropdown.
- Re-show the consent modal: command palette → **"Reset consent"**.
- Issues / suggestions: [GitHub Issues](https://github.com/Moonjuun/obsidian-deepgram-stt/issues)
`;
