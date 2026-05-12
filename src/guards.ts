import { Notice } from 'obsidian';
import type { DeepgramSettings } from './settings';
import type { T } from './i18n';

export type GuardResult = { ok: true } | { ok: false; kind: 'consent' | 'apiKey' };

export function checkReady(settings: DeepgramSettings): GuardResult {
	if (!settings.consentAcknowledged) {
		return { ok: false, kind: 'consent' };
	}
	if (!settings.apiKey || settings.apiKey.trim() === '') {
		return { ok: false, kind: 'apiKey' };
	}
	return { ok: true };
}

export function notifyIfBlocked(result: GuardResult, t: T): result is { ok: true } {
	if (result.ok) return true;

	const reason =
		result.kind === 'consent'
			? t(
					'데이터 전송 안내에 먼저 동의해야 합니다. 명령 팔레트 → "동의 모달 다시 보기"를 실행하세요.',
					'You must first accept the data transmission notice. Run "Reset consent" from the command palette.',
				)
			: t(
					'Deepgram API 키가 설정되지 않았습니다. 설정 탭에서 키를 입력하세요.',
					'Deepgram API key is not set. Please configure it in the settings tab.',
				);

	new Notice(reason);
	return false;
}
