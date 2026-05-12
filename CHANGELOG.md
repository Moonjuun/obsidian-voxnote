## [Unreleased]

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

[Unreleased]: https://github.com/Moonjuun/obsidian-deepgram-stt/compare/0.1.0...HEAD
[0.1.0]: https://github.com/Moonjuun/obsidian-deepgram-stt/releases/tag/0.1.0
