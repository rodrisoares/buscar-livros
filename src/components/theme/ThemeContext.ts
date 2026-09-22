import { createContext } from 'react';

/** Só existem dois temas: a opção "seguir o sistema" foi removida. */
export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
	/** O tema aplicado agora. */
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
}

export const THEME_STORAGE_KEY = 'theme';

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
