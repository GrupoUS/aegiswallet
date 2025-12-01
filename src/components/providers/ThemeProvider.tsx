import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light' | 'system' | 'tweakcn';

interface ThemeProviderProps {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
}

interface ThemeProviderState {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
	setTheme: () => null,
	theme: 'system',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
	children,
	defaultTheme = 'system',
	storageKey = 'aegiswallet-theme',
	...props
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(
		() => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
	);

	useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove('light', 'dark', 'tweakcn');

		if (theme === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light';

			root.classList.add(systemTheme);
			return;
		}

		root.classList.add(theme);
	}, [theme]);

	const setTheme = useCallback(
		(newTheme: Theme) => {
			localStorage.setItem(storageKey, newTheme);
			setThemeState(newTheme);
		},
		[storageKey],
	);

	const value = useMemo(
		() => ({
			setTheme,
			theme,
		}),
		[setTheme, theme],
	);

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}

	return context;
};
