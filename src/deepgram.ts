import { requestUrl } from 'obsidian';

export interface ValidationResult {
	ok: boolean;
	message: string;
}

export async function validateApiKey(apiKey: string): Promise<ValidationResult> {
	if (!apiKey || apiKey.trim() === '') {
		return { ok: false, message: 'API 키가 비어있습니다' };
	}

	try {
		const res = await requestUrl({
			url: 'https://api.deepgram.com/v1/projects',
			method: 'GET',
			headers: { Authorization: `Token ${apiKey.trim()}` },
			throw: false,
		});

		if (res.status === 200) {
			return { ok: true, message: '✓ API 키 유효' };
		}
		if (res.status === 401) {
			return { ok: false, message: 'API 키가 유효하지 않습니다 (401)' };
		}
		return { ok: false, message: `예상치 못한 응답: HTTP ${res.status}` };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return { ok: false, message: `네트워크 오류: ${msg}` };
	}
}
