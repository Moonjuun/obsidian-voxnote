# Deepgram Meeting STT

An Obsidian plugin that turns meeting recordings into Markdown notes — **speech-to-text via [Deepgram](https://deepgram.com)** with per-speaker timestamps, plus an **optional AI summary** step via Google Gemini that drops a structured digest next to the transcript.

> 🇰🇷 한국어 가이드: [README-ko.md](README-ko.md)

---

## What you get

- **Audio → transcript**: drop an audio file, right-click, pick a title — get back a Markdown note with per-speaker `[HH:MM:SS]` timestamps.
- **Audio → transcript → AI summary** (optional): in the same right-click, also produce a structured summary note (action items, decisions, key quotes — whatever the template says) backlinked to the transcript.
- **File-based summary templates** under `ObsiDeep/Templates/`. Each `.md` declares its own prompt and output skeleton with `{{placeholders}}`; you edit them like any other note. Favorites surface as flat menu items; the rest sit in an `AI 요약 ▸` submenu. Three starters are seeded on first run (`Meeting`, `Interview`, `Lecture`).
- **Workspace stays clean**: `ObsiDeep/` (Audio · STT · Templates · AI-Summaries) is auto-created at the vault root, and `.gitignore` rules are added so recordings and your API keys never enter vault git sync.
- **Bilingual UI** — Korean / English / auto-follow Obsidian locale.
- **Zero Retention by default** for Deepgram; AI summary is fully optional and gated on having a Gemini key set.
- **Mobile compatible** — works on Obsidian for iOS / Android.

> The plugin keeps working as a pure STT tool. If you don't set a Gemini key, no AI menus appear and nothing leaves your machine except the audio you choose to transcribe.

## Install

1. **Settings → Community plugins → Browse**
2. Search for **"Deepgram Meeting STT"**
3. Install + Enable

## Setup

On first enable, a one-time consent modal explains what's sent to Deepgram and auto-creates an `ObsiDeep/` workspace at the vault root — including `Templates/` (seeded with three starter summary templates) and `AI-Summaries/`. It also writes `.gitignore` rules so recordings and your API keys stay out of vault git sync.

### 1. Deepgram API key (required for STT)

1. Sign up at [Deepgram Console](https://console.deepgram.com) — free tier includes a **$200 credit** (~770 hours of `nova-3`).

   ![Deepgram API Keys page](img/img1.webp)

2. **API Keys → Create New API Key** (any name, `Member` permission is enough).

   ![Create API Key dialog](img/img2.webp)

3. Paste into **Settings → Deepgram Meeting STT → "Deepgram API key"** → click **Validate**.

   ![Plugin settings tab](img/img3.webp)

### 2. Gemini API key (optional — only for AI summary)

Leave this blank if you only want STT. To enable AI summary:

1. Open [Google AI Studio → API keys](https://aistudio.google.com/apikey) and create one.
2. Paste into **Settings → Deepgram Meeting STT → "Gemini API key"**.
3. Pick a model — `gemini-2.5-flash` (default, fast & cheap) or `gemini-2.5-pro` (higher quality).

The AI menus stay hidden until a key is set.

## Usage

### Transcribe only

1. Place an audio file (`mp3`, `m4a`, `mp4`, `wav`, `flac`, `ogg`, `opus`, `webm`, `aac`) into `ObsiDeep/Audio/`.
2. **Right-click** the file → **`ObsiDeep ▸ STT만 추출`** (Transcribe only).
3. Enter a title → Enter.
4. After ~1–2 minutes the transcribed note appears in `ObsiDeep/STT/` and opens automatically.

![Right-click → ObsiDeep submenu](img/img4.webp)

The same flow is available from the command palette (`Cmd+P` / `Ctrl+P`) → **"Transcribe audio → meeting note"**.

> If you copied the file via Finder/Explorer and it doesn't appear in the sidebar right away, run `Cmd+P` → **"Reload app without saving"** first.

### Transcribe + summarize in one go (AI summary set up)

1. Right-click an audio file → **`ObsiDeep ▸ ⭐ STT + 요약: Meeting`** (favorite templates surface flat; others live under `AI 요약 ▸`).
2. Enter a title.
3. After STT finishes, the transcript is fed to Gemini with the template's prompt.
4. Two notes appear: the transcript in `ObsiDeep/STT/`, the summary in `ObsiDeep/AI-Summaries/{title} (요약).md` with a `source: "[[...]]"` backlink to the transcript.

If STT fails, nothing else runs. If only the summary step fails, the transcript is preserved and you get a notice.

### Re-summarize an existing note

Right-click any markdown note → **`ObsiDeep ▸ AI 요약: <template>`** — same flow, but the note's body is the input transcript. Useful for trying a different template, or summarizing notes that weren't produced by this plugin.

### Output examples

Transcript (`ObsiDeep/STT/...`):

```markdown
---
date: 2026-05-13
type: meeting
tags: [meeting, stt]
duration: 28m 41s
language: ko
source: [[ObsiDeep/Audio/standup.m4a]]
speakers: ["Speaker 1", "Speaker 2"]
---

# Stand-up 2026-05-13

**Speaker 1** [00:00:01 - 00:00:08]
Good morning, let's start with the status updates.

**Speaker 2** [00:00:09 - 00:00:14]
Sure, I'll go first.
```

Summary (`ObsiDeep/AI-Summaries/...`, using the `Meeting` template):

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
- Status updates from each team
- ...

## Decisions
- ...

## Action Items
- [ ] @Speaker1 — follow up with ...
```

### Customize a template

Edit any `.md` in `ObsiDeep/Templates/`:

```markdown
---
name: "Meeting"
favorite: true        # show flat in the right-click menu
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

The `placeholders` you declare here become the JSON schema Gemini is forced to fill — no free-form text drift. Add as many as you want.

To scaffold a new template with every system placeholder documented, run the command palette → **"새 요약 템플릿 만들기 (Create new summary template)"**.

### Rename speakers

Speakers are labelled `Speaker 1`, `Speaker 2` by default. To replace with real names:

1. Open the meeting note.
2. Command palette → **"Rename speaker (current note)"**.

   ![Rename speaker command](img/img5.webp)

3. Pick the speaker from the dropdown (auto-detected from the note's frontmatter).
4. Type the real name → click **Replace**.

Every occurrence in both the body and the `speakers` frontmatter array is rewritten.

## Settings

| Setting | Description | Default |
|---|---|---|
| UI language | Plugin UI (Korean / English / auto-follow Obsidian) | `auto` |
| Deepgram API key | Required for STT. Stored locally in `data.json` | (none) |
| Note folder | Vault-relative STT output path | `ObsiDeep/STT` |
| Template path | Optional custom STT note template | (built-in template) |
| Audio language | Primary recording language | `ko` |
| Deepgram model | `nova-3` (latest) / `nova-2` (stable) | `nova-3` |
| Speaker diarization | Produce per-speaker transcripts | `true` |
| Zero Retention | Ask Deepgram to discard data after processing | `true` |
| Gemini API key | Optional. Enables the AI summary menus | (none) |
| Gemini model | `gemini-2.5-flash` (fast/cheap) / `gemini-2.5-pro` (higher quality) | `gemini-2.5-flash` |
| Templates folder | Where summary templates live | `ObsiDeep/Templates` |
| Summaries folder | Where AI summary notes are written | `ObsiDeep/AI-Summaries` |

See [FEATURES.md](FEATURES.md) for the full placeholder reference, AI summary deep-dive, accuracy guide (audio quality, speaker count, recording-room checklist), and mobile usage notes.

## Security & Privacy

- Audio is sent to Deepgram over HTTPS for processing. Transcript text is sent to Gemini *only* if you trigger an AI summary.
- Your API keys are stored locally as plain JSON in `.obsidian/plugins/deepgram-meeting-stt/data.json` (Obsidian plugin standard). The plugin auto-adds this path to your vault's `.gitignore`.
- The `ObsiDeep/` folder is also auto-added to `.gitignore` so recordings, transcripts, and summaries never enter vault git sync.
- Deepgram complies with **GDPR / SOC 2 Type II / HIPAA (with BAA) / CCPA**. See [Deepgram Trust Center](https://trust.deepgram.com) and [Privacy Policy](https://deepgram.com/privacy).
- **Zero Retention** is on by default for Deepgram. Guaranteed immediate effect on Growth or higher Deepgram plans; free / Pay-as-you-go tier may still retain data per standard policy (~30 days).
- Gemini API usage is governed by Google's [Gemini API Terms](https://ai.google.dev/gemini-api/terms) and [Privacy Policy](https://policies.google.com/privacy). Free-tier requests may be used to improve Google's models — use the paid tier if that's a concern.
- Please obtain consent from meeting participants before recording and transmitting audio to a third-party API.

## Cost

Approximate cost with `nova-3`:

| Length | Deepgram | Gemini (2.5-flash, summary) | Total |
|---|---|---|---|
| 30 min | $0.13 | ~$0.005 | ~$0.14 |
| 1 hour | $0.26 | ~$0.01 | ~$0.27 |
| 2 hours | $0.52 | ~$0.02 | ~$0.54 |

The free $200 Deepgram credit + Gemini's free tier cover many hours of typical use. See [Deepgram Pricing](https://deepgram.com/pricing) and [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing) for current rates.

## License

[MIT](LICENSE) © 2026 Moonjuun
