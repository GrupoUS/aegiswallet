import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Format currency amount to Brazilian Real format
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(amount);
}

export const CPFValidator = {
	format(cpf: string): string {
		const cleaned = cpf.replace(/[^\d]/g, '');
		if (cleaned.length !== 11) {
			return cpf;
		}

		return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
	},
	isValid(cpf: string): boolean {
		const cleaned = cpf.replace(/[^\d]/g, '');

		if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) {
			return false;
		}

		let sum = 0;
		for (let i = 1; i <= 9; i++) {
			sum += Number.parseInt(cleaned.substring(i - 1, i), 10) * (11 - i);
		}

		let remainder = (sum * 10) % 11;
		if (remainder === 10 || remainder === 11) {
			remainder = 0;
		}
		if (remainder !== Number.parseInt(cleaned.substring(9, 10), 10)) {
			return false;
		}

		sum = 0;
		for (let i = 1; i <= 10; i++) {
			sum += Number.parseInt(cleaned.substring(i - 1, i), 10) * (12 - i);
		}

		remainder = (sum * 10) % 11;
		if (remainder === 10 || remainder === 11) {
			remainder = 0;
		}

		return remainder === Number.parseInt(cleaned.substring(10, 11), 10);
	},
};

/**
 * Safely retrieves and validates environment variables
 * Throws descriptive error if variable is missing
 */
export function getRequiredEnvVar(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

/**
 * Safely retrieves environment variable with optional default
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
	return process.env[key] ?? defaultValue;
}
