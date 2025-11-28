import { describe, expect, it } from 'vitest';

import { formatPrice, formatPriceCustom } from '@/lib/billing/format-price';

describe('formatPrice', () => {
	it('formats BRL currency correctly', () => {
		expect(formatPrice(5900)).toBe('R$ 59,00');
		expect(formatPrice(11900)).toBe('R$ 119,00');
		expect(formatPrice(0)).toBe('R$ 0,00');
	});

	it('handles different currencies', () => {
		expect(formatPrice(10000, 'USD')).toBe('US$ 100,00');
		expect(formatPrice(10000, 'EUR')).toBe('€ 100,00');
	});

	it('handles cents correctly', () => {
		expect(formatPrice(1050)).toBe('R$ 10,50');
		expect(formatPrice(99)).toBe('R$ 0,99');
	});

	it('handles large numbers', () => {
		expect(formatPrice(100000)).toBe('R$ 1.000,00');
		expect(formatPrice(1000000)).toBe('R$ 10.000,00');
	});
});

describe('formatPriceCustom', () => {
	it('formats without currency symbol when showCurrency is false', () => {
		const result = formatPriceCustom(5900, { showCurrency: false });
		expect(result).toBe('59,00');
	});

	it('uses custom locale', () => {
		const result = formatPriceCustom(5900, {
			locale: 'en-US',
			currency: 'USD',
		});
		expect(result).toContain('59.00');
	});

	it('handles all options together', () => {
		const result = formatPriceCustom(1599, {
			currency: 'EUR',
			locale: 'de-DE',
			showCurrency: true,
		});
		expect(result).toContain('15,99');
	});
});
