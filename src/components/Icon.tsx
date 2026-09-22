import React from 'react';

/**
 * Conjunto de ícones do projeto.
 *
 * No lugar dos emojis: 📚 e ⭐ desenham diferente em cada sistema operacional,
 * mudam de largura, arrastam a linha de base do texto ao lado e não respondem
 * à cor do tema. Estes traçam em `currentColor`, então herdam a cor de quem os
 * contém e ficam iguais em qualquer máquina.
 */
export type IconName =
	| 'library'
	| 'bookmark'
	| 'book-open'
	| 'book-closed'
	| 'check-circle'
	| 'star'
	| 'pages'
	| 'chart'
	| 'alert'
	| 'search'
	| 'bolt'
	| 'heart'
	| 'mail'
	| 'clock'
	| 'grid'
	| 'list'
	| 'chevron-down'
	| 'arrow-left'
	| 'check'
	| 'trash'
	| 'tag'
	| 'filter'
	| 'x';

/** Traçados de 24x24, todos com o mesmo peso de linha. */
const PATHS: Record<IconName, React.ReactNode> = {
	library: (
		<>
			<path d='M4 5.5A1.5 1.5 0 0 1 5.5 4H8v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z' />
			<path d='M8 4h3.5A1.5 1.5 0 0 1 13 5.5v13a1.5 1.5 0 0 1-1.5 1.5H8V4Z' />
			<path d='m15.5 5.8 2.6-.7a1.5 1.5 0 0 1 1.84 1.06l3 11.2' />
			<path d='m15.5 5.8 3.4 12.7a1.5 1.5 0 0 1-1.06 1.84l-2.34.63' />
		</>
	),
	bookmark: <path d='M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z' />,
	'book-open': (
		<>
			<path d='M12 6.5C10.5 5.2 8.6 4.5 6.5 4.5H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2.5c2.1 0 4 .7 5.5 2' />
			<path d='M12 6.5c1.5-1.3 3.4-2 5.5-2H20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2.5c-2.1 0-4 .7-5.5 2' />
			<path d='M12 6.5v14' />
		</>
	),
	'book-closed': (
		<>
			<path d='M5 4.5A1.5 1.5 0 0 1 6.5 3H19v18H6.5A1.5 1.5 0 0 1 5 19.5v-15Z' />
			<path d='M5 17h14' />
		</>
	),
	'check-circle': (
		<>
			<circle cx='12' cy='12' r='9' />
			<path d='m8.5 12.2 2.4 2.4 4.6-4.9' />
		</>
	),
	star: (
		<path d='m12 3.6 2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.99l-5.25 2.76 1-5.85L3.5 9.75l5.9-.85L12 3.6Z' />
	),
	pages: (
		<>
			<path d='M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4Z' />
			<path d='M14 3v4h4' />
			<path d='M9 12h6M9 16h6' />
		</>
	),
	chart: (
		<>
			<path d='M4 20V4' />
			<path d='M4 20h16' />
			<path d='M8 20v-6M12.5 20V8M17 20v-9' />
		</>
	),
	alert: (
		<>
			<path d='M10.3 4.3 2.6 17.5A1.5 1.5 0 0 0 3.9 20h16.2a1.5 1.5 0 0 0 1.3-2.5L13.7 4.3a2 2 0 0 0-3.4 0Z' />
			<path d='M12 9.5v4' />
			<path d='M12 17h.01' />
		</>
	),
	search: <path d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />,
	bolt: <path d='M13.5 2 4 13.5h6.5L10 22l9.5-11.5H13L13.5 2Z' />,
	heart: (
		<path d='M12 20.5s-7.5-4.6-7.5-9.7A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 3.2c0 5.1-7.5 9.7-7.5 9.7Z' />
	),
	mail: (
		<>
			<rect x='3' y='5' width='18' height='14' rx='1.5' />
			<path d='m3.5 6.5 7.6 5.6a1.5 1.5 0 0 0 1.8 0l7.6-5.6' />
		</>
	),
	clock: (
		<>
			<circle cx='12' cy='12' r='9' />
			<path d='M12 7v5.2l3.2 2' />
		</>
	),
	grid: (
		<>
			<rect x='3.5' y='3.5' width='7' height='7' rx='1' />
			<rect x='13.5' y='3.5' width='7' height='7' rx='1' />
			<rect x='3.5' y='13.5' width='7' height='7' rx='1' />
			<rect x='13.5' y='13.5' width='7' height='7' rx='1' />
		</>
	),
	list: (
		<>
			<path d='M4 6.5h.01M4 12h.01M4 17.5h.01' />
			<path d='M8.5 6.5H20M8.5 12H20M8.5 17.5H20' />
		</>
	),
	'chevron-down': <path d='m6 9.5 6 6 6-6' />,
	'arrow-left': <path d='M19 12H5m0 0 6-6m-6 6 6 6' />,
	check: <path d='m5 12.5 4.5 4.5L19 7' />,
	trash: (
		<>
			<path d='M4 7h16M10 4h4a1 1 0 0 1 1 1v2H9V5a1 1 0 0 1 1-1Z' />
			<path d='M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7' />
			<path d='M10 11v6M14 11v6' />
		</>
	),
	tag: (
		<>
			<path d='M3 12.5V5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.41.59l6.5 6.5a2 2 0 0 1 0 2.82l-7.5 7.5a2 2 0 0 1-2.82 0l-6.5-6.5A2 2 0 0 1 3 12.5Z' />
			<path d='M7.5 7.5h.01' />
		</>
	),
	filter: (
		<path d='M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.59a1 1 0 0 1-.29.7l-6.42 6.42a1 1 0 0 0-.29.7V17l-4 4v-6.59a1 1 0 0 0-.29-.7L3.29 7.29A1 1 0 0 1 3 6.59V4Z' />
	),
	x: <path d='M6 18 18 6M6 6l12 12' />,
};

/** Ícones que pedem preenchimento em vez de contorno. */
const FILLED: IconName[] = ['star', 'bookmark', 'heart', 'bolt'];

interface IconProps {
	name: IconName;
	className?: string;
	/**
	 * Só quando o ícone carrega sozinho um significado. Sem ele o ícone é
	 * decorativo — que é o caso sempre que há um rótulo ao lado.
	 */
	title?: string;
}

const Icon: React.FC<IconProps> = ({ name, className = 'w-5 h-5', title }) => {
	const filled = FILLED.includes(name);

	return (
		<svg
			viewBox='0 0 24 24'
			className={className}
			fill={filled ? 'currentColor' : 'none'}
			stroke='currentColor'
			strokeWidth={filled ? 0 : 1.8}
			strokeLinecap='round'
			strokeLinejoin='round'
			role={title ? 'img' : undefined}
			aria-hidden={title ? undefined : true}
			focusable='false'
		>
			{title && <title>{title}</title>}
			{PATHS[name]}
		</svg>
	);
};

export default Icon;
