import type { T } from './i18n';
import { DeepgramApiError } from '../deepgram';

/**
 * Convert a DeepgramApiError into a user-facing notice message localized
 * by the provided translator. Branches on HTTP status so the user gets
 * a hint about what to do next (re-validate the key, wait, etc).
 */
export function friendlyMessage(err: DeepgramApiError, t: T): string {
	switch (err.status) {
		case 401:
			return t(
				'⚠ API 키 인증 실패\n설정 → ObsiDeep에서 키를 다시 확인하세요.',
				'⚠ API key auth failed\nCheck Settings → ObsiDeep and re-validate the key.',
			);
		case 413:
			return t(
				'⚠ 파일이 너무 큼\nDeepgram sync API 한도를 초과했습니다. 더 짧은 녹음으로 시도하세요.',
				'⚠ File too large\nExceeds the Deepgram sync limit. Try a shorter recording.',
			);
		case 429:
			return t(
				'⚠ 요청 한도 초과 (429)\n자동 1회 재시도 후에도 실패. 1~2분 후 다시 시도하세요.',
				'⚠ Rate limit exceeded (429)\nFailed after auto-retry. Try again in 1–2 minutes.',
			);
		default:
			if (err.status && err.status >= 500) {
				return t(
					`⚠ Deepgram 서버 오류 (HTTP ${err.status})\n잠시 후 다시 시도하세요.`,
					`⚠ Deepgram server error (HTTP ${err.status})\nPlease try again later.`,
				);
			}
			if (err.status === undefined) {
				return t(
					`⚠ 네트워크 오류\n인터넷 연결을 확인해주세요. (${err.message})`,
					`⚠ Network error\nCheck your internet connection. (${err.message})`,
				);
			}
			return t(`⚠ Deepgram 오류: ${err.message}`, `⚠ Deepgram error: ${err.message}`);
	}
}
