import { describe, expect, it } from 'vitest';

import { formatPrice, formatPriceCustom } from '@/lib/billing/format-price';

// Intl.NumberFormat uses non-breaking space (U+00A0) between currency and value
// for pt-BR locale. Using regex to match either space type for robustness.
const matchCurrency = (value: string, expected: string) => {
	const normalized = value.replace(/\u00A0/g, ' ');
	expect(normalized).toBe(expected);
};

describe('formatPrice', () => {
	it('formats BRL currency correctly', () => {
		matchCurrency(formatPrice(5900), 'R$ 59,00');
		matchCurrency(formatPrice(11900), 'R$ 119,00');
		matchCurrency(formatPrice(0), 'R$ 0,00');
	});

	it('handles different currencies', () => {
		matchCurrency(formatPrice(10000, 'USD'), 'US$ 100,00');
		matchCurrency(formatPrice(10000, 'EUR'), '€ 100,00');
	});

	it('handles cents correctly', () => {
		matchCurrency(formatPrice(1050), 'R$ 10,50');
		matchCurrency(formatPrice(99), 'R$ 0,99');
	});

	it('handles large numbers', () => {
		matchCurrency(formatPrice(100000), 'R$ 1.000,00');
		matchCurrency(formatPrice(1000000), 'R$ 10.000,00');
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
