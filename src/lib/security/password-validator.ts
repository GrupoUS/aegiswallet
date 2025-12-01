/**
 * Password Security Validator
 * Enforces strong password policies for Brazilian financial application
 *
 * Requirements based on NIST SP 800-63B and BCB security guidelines
 */

export interface PasswordValidationResult {
	isValid: boolean;
	score: number; // 0-100 password strength score
	errors: string[];
	warnings: string[];
	suggestions: string[];
}

export interface PasswordPolicyConfig {
	minLength: number;
	maxLength: number;
	requireUppercase: boolean;
	requireLowercase: boolean;
	requireNumbers: boolean;
	requireSpecialChars: boolean;
	preventCommonPasswords: boolean;
	preventPersonalInfo: boolean;
	minStrengthScore: number;
}

/**
 * Default password policy configuration for financial applications
 */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicyConfig = {
	maxLength: 128,
	minLength: 8,
	minStrengthScore: 60,
	preventCommonPasswords: true,
	preventPersonalInfo: true,
	requireLowercase: true,
	requireNumbers: true,
	requireSpecialChars: true,
	requireUppercase: true, // Minimum acceptable strength score
};

/**
 * List of common passwords that should be rejected
 * Based on the 10,000 most common passwords list
 */
const COMMON_PASSWORDS = new Set([
	'password',
	'123456',
	'password123',
	'admin',
	'letmein',
	'welcome',
	'monkey',
	'1234567890',
	'qwerty',
	'abc123',
	'Password1',
	'123123',
	'111111',
	'iloveyou',
	'123123123',
	'password1',
	'12345678',
	'sunshine',
	'princess',
	'admin123',
	'welcome1',
	'monkey123',
	'password2',
	'123456789',
	'dragon',
	'master',
	'hello',
	'freedom',
	'whatever',
	'qazwsx',
	'trustno1',
	'123qwe',
	'1q2w3e4r',
	'zxcvbnm',
	'123abc',
	'password!',
	'football',
	// Additional common passwords in Portuguese/Brazil
	'senha',
	'12345678',
	'senha123',
	'123mudar',
	'brasil',
	'cidade',
	'123456',
	'12345',
	'senha1',
	'administrador',
]);

/**
 * Character sets for password complexity validation
 */
const CHARACTER_SETS = {
	uppercase: /[A-Z]/,
	lowercase: /[a-z]/,
	numbers: /[0-9]/,
	special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/,
	// Additional special characters commonly used in Brazil
	brazilian: /[áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/,
};

/**
 * Check if password contains personal information
 */
function containsPersonalInfo(password: string, email?: string, name?: string): boolean {
	if (!(email || name)) {
		return false;
	}

	const lowerPassword = password.toLowerCase();

	// Check email components
	if (email) {
		const emailParts = email.toLowerCase().split('@');
		const emailLocal = emailParts[0];
		const emailDomain = emailParts[1];

		// Remove common separators and check
		const cleanEmailLocal = emailLocal.replace(/[._-]/g, '');
		if (lowerPassword.includes(cleanEmailLocal)) {
			return true;
		}
		if (emailDomain && lowerPassword.includes(emailDomain.split('.')[0])) {
			return true;
		}
	}

	// Check name components
	if (name) {
		const nameParts = name.toLowerCase().split(/[\s._-]+/);
		for (const part of nameParts) {
			if (part.length >= 3 && lowerPassword.includes(part)) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Calculate password strength score (0-100)
 */
function calculatePasswordStrength(password: string): number {
	let score = 0;

	// Length component (up to 40 points)
	if (password.length >= 8) {
		score += 20;
	}
	if (password.length >= 12) {
		score += 10;
	}
	if (password.length >= 16) {
		score += 10;
	}

	// Character variety (up to 40 points)
	if (CHARACTER_SETS.lowercase.test(password)) {
		score += 10;
	}
	if (CHARACTER_SETS.uppercase.test(password)) {
		score += 10;
	}
	if (CHARACTER_SETS.numbers.test(password)) {
		score += 10;
	}
	if (CHARACTER_SETS.special.test(password)) {
		score += 10;
	}

	// Pattern variety (up to 20 points)
	const hasRepeatingChars = /(.)\1{2,}/.test(password);
	const hasSequentialChars =
		/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(
			password,
		);
	const hasKeyboardPattern = /(qwerty|asdf|zxcv|1234|abcd)/i.test(password);

	if (!hasRepeatingChars) {
		score += 7;
	}
	if (!hasSequentialChars) {
		score += 7;
	}
	if (!hasKeyboardPattern) {
		score += 6;
	}

	return Math.min(score, 100);
}

/**
 * Validate password against security policy
 */
export function validatePassword(
	password: string,
	config: PasswordPolicyConfig = DEFAULT_PASSWORD_POLICY,
	context?: { email?: string; name?: string },
): PasswordValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const suggestions: string[] = [];

	// Length validation
	if (password.length < config.minLength) {
		errors.push(`Password must be at least ${config.minLength} characters long`);
	}

	if (password.length > config.maxLength) {
		errors.push(`Password must be no more than ${config.maxLength} characters long`);
	}

	// Character complexity validation
	if (config.requireUppercase && !CHARACTER_SETS.uppercase.test(password)) {
		errors.push('Password must contain at least one uppercase letter');
	}

	if (config.requireLowercase && !CHARACTER_SETS.lowercase.test(password)) {
		errors.push('Password must contain at least one lowercase letter');
	}

	if (config.requireNumbers && !CHARACTER_SETS.numbers.test(password)) {
		errors.push('Password must contain at least one number');
	}

	if (config.requireSpecialChars && !CHARACTER_SETS.special.test(password)) {
		errors.push('Password must contain at least one special character (!@#$%^&* etc.)');
	}

	// Common password validation
	if (config.preventCommonPasswords) {
		const lowerPassword = password.toLowerCase();
		if (COMMON_PASSWORDS.has(lowerPassword)) {
			errors.push('Password is too common and easily guessable');
		}
	}

	// Personal information validation
	if (config.preventPersonalInfo && context) {
		if (containsPersonalInfo(password, context.email, context.name)) {
			errors.push('Password must not contain personal information (name, email, etc.)');
		}
	}

	// Calculate strength score
	const score = calculatePasswordStrength(password);

	// Warnings for weak passwords
	if (score < 40) {
		warnings.push('Password is very weak and easily compromised');
	} else if (score < 60) {
		warnings.push('Password could be stronger for better security');
	}

	// Check minimum strength score
	if (score < config.minStrengthScore) {
		errors.push(
			`Password strength score ${score} is below minimum required ${config.minStrengthScore}`,
		);
	}

	// Generate suggestions for improvement
	if (score < 80) {
		suggestions.push('Use a longer password (12+ characters recommended)');

		if (!CHARACTER_SETS.uppercase.test(password)) {
			suggestions.push('Add uppercase letters');
		}
		if (!CHARACTER_SETS.lowercase.test(password)) {
			suggestions.push('Add lowercase letters');
		}
		if (!CHARACTER_SETS.numbers.test(password)) {
			suggestions.push('Add numbers');
		}
		if (!CHARACTER_SETS.special.test(password)) {
			suggestions.push('Add special characters');
		}

		suggestions.push('Avoid common patterns and dictionary words');
		suggestions.push('Consider using a passphrase (e.g., "correct-horse-battery-staple")');
	}

	return {
		errors,
		isValid: errors.length === 0 && score >= config.minStrengthScore,
		score,
		suggestions,
		warnings,
	};
}

/**
 * Generate secure random password
 */
export function generateSecurePassword(length = 16): string {
	const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const lowercase = 'abcdefghijklmnopqrstuvwxyz';
	const numbers = '0123456789';
	const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

	const allChars = uppercase + lowercase + numbers + special;

	let password = '';

	// Ensure at least one of each required character type
	password += uppercase[Math.floor(Math.random() * uppercase.length)];
	password += lowercase[Math.floor(Math.random() * lowercase.length)];
	password += numbers[Math.floor(Math.random() * numbers.length)];
	password += special[Math.floor(Math.random() * special.length)];

	// Fill the rest with random characters
	for (let i = password.length; i < length; i++) {
		password += allChars[Math.floor(Math.random() * allChars.length)];
	}

	// Shuffle the password
	return password
		.split('')
		.sort(() => Math.random() - 0.5)
		.join('');
}

/**
 * Check if password needs to be changed (e.g., for expired passwords)
 */
export function shouldChangePassword(lastChanged: Date, maxAge = 90): boolean {
	const now = new Date();
	const ageInDays = (now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
	return ageInDays > maxAge;
}

export default {
	DEFAULT_PASSWORD_POLICY,
	generateSecurePassword,
	shouldChangePassword,
	validatePassword,
};
