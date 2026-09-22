import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { THEME_STORAGE_KEY, ThemeContext, type Theme } from './ThemeContext';

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';

const prefersDark = (): boolean =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

/**
 * Na primeira visita o tema do sistema serve só de ponto de partida — daí em
 * diante vale a escolha guardada, que não muda mais sozinha. Um valor antigo
 * de 'system' no storage cai neste mesmo caminho e é substituído.
 */
const readTheme = (): Theme => {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		if (isTheme(stored)) return stored;
	} catch {
		// Modo privado ou storage bloqueado: decide pelo sistema e segue.
	}

	return prefersDark() ? 'dark' : 'light';
};

const persist = (theme: Theme) => {
	try {
		localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// Sem storage a escolha vale só para esta sessão.
	}
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
	const [theme, setThemeState] = useState<Theme>(readTheme);

	// A classe no <html> é o que liga a variante `dark:` do Tailwind.
	useEffect(() => {
		document.documentElement.classList.toggle('dark', theme === 'dark');
		document.documentElement.style.colorScheme = theme;
	}, [theme]);

	// Grava também no primeiro carregamento, não só na troca: sem isso o tema
	// semeado pelo sistema voltaria a mudar sozinho a cada visita, que é
	// justamente o comportamento que saiu.
	useEffect(() => {
		persist(theme);
	}, [theme]);

	const setTheme = useCallback((next: Theme) => setThemeState(next), []);

	const toggleTheme = useCallback(
		() => setTheme(theme === 'dark' ? 'light' : 'dark'),
		[setTheme, theme]
	);

	const value = useMemo(
		() => ({ theme, setTheme, toggleTheme }),
		[theme, setTheme, toggleTheme]
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
