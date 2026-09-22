import React from 'react';

interface HeartIconProps {
	filled: boolean;
	className?: string;
}

/**
 * Coração em SVG. Os emojis ❤️/🤍 renderizam com tamanho e cor diferentes em
 * cada sistema operacional — o SVG herda a cor do texto e o tamanho da classe.
 */
const HeartIcon: React.FC<HeartIconProps> = ({ filled, className = 'w-5 h-5' }) => (
	<svg
		className={className}
		viewBox='0 0 24 24'
		fill={filled ? 'currentColor' : 'none'}
		stroke='currentColor'
		strokeWidth={2}
		aria-hidden='true'
	>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
		/>
	</svg>
);

export default HeartIcon;
