const INJECTION_PATTERNS = [
	/ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
	/disregard\s+(all\s+)?(previous|prior)\s+(instructions|context)/i,
	/you\s+are\s+now/i,
	/new\s+instructions:/i,
	/system:\s*/i,
	/\[INST\]/i,
	/<\/s>/i,
	/DROP\s+TABLE/i,
	/DELETE\s+FROM\s+\w+\s*;/i,
	/UPDATE\s+\w+\s+SET.*WHERE\s+1\s*=\s*1/i,
	/;\s*--/,
];

export interface InjectionCheckResult {
	isSafe: boolean;
	reason?: string;
	sanitizedInput?: string;
}

export function checkPromptInjection(input: string): InjectionCheckResult {
	for (const pattern of INJECTION_PATTERNS) {
		if (pattern.test(input)) {
			return {
				isSafe: false,
				reason: `Potential injection detected: ${pattern.source}`,
			};
		}
	}

	// Sanitize control characters - remove ASCII control characters (0-31 and 127)
	const sanitized = [...input]
		.filter((char) => {
			const code = char.charCodeAt(0);
			return code >= 32 && code !== 127;
		})
		.join('')
		.trim();

	return {
		isSafe: true,
		sanitizedInput: sanitized,
	};
}
