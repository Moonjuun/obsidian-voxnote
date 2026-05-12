# Deepgram Meeting STT

옵시디언 안에서 회의 녹음 파일을 [Deepgram](https://deepgram.com) API로 STT 변환하여 마크다운 회의록 노트로 저장하는 플러그인.

- 한국어 회의 / 화자 분리(Diarize) / 마크다운 자동 포맷
- 파일 우클릭 또는 명령 팔레트에서 한 번에 변환
- 외부 템플릿 지원 (frontmatter / 본문 자유 커스텀)

> 📌 **베타 단계** — 사내 동료 BRAT 배포 위주. 정식 Obsidian Community 등록 전 단계입니다.

---

## 설치

### 방법 1 — BRAT (권장)

1. [Obsidian BRAT](https://github.com/TfTHacker/obsidian42-brat) 플러그인 설치 + 활성화.
2. BRAT 설정 → **"Add Beta Plugin"** → 다음 URL 입력:
   ```
   https://github.com/Moonjuun/obsidian-deepgram-stt
   ```
3. **"Enable after installing the plugin"** 체크 → **Add plugin**.
4. 옵시디언 설정 → Community plugins → "Deepgram Meeting STT" 활성화.
5. 옆 톱니바퀴 → Deepgram API 키 입력 (다음 섹션 참고).

### 방법 2 — 수동

1. [Releases](https://github.com/Moonjuun/obsidian-deepgram-stt/releases) 최신 버전에서 `main.js`, `manifest.json`, `styles.css` 다운로드.
2. 본인 vault의 `.obsidian/plugins/deepgram-meeting-stt/` 폴더(없으면 생성)에 3개 파일 복사.
3. 옵시디언 재시작 → Community plugins → "Deepgram Meeting STT" 활성화.

---

## API 키 발급

1. [Deepgram 콘솔](https://console.deepgram.com)에서 회원가입.
2. **API Keys** → **Create New API Key** → 권한은 `Member` 또는 `Admin`이면 충분.
3. 생성된 `xxxxxxxxxxxx...` 형식 토큰을 복사.
4. 옵시디언 → 플러그인 설정 → **"Deepgram API 키"** 칸에 붙여넣기 → **"검증"** 버튼.

---

## 사용법

### 명령 팔레트
- `Cmd+P` (macOS) / `Ctrl+P` → **"Deepgram Meeting STT: Transcribe audio → meeting note"** 실행.
- 변환할 오디오 파일 선택 → 회의록 제목 입력 → Enter.

### 파일 우클릭
- vault 내 오디오 파일 우클릭 → **"Deepgram으로 회의록 추출"** 클릭.

### 디버그 명령 (선택)
- **"Transcribe audio file (debug — console only)"** — 노트 생성 없이 transcript 결과만 DevTools 콘솔에 출력. API 응답 점검용.

> 지원 포맷: `mp3`, `m4a`, `mp4`, `wav`, `flac`, `ogg`, `opus`, `webm`, `aac`

---

## 설정 항목

| 항목 | 설명 | 기본값 |
|---|---|---|
| Deepgram API 키 | 회의록 변환에 사용할 키 (검증 버튼 옆에 있음) | (없음) |
| 회의록 저장 폴더 | vault 내 상대 경로. 자동 생성됨 | `STT` |
| 템플릿 경로 | vault 내 마크다운 파일 경로. 비우면 내장 템플릿 | (빈 값) |
| 언어 | `ko` / `en` / `auto` (자동 감지) | `ko` |
| Deepgram 모델 | `nova-3` (최신) / `nova-2` | `nova-3` |
| 화자 분리 (Diarize) | 화자별로 분리된 transcript 생성 | `true` |
| Zero Retention | Deepgram 측 데이터 보관 비활성화 (요금제 조건) | `false` |

---

## 템플릿 토큰

설정의 **"템플릿 경로"** 칸에 vault 내 마크다운 파일을 지정하면, 그 안의 다음 토큰들이 자동 치환됩니다.

| 토큰 | 치환 결과 |
|---|---|
| `{{date}}` | `YYYY-MM-DD` (변환 실행 시각 기준) |
| `{{title}}` | 사용자 입력 제목 |
| `{{transcript}}` | diarize on이면 화자별 마크다운, off면 plain text |
| `{{speakers_transcript}}` | 항상 화자별 마크다운 |
| `{{plain_transcript}}` | 항상 plain text |
| `{{duration}}` | `5m 30s` 같은 형식 |
| `{{audio_link}}` | `[[Attachments/녹음.m4a]]` wikilink |
| `{{language}}` | `ko` / `en` / `auto` |
| `{{model}}` | `nova-3` / `nova-2` |

내장 기본 템플릿:

```markdown
---
date: {{date}}
type: meeting
tags: [meeting, stt]
duration: {{duration}}
language: {{language}}
model: {{model}}
source: {{audio_link}}
---

# {{title}}

- 녹음: {{audio_link}}
- 길이: {{duration}}
- 모델: {{model}} ({{language}})

## 회의 내용

{{transcript}}
```

---

## 비용 (참고)

Deepgram **nova-3** 기준 (2026-05 시점):

| 회의 길이 | 비용 (USD, 약) |
|---|---|
| 30분 | $0.13 |
| 1시간 | $0.26 |
| 2시간 | $0.52 |

최신 가격은 [Deepgram Pricing](https://deepgram.com/pricing) 확인.

---

## 프라이버시 / 보안

### 데이터 전송
- 이 플러그인은 오디오 파일을 **Deepgram 서버에 전송**해 STT 결과를 받아옵니다.
- 회의 참석자에게 **녹음 및 외부 API 전송에 대한 사전 동의**를 받으시는 것을 권장합니다.
- 요금제가 허용하는 경우 설정에서 **Zero Retention** 옵션을 켜 Deepgram 측 데이터 보관을 비활성화할 수 있습니다.

### API 키 보호
- API 키는 vault 내 `.obsidian/plugins/deepgram-meeting-stt/data.json`에 **평문 JSON으로 저장**됩니다 (옵시디언 플러그인 표준).
- vault를 git으로 동기화하는 경우 첫 실행 모달에서 동의 시 **`.gitignore`에 자동 보호 룰을 추가**합니다 (`.gitignore`가 있을 때만).
- 만약 vault `.gitignore`가 없거나 자동 추가가 실패했다면, 수동으로 다음 한 줄을 추가하세요:
  ```
  .obsidian/plugins/deepgram-meeting-stt/data.json
  ```
- **이미 키가 들어간 후 git에 push되었다면**: GitHub은 push 즉시 인덱싱하므로 사후 삭제로는 보장 불가. 즉시 키 폐기 후 신규 발급을 권장합니다.

---

## 개발

```bash
git clone https://github.com/Moonjuun/obsidian-deepgram-stt.git
cd obsidian-deepgram-stt
npm install
npm run dev    # esbuild watch
# 또는
npm run build  # 프로덕션 빌드
```

vault에 hot reload 연결하려면 본인 vault의 `.obsidian/plugins/deepgram-meeting-stt`를 클론한 폴더로 symlink:

```bash
ln -s "$(pwd)" /path/to/your/vault/.obsidian/plugins/deepgram-meeting-stt
```

### 릴리스

```bash
npm version patch   # 또는 minor / major / specific (예: 0.1.0)
git push --follow-tags
```

`npm version`은 `manifest.json`, `package.json`, `versions.json`을 한 번에 동기화하고 git tag를 만듭니다. tag가 push되면 GitHub Actions가 자동으로 `main.js`, `manifest.json`, `styles.css`를 첨부한 release를 생성합니다 (`.github/workflows/release.yml` 참고).

---

## License

[MIT](LICENSE) © 2026 Moonjuun
