import React from 'react';

interface LogoProps {
	className?: string;
	/** Só o ícone da estante, sem o texto — útil em espaços estreitos. */
	iconOnly?: boolean;
}

/**
 * Marca do projeto em SVG: uma estante de duas prateleiras e a palavra
 * "Buscar Livros".
 *
 * A moldura, as prateleiras e a palavra "Buscar" usam `currentColor`, então a
 * marca se adapta ao fundo onde estiver (cabeçalho escuro, página clara).
 */
const Logo: React.FC<LogoProps> = ({ className = 'h-8 w-auto', iconOnly = false }) => (
	<svg
		viewBox={iconOnly ? '0 0 40 40' : '0 0 196 40'}
		className={className}
		role='img'
		aria-label='Buscar Livros'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
	>
		<title>Buscar Livros</title>

		{/* Moldura da estante */}
		<rect
			x='1.4'
			y='1.4'
			width='37.2'
			height='37.2'
			rx='8'
			stroke='currentColor'
			strokeWidth='2.4'
		/>
		{/* Prateleira do meio */}
		<path d='M2.6 21.6h34.8' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' />

		{/* Prateleira de cima: livros coloridos, alturas diferentes */}
		<rect x='7.1' y='9.6' width='5.4' height='12' rx='1.3' fill='#818cf8' />
		<rect x='13.9' y='7' width='5.4' height='14.6' rx='1.3' fill='#a78bfa' />
		<rect x='20.7' y='11' width='5.4' height='10.6' rx='1.3' fill='#fbbf24' />
		{/* O último fica inclinado, como um livro escorado no fim da fileira */}
		<rect
			x='27.5'
			y='8.6'
			width='5.4'
			height='13'
			rx='1.3'
			fill='#34d399'
			transform='rotate(12 30.2 15.1)'
		/>

		{/* Prateleira de baixo: livros em segundo plano, na cor do texto */}
		<rect x='9' y='26' width='6' height='9.5' rx='1.4' fill='currentColor' opacity='0.38' />
		<rect x='17' y='24.5' width='6' height='11' rx='1.4' fill='currentColor' opacity='0.28' />
		<rect x='25' y='27' width='6' height='8.5' rx='1.4' fill='currentColor' opacity='0.38' />

		{!iconOnly && (
			<text
				x='50'
				y='27'
				fontFamily='Poppins, system-ui, sans-serif'
				fontSize='19'
				fontWeight='600'
				letterSpacing='-0.3'
				xmlSpace='preserve'
			>
				{/* O espaço vai dentro do texto (e não como dx) para acompanhar a
				    fonte que o navegador acabar usando. */}
				<tspan fill='currentColor'>Buscar </tspan>
				<tspan fill='#a78bfa'>Livros</tspan>
			</text>
		)}
	</svg>
);

export default Logo;
