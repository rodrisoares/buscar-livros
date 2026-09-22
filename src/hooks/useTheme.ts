import { useContext } from 'react';
import { ThemeContext } from '@/components/theme/ThemeContext';

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
	}
	return context;
};
