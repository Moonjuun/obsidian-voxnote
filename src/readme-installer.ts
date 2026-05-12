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

## 사용 흐름

1. **녹음 파일을 \`Audio/\`에 넣기**
   - Finder에서 드래그앤드롭하거나, 옵시디언 창으로 직접 끌어다 놓기.

2. **변환 실행** (둘 중 하나)
   - 파일을 좌측 사이드바에서 **우클릭** → "Deepgram으로 회의록 추출"
   - 명령 팔레트(\`Cmd+P\`) → "Transcribe audio → meeting note"

3. **제목 입력 → Enter** → 약 1~2분 후 \`STT/\` 폴더에 회의록 \`.md\` 파일이 자동 생성·열림.

## 보안

- 이 폴더(\`ObsiDeep/\`)는 vault \`.gitignore\`에 등록되어 git에 올라가지 않습니다.
- API 키(\`data.json\`)도 마찬가지로 git에서 제외됩니다.
- 회의 참석자에게 녹음·외부 API 전송에 대한 사전 동의를 받는 것을 권장합니다.

## 비용 (참고)

Deepgram nova-3 모델 기준:

| 길이 | 비용 (약) |
|---|---|
| 30분 | $0.13 |
| 1시간 | $0.26 |
| 2시간 | $0.52 |

최신 가격은 [Deepgram Pricing](https://deepgram.com/pricing) 확인.

## 더 알아보기

- 플러그인 설정·언어·모델 변경: 옵시디언 설정 → Community plugins → "Deepgram Meeting STT" 톱니바퀴
- 동의 모달 다시 보기: 명령 팔레트 → "동의 모달 다시 보기 (consent reset)"
- 이슈/제안: [GitHub Issues](https://github.com/Moonjuun/obsidian-deepgram-stt/issues)
`;

const EN_README = `# ObsiDeep — Deepgram Meeting STT

This folder is the auto-created workspace for the [Deepgram Meeting STT](https://github.com/Moonjuun/obsidian-deepgram-stt) plugin.

## Folder layout

- \`Audio/\` — drop your meeting recordings here.
- \`STT/\` — transcribed meeting notes land here automatically.

## Workflow

1. **Put a recording into \`Audio/\`**
   - Drag from Finder, or drop directly into the Obsidian window.

2. **Run transcription** (either)
   - **Right-click** the file in the left sidebar → "Deepgram으로 회의록 추출" (label varies by language)
   - Command palette (\`Cmd+P\`) → "Transcribe audio → meeting note"

3. **Type a title → Enter** → after ~1–2 min a \`.md\` note appears in \`STT/\` and is opened automatically.

## Security

- This folder (\`ObsiDeep/\`) is added to your vault's \`.gitignore\`, so its contents stay out of any vault git sync.
- Your API key (\`data.json\`) is excluded from git the same way.
- Please obtain prior consent from meeting participants for recording + transmitting audio to an external API.

## Cost (reference)

Using Deepgram nova-3:

| Length | Cost (approx.) |
|---|---|
| 30 min | $0.13 |
| 1 hour | $0.26 |
| 2 hours | $0.52 |

See [Deepgram Pricing](https://deepgram.com/pricing) for current rates.

## Learn more

- Plugin settings (language, model, etc.): Obsidian Settings → Community plugins → "Deepgram Meeting STT" gear icon.
- Re-show the consent modal: command palette → "Reset consent".
- Issues / suggestions: [GitHub Issues](https://github.com/Moonjuun/obsidian-deepgram-stt/issues)
`;
