/**
 * Compare two semver-ish strings.
 * Returns 1 if a > b, -1 if a < b, 0 if equal.
 * Tolerates an optional "v" prefix and missing minor/patch parts
 * (which are treated as 0).
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
