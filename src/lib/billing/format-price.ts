/**
 * Format price in Brazilian Real (BRL)
 */
export function formatPrice(cents: number, currency: string = 'BRL'): string {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency,
	}).format(cents / 100);
}

/**
 * Format price with custom options
 */
export function formatPriceCustom(
	cents: number,
	options?: {
		currency?: string;
		locale?: string;
		showCurrency?: boolean;
	},
): string {
	const {
		currency = 'BRL',
		locale = 'pt-BR',
		showCurrency = true,
	} = options || {};

	if (!showCurrency) {
		return new Intl.NumberFormat(locale, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(cents / 100);
	}

	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
	}).format(cents / 100);
}
