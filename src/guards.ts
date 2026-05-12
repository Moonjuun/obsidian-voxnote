import { Notice } from 'obsidian';
import type { DeepgramSettings } from './settings';

export type GuardResult = { ok: true } | { ok: false; reason: string };

export function checkReady(settings: DeepgramSettings): GuardResult {
	if (!settings.consentAcknowledged) {
		return { ok: false, reason: '데이터 전송 안내에 먼저 동의해야 합니다. 플러그인을 다시 시작하거나 설정 탭을 확인하세요.' };
	}
	if (!settings.apiKey || settings.apiKey.trim() === '') {
		return { ok: false, reason: 'Deepgram API 키가 설정되지 않았습니다. 설정 탭에서 키를 입력하세요.' };
	}
	return { ok: true };
}

export function notifyIfBlocked(result: GuardResult): result is { ok: true } {
	if (!result.ok) {
		new Notice(result.reason);
		return false;
	}
	return true;
}
