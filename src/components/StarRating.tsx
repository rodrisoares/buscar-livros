import React from 'react';
import Icon from './Icon';

interface StarRatingProps {
	rating: number;
	ratingsCount: number;
	className?: string;
}

const STARS = [1, 2, 3, 4, 5];

/** Cinco estrelas com preenchimento proporcional à nota média da Google Books. */
const StarRating: React.FC<StarRatingProps> = ({ rating, ratingsCount, className = '' }) => {
	if (!rating) return null;

	const percentage = Math.max(0, Math.min(100, (rating / 5) * 100));

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			{/* Duas fileiras sobrepostas: a de baixo apagada, a de cima recortada na
			    largura da nota. É o que permite meia estrela sem meio ícone. */}
			<span
				className='relative inline-flex leading-none'
				role='img'
				aria-label={`Nota ${rating.toFixed(1)} de 5`}
			>
				<span className='flex gap-0.5 text-gray-300 dark:text-slate-600'>
					{STARS.map((star) => (
						<Icon key={star} name='star' className='w-4 h-4' />
					))}
				</span>
				<span
					className='absolute inset-0 flex gap-0.5 overflow-hidden text-amber-400'
					style={{ width: `${percentage}%` }}
				>
					{STARS.map((star) => (
						<Icon key={star} name='star' className='w-4 h-4 shrink-0' />
					))}
				</span>
			</span>

			<span className='text-sm text-gray-600 dark:text-slate-400'>
				{rating.toFixed(1)}
				{ratingsCount > 0 && (
					<span className='text-gray-600 dark:text-slate-400'>
						{' '}
						({ratingsCount} {ratingsCount === 1 ? 'avaliação' : 'avaliações'})
					</span>
				)}
			</span>
		</div>
	);
};

export default StarRating;
