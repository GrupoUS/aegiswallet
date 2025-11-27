/**
 * Sanitizes a string input to prevent XSS and other injection attacks.
 * Uses regex to strip dangerous HTML tags and attributes.
 * Note: This is a basic implementation. For production with rich text, use DOMPurify.
 */
export function sanitizeInput(input: string): string {
	if (typeof input !== 'string') {
		return input;
	}

	// Basic HTML tag stripping
	let sanitized = input.replace(/<[^>]*>?/gm, '');

	// Trim whitespace
	sanitized = sanitized.trim();

	return sanitized;
}

/**
 * Sanitizes an object by recursively sanitizing all string properties.
 */
export function sanitizeObject<T>(obj: T): T {
	if (typeof obj !== 'object' || obj === null) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => sanitizeObject(item)) as unknown as T;
	}

	const sanitizedObj = { ...obj } as Record<string, unknown>;

	for (const key in sanitizedObj) {
		if (Object.hasOwn(sanitizedObj, key)) {
			const value = sanitizedObj[key];
			if (typeof value === 'string') {
				sanitizedObj[key] = sanitizeInput(value);
			} else if (typeof value === 'object' && value !== null) {
				sanitizedObj[key] = sanitizeObject(value);
			}
		}
	}

	return sanitizedObj as T;
}
