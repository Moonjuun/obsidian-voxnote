# Deepgram Meeting STT

옵시디언 안에서 회의 녹음 파일을 [Deepgram](https://deepgram.com) API로 STT 변환하여 마크다운 회의록 노트로 저장하는 플러그인.

- 한국어 회의 / 화자 분리(Diarize) / 마크다운 자동 포맷
- 파일 우클릭 또는 명령 팔레트에서 한 번에 변환
- 외부 템플릿 지원 (frontmatter / 본문 자유 커스텀)

> 🇺🇸 English: [README.md](README.md)

---

## 설치

### 방법 1 — Obsidian Community Plugins (권장)

1. 옵시디언 설정 → Community plugins → Browse
2. **"Deepgram Meeting STT"** 검색
3. Install + Enable

### 방법 2 — BRAT (베타)

1. [Obsidian BRAT](https://github.com/TfTHacker/obsidian42-brat) 플러그인 설치 + 활성화.
2. BRAT 설정 → **"Add Beta Plugin"** → 다음 URL 입력:
   ```
   https://github.com/Moonjuun/obsidian-deepgram-stt
   ```
3. **"Enable after installing the plugin"** 체크 → **Add plugin**.
4. 옵시디언 설정 → Community plugins → "Deepgram Meeting STT" 활성화.

### 방법 3 — 수동

1. [Releases](https://github.com/Moonjuun/obsidian-deepgram-stt/releases) 최신 버전에서 `main.js`, `manifest.json`, `styles.css` 다운로드.
2. 본인 vault의 `.obsidian/plugins/deepgram-meeting-stt/` 폴더(없으면 생성)에 3개 파일 복사.
3. 옵시디언 재시작 → Community plugins → "Deepgram Meeting STT" 활성화.

---

## 셋업

플러그인을 처음 활성화하면 동의 모달이 뜨면서 Deepgram에 무엇이 전송되는지 안내합니다. 동의 시 vault 루트에 `ObsiDeep/` 작업 공간이 자동 생성되고, `.gitignore`에 녹음·API 키 보호 룰이 추가됩니다.

그 다음 Deepgram API 키 발급:

1. [Deepgram 콘솔](https://console.deepgram.com)에 가입 — 무료 **$200 크레딧** (nova-3 기준 약 770시간 분량).

![Deepgram API Keys 페이지](img/img1.webp)

2. **API Keys → Create New API Key** (이름 자유, 권한은 `Member` 이상).

![API 키 생성 화면](img/img2.webp)

3. 옵시디언 → 플러그인 설정 → **"Deepgram API 키"** 칸에 붙여넣기 → **"검증"** 클릭.

![플러그인 설정 탭](img/img3.webp)

---

## 사용법

### 0. 회의 녹음 파일을 vault에 넣기

플러그인 첫 실행 시 동의 모달에서 동의하면 **vault 루트에 `ObsiDeep/` 폴더가 자동 생성**됩니다:

```
ObsiDeep/              ← 통째로 .gitignore 됨 (git sync 시 외부 유출 차단)
  ├─ Audio/            ← 회의 녹음 파일 (직접 넣기)
  └─ STT/              ← 변환된 회의록 노트 (자동 저장)
```

녹음 파일을 `ObsiDeep/Audio/`에 넣는 방법:
- **드래그앤드롭**: Finder에서 옵시디언 창의 `ObsiDeep/Audio/`로 드래그
- **Finder 직접 복사**: vault 폴더의 `ObsiDeep/Audio/` 안에 파일 복사

> 💡 Finder에서 직접 복사한 경우 옵시디언 사이드바에 즉시 안 보일 수 있습니다. `Cmd+P` (Windows: `Ctrl+P`) → **"저장하지 않고 앱 새로고침"** 실행 후 다시 확인하세요.

> 다른 폴더(`Attachments/`, `Meetings/` 등)에 두어도 변환은 동작하지만, git 보호를 받으려면 본인이 별도로 `.gitignore` 처리해야 합니다.

### 1. 변환 실행

**명령 팔레트**:
- `Cmd+P` (macOS) / `Ctrl+P` → **"Deepgram Meeting STT: Transcribe audio → meeting note"** 실행
- 변환할 오디오 파일 선택 → 회의록 제목 입력 → Enter

**파일 우클릭**:
- 옵시디언 좌측 사이드바에서 오디오 파일 우클릭 → **"Transcribe with Deepgram"** (한국어 UI에서는 **"Deepgram으로 회의록 추출"**)

![파일 우클릭 → Transcribe with Deepgram](img/img4.webp)

**디버그 명령 (선택)**:
- **"Transcribe audio file (debug — console only)"** — 노트 생성 없이 transcript 결과만 DevTools 콘솔에 출력. API 응답 점검용.
- **"동의 모달 다시 보기 (consent reset)"** — 첫 실행 동의 모달을 다시 띄움. `ObsiDeep/` 폴더가 삭제됐거나 처음 안내를 다시 보고 싶을 때 유용.

> 지원 포맷: `mp3`, `m4a`, `mp4`, `wav`, `flac`, `ogg`, `opus`, `webm`, `aac`

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

기능별 상세 가이드(정확도 팁, 템플릿 토큰, 모바일 사용, 업데이트 확인 등)는 [**FEATURES.md**](FEATURES.md)에 모았습니다.

---

## 설정 항목

| 항목 | 설명 | 기본값 |
|---|---|---|
| UI 언어 | 플러그인 UI 언어 (한국어/영어/자동) | `auto` |
| Deepgram API 키 | 회의록 변환에 사용할 키 | (없음) |
| 회의록 저장 폴더 | vault 내 상대 경로 | `ObsiDeep/STT` |
| 템플릿 경로 | vault 내 마크다운 파일 경로 (비우면 내장 템플릿) | (빈 값) |
| 회의 언어 | `ko` / `en` / `auto` (자동 감지) | `ko` |
| Deepgram 모델 | `nova-3` (최신) / `nova-2` | `nova-3` |
| 화자 분리 (Diarize) | 화자별로 분리된 transcript 생성 | `true` |
| Zero Retention | Deepgram 측 데이터 보관 비활성화 (요금제 조건) | `true` |

---

## 비용 (참고)

Deepgram **nova-3** 기준:

| 회의 길이 | 비용 (USD, 약) |
|---|---|
| 30분 | $0.13 |
| 1시간 | $0.26 |
| 2시간 | $0.52 |

최신 가격은 [Deepgram Pricing](https://deepgram.com/pricing) 확인.

---

## 프라이버시 / 보안

### Deepgram 자체 보안

Deepgram은 다음 보안·규제 표준을 준수합니다:

| 표준 | 내용 |
|---|---|
| **GDPR** | EU/UK 일반 개인정보보호 규정 준수 |
| **SOC 2 Type II** | 외부 감사 완료 (보안·가용성·기밀성) |
| **HIPAA** | 의료 정보 처리 호환 가능 (별도 BAA 필요) |
| **CCPA** | 캘리포니아 소비자 개인정보 보호법 대응 |

상세: [Deepgram Trust Center](https://trust.deepgram.com) · [Privacy Policy](https://deepgram.com/privacy)

### Zero Retention (기본 ON)

플러그인은 기본적으로 `dg-zero-retention: true` 헤더를 Deepgram에 전달합니다. Growth 이상 요금제에서 즉시 적용, 무료/PAYG에서는 표준 정책(~30일 보관)이 적용될 수 있습니다.

### API 키 + 회의 녹음 자동 보호

- API 키는 vault 내 `.obsidian/plugins/deepgram-meeting-stt/data.json`에 **평문 JSON으로 저장**됩니다.
- 첫 실행 모달에서 동의 시 vault `.gitignore`에 자동 보호 룰을 추가합니다.
- 회의 참석자에게 **녹음 및 외부 API 전송에 대한 사전 동의**를 받으시는 것을 권장합니다.

---

## License

[MIT](LICENSE) © 2026 Moonjuun
