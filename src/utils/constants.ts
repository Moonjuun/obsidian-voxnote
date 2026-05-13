/**
 * Centralized timing constants used across the plugin.
 * Numbers are in milliseconds.
 */

/** Default Notice timeouts grouped by context. */
export const NoticeDuration = {
	/** Informational success, dismissed quickly. */
	Short: 6000,
	/** Notes about a successful long-running action (e.g. note created). */
	Medium: 8000,
	/** Multi-line notices with context the user should read. */
	Long: 10000,
	/** Errors / blocking messages — the user needs longer to read. */
	Error: 12000,
} as const;
