import { requestUrl } from 'obsidian';

const RELEASES_LATEST_URL =
	'https://api.github.com/repos/Moonjuun/obsidian-deepgram-stt/releases/latest';

export interface LatestRelease {
	tag: string;
	htmlUrl: string;
	publishedAt: string;
}

export class UpdateCheckError extends Error {
	constructor(message: string, public readonly status?: number) {
		super(message);
		this.name = 'UpdateCheckError';
	}
}

export async function fetchLatestRelease(): Promise<LatestRelease> {
	let res;
	try {
		res = await requestUrl({
			url: RELEASES_LATEST_URL,
			method: 'GET',
			headers: { Accept: 'application/vnd.github.v3+json' },
			throw: false,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new UpdateCheckError(`network: ${msg}`);
	}

	if (res.status === 404) {
		throw new UpdateCheckError('No release found', 404);
	}
	if (res.status === 403) {
		throw new UpdateCheckError('GitHub API rate limit', 403);
	}
	if (res.status !== 200) {
		throw new UpdateCheckError(`HTTP ${res.status}`, res.status);
	}

	const data = res.json as { tag_name?: string; html_url?: string; published_at?: string };
	if (!data.tag_name) {
		throw new UpdateCheckError('malformed response');
	}

	return {
		tag: data.tag_name,
		htmlUrl: data.html_url ?? '',
		publishedAt: data.published_at ?? '',
	};
}

/**
 * Compare two semver-ish strings.
 * Returns 1 if a > b, -1 if a < b, 0 if equal.
 * Accepts optional "v" prefix.
 */
export function compareSemver(a: string, b: string): number {
	const pa = parseSemver(a);
	const pb = parseSemver(b);
	for (let i = 0; i < 3; i++) {
		const d = (pa[i] ?? 0) - (pb[i] ?? 0);
		if (d !== 0) return d > 0 ? 1 : -1;
	}
	return 0;
}

function parseSemver(s: string): number[] {
	const clean = s.replace(/^v/, '');
	return clean.split('.').map((p) => parseInt(p, 10) || 0);
}
