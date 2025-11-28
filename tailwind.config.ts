import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
	content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
	plugins: [tailwindcssAnimate],
	theme: {
		extend: {},
	},
} satisfies Config;
