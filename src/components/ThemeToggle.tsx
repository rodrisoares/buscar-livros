import React from 'react';
import { useTheme } from '@/hooks/useTheme';

/**
 * Um único botão que alterna entre claro e escuro — os dois únicos temas. O
 * ícone mostrado é o do tema que será aplicado no clique: sol quando está
 * escuro, lua quando está claro.
 */
const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
	const { theme, toggleTheme } = useTheme();
	const indoParaEscuro = theme === 'light';

	return (
		<button
			type='button'
			onClick={toggleTheme}
			aria-label={indoParaEscuro ? 'Ativar tema escuro' : 'Ativar tema claro'}
			title={indoParaEscuro ? 'Ativar tema escuro' : 'Ativar tema claro'}
			className={`inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-700 text-slate-300 hover:text-white hover:bg-white/10 transition-colors ${className}`}
		>
			{indoParaEscuro ? (
				// Lua: clicar leva para o tema escuro.
				<svg
					className='w-5 h-5'
					fill='none'
					stroke='currentColor'
					strokeWidth={2}
					viewBox='0 0 24 24'
					aria-hidden='true'
				>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						d='M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z'
					/>
				</svg>
			) : (
				// Sol: clicar leva para o tema claro.
				<svg
					className='w-5 h-5'
					fill='none'
					stroke='currentColor'
					strokeWidth={2}
					viewBox='0 0 24 24'
					aria-hidden='true'
				>
					<circle cx='12' cy='12' r='4' />
					<path
						strokeLinecap='round'
						d='M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41'
					/>
				</svg>
			)}
		</button>
	);
};

export default ThemeToggle;
