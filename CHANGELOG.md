## [Unreleased]

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

[Unreleased]: https://github.com/Moonjuun/obsidian-deepgram-stt/compare/0.2.0...HEAD
[0.2.0]: https://github.com/Moonjuun/obsidian-deepgram-stt/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/Moonjuun/obsidian-deepgram-stt/releases/tag/0.1.0
