import { describe, expect, it } from 'vitest';
import { compareSemver } from '../src/utils/semver';

describe('compareSemver', () => {
	it('returns 0 for identical versions', () => {
		expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
		expect(compareSemver('2.3.4', '2.3.4')).toBe(0);
	});

	it('returns 1 when a is newer', () => {
		expect(compareSemver('1.0.1', '1.0.0')).toBe(1);
		expect(compareSemver('1.1.0', '1.0.99')).toBe(1);
		expect(compareSemver('2.0.0', '1.99.99')).toBe(1);
	});

	it('returns -1 when a is older', () => {
		expect(compareSemver('1.0.0', '1.0.1')).toBe(-1);
		expect(compareSemver('1.0.0', '1.1.0')).toBe(-1);
		expect(compareSemver('1.99.99', '2.0.0')).toBe(-1);
	});

	it('tolerates a leading v prefix', () => {
		expect(compareSemver('v1.0.1', '1.0.0')).toBe(1);
		expect(compareSemver('1.0.0', 'v1.0.0')).toBe(0);
		expect(compareSemver('v2.0.0', 'v1.99.99')).toBe(1);
	});

	it('treats missing components as 0', () => {
		expect(compareSemver('1.0', '1.0.0')).toBe(0);
		expect(compareSemver('1', '1.0.0')).toBe(0);
		expect(compareSemver('1.0.1', '1.0')).toBe(1);
	});
});
