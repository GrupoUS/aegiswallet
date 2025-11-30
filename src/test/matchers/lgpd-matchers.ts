import { expect } from 'vitest';

// LGPD Compliance validation interfaces
interface LGPDComplianceResult {
	isCompliant: boolean;
	violations: string[];
	recommendations: string[];
	severity: 'low' | 'medium' | 'high' | 'critical';
}

interface _LGPDDataAssessment {
	hasPersonalData: boolean;
	hasSensitiveData: boolean;
	purposeSpecified: boolean;
	consentObtained: boolean;
	retentionPolicy: boolean;
	dataMinimization: boolean;
	securityMeasures: boolean;
}

// Brazilian LGPD compliance patterns
const SENSITIVE_DATA_PATTERNS = {
	cpf: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/,
	cnpj: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/,
	creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/,
	phone: /\b\(\d{2}\)\s?\d{4,5}-\d{4}\b/,
	email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
	address:
		/\b(?:Rua|Avenida|Av\.|Alameda|Travessa|Praça|SQN|SQW|SHIN|SHIS|SGAS|CLN|SCLN|CNB|CSE|CSE|CWS|CSW|SGAS|CLN|SCLN|CNB|CSE|CWS|CSW)\s+\d+/i,
	healthData:
		/\b(?:doença|tratamento|medicamento|diagnóstico|exame|sintoma)\b/i,
};

const REQUIRED_LGPD_ELEMENTS = [
	'consent',
	'purpose',
	'retention',
	'minimization',
	'security',
	'rights',
] as const;

// Custom LGPD matcher implementation
export function toBeLGPDCompliant(received: unknown): {
	pass: boolean;
	message: () => string;
	actual?: unknown;
	expected?: unknown;
} {
	const assessment = assessLGPDCompliance(received);
	const pass = assessment.isCompliant;

	const message = pass
		? () => `Expected data not to be LGPD compliant, but it passed all checks`
		: () =>
				`Expected data to be LGPD compliant, but found violations:\n${assessment.violations.map((v) => `  - ${v}`).join('\n')}\n\nRecommendations:\n${assessment.recommendations.map((r) => `  - ${r}`).join('\n')}`;

	return {
		pass,
		message,
		actual: received,
		expected: 'LGPD compliant data',
	};
}

// Assessment function for LGPD compliance
function assessLGPDCompliance(data: unknown): LGPDComplianceResult {
	const violations: string[] = [];
	const recommendations: string[] = [];
	let severity: LGPDComplianceResult['severity'] = 'low';

	try {
		// Type check
		if (!data || typeof data !== 'object') {
			return {
				isCompliant: false,
				violations: ['Data must be a valid object'],
				recommendations: ['Ensure data is properly structured'],
				severity: 'high',
			};
		}

		const dataObj = data as Record<string, unknown>;
		const dataStr = JSON.stringify(data);

		// Check for sensitive data exposure
		const sensitiveDataFound = Object.entries(SENSITIVE_DATA_PATTERNS).filter(
			([_type, pattern]) => pattern.test(dataStr),
		);

		if (sensitiveDataFound.length > 0) {
			violations.push(
				`Sensitive data detected: ${sensitiveDataFound.map(([type]) => type).join(', ')}`,
			);
			recommendations.push(
				'Implement data masking or encryption for sensitive information',
			);
			recommendations.push(
				'Ensure explicit user consent for processing sensitive data',
			);
			severity = 'critical';
		}

		// Check for required LGPD elements
		const missingElements = REQUIRED_LGPD_ELEMENTS.filter((element) => {
			const hasElement = Object.keys(dataObj).some(
				(key) =>
					key.toLowerCase().includes(element) ||
					(typeof dataObj[key] === 'string' &&
						(dataObj[key] as string).toLowerCase().includes(element)),
			);
			return !hasElement;
		});

		if (missingElements.length > 0) {
			violations.push(
				`Missing LGPD required elements: ${missingElements.join(', ')}`,
			);
			recommendations.push('Include consent mechanism');
			recommendations.push('Specify data processing purpose');
			recommendations.push('Define data retention policies');
			recommendations.push('Implement data minimization principles');
			severity = severity === 'critical' ? 'critical' : 'high';
		}

		// Check data minimization
		const dataKeys = Object.keys(dataObj);
		if (dataKeys.length > 50) {
			violations.push(
				'Excessive data fields - violates data minimization principle',
			);
			recommendations.push(
				'Review and minimize collected data to only necessary fields',
			);
			severity = severity === 'critical' ? 'critical' : 'medium';
		}

		// Check for proper consent mechanism
		const hasConsent = dataKeys.some(
			(key) =>
				key.toLowerCase().includes('consent') &&
				typeof dataObj[key] === 'boolean' &&
				dataObj[key] === true,
		);

		if (!hasConsent && sensitiveDataFound.length > 0) {
			violations.push('Missing explicit consent for sensitive data processing');
			recommendations.push(
				'Implement explicit consent collection and verification',
			);
			severity = 'critical';
		}

		// Check retention policy
		const hasRetention = dataKeys.some(
			(key) =>
				key.toLowerCase().includes('retention') ||
				key.toLowerCase().includes('expires') ||
				key.toLowerCase().includes('ttl'),
		);

		if (!hasRetention) {
			violations.push('Missing data retention policy');
			recommendations.push('Define clear data retention and deletion policies');
			severity = severity === 'critical' ? 'critical' : 'medium';
		}

		// Check for Brazilian data protection standards
		const hasBrazilianCompliance = dataKeys.some(
			(key) =>
				key.toLowerCase().includes('lgpd') ||
				key.toLowerCase().includes('brazil') ||
				key.toLowerCase().includes('pt-br'),
		);

		if (!hasBrazilianCompliance) {
			recommendations.push('Consider Brazilian LGPD compliance requirements');
		}

		return {
			isCompliant: violations.length === 0,
			violations,
			recommendations,
			severity,
		};
	} catch (error) {
		return {
			isCompliant: false,
			violations: [
				`Assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			],
			recommendations: ['Review data structure and try again'],
			severity: 'high',
		};
	}
}

// Additional LGPD matchers
export function toHaveValidConsent(received: unknown): {
	pass: boolean;
	message: () => string;
} {
	const data = received as Record<string, unknown>;
	const hasValidConsent = Object.keys(data).some(
		(key) =>
			key.toLowerCase().includes('consent') &&
			typeof data[key] === 'boolean' &&
			data[key] === true,
	);

	return {
		pass: hasValidConsent,
		message: () =>
			hasValidConsent
				? 'Expected data not to have valid consent, but consent was found'
				: 'Expected data to have valid consent, but no valid consent mechanism found',
	};
}

export function toHaveDataMinimization(received: unknown): {
	pass: boolean;
	message: () => string;
} {
	const data = received as Record<string, unknown>;
	const fieldCount = Object.keys(data).length;
	const hasMinimization = fieldCount <= 20; // Arbitrary threshold for demo

	return {
		pass: hasMinimization,
		message: () =>
			hasMinimization
				? `Expected data not to follow minimization, but has only ${fieldCount} fields`
				: `Expected data to follow minimization principle, but has ${fieldCount} fields (consider reducing)`,
	};
}

export function toHaveRetentionPolicy(received: unknown): {
	pass: boolean;
	message: () => string;
} {
	const data = received as Record<string, unknown>;
	const hasRetention = Object.keys(data).some(
		(key) =>
			key.toLowerCase().includes('retention') ||
			key.toLowerCase().includes('expires') ||
			key.toLowerCase().includes('ttl') ||
			key.toLowerCase().includes('deletion'),
	);

	return {
		pass: hasRetention,
		message: () =>
			hasRetention
				? 'Expected data not to have retention policy, but policy was found'
				: 'Expected data to have retention policy, but no retention mechanism found',
	};
}

// Extend Vitest expect interface
declare module 'vitest' {
	interface Assertion<T = any> {
		toBeLGPDCompliant(): T;
		toHaveValidConsent(): T;
		toHaveDataMinimization(): T;
		toHaveRetentionPolicy(): T;
	}
}

// Register matchers
expect.extend({
	toBeLGPDCompliant,
	toHaveValidConsent,
	toHaveDataMinimization,
	toHaveRetentionPolicy,
});
