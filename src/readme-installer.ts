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

2. **변환 실행** — 옵시디언 좌측 사이드바에서 그 오디오 파일을 **우클릭 → "Transcribe with Deepgram"** (한국어 UI에서는 "Deepgram으로 회의록 추출")

![파일 우클릭 → Transcribe with Deepgram](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img4.webp)

3. **제목 입력 → Enter** → 약 1~2분 후 \`STT/\` 폴더에 \`.md\` 회의록이 자동 생성·열림.

> 명령 팔레트(\`Cmd+P\` / \`Ctrl+P\`)에서 "Transcribe audio → meeting note"로도 동일하게 실행할 수 있습니다.

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

2. **Run transcription** — in Obsidian's left sidebar, **right-click** the audio file → **"Transcribe with Deepgram"** (label is localized; "Deepgram으로 회의록 추출" in Korean UI).

![Right-click → Transcribe with Deepgram](https://raw.githubusercontent.com/Moonjuun/obsidian-deepgram-stt/main/img/img4.webp)

3. **Enter a title → press Enter** → after ~1–2 min a \`.md\` note appears in \`STT/\` and opens automatically.

> The command palette (\`Cmd+P\` / \`Ctrl+P\`) → "Transcribe audio → meeting note" runs the same flow.

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
