import React, { useState } from 'react';
import Icon from '@/components/Icon';

interface RatingInputProps {
	value: number;
	onChange: (rating: number) => void;
	disabled?: boolean;
	className?: string;
}

const STARS = [1, 2, 3, 4, 5];

/** Nota pessoal de 1 a 5. Clicar na estrela já marcada zera a nota. */
const RatingInput: React.FC<RatingInputProps> = ({
	value,
	onChange,
	disabled = false,
	className = '',
}) => {
	const [hovered, setHovered] = useState(0);
	const displayed = hovered || value;

	return (
		<div className={`flex items-center gap-1 ${className}`} onMouseLeave={() => setHovered(0)}>
			{STARS.map((star) => (
				<button
					key={star}
					type='button'
					disabled={disabled}
					onClick={() => onChange(star === value ? 0 : star)}
					onMouseEnter={() => setHovered(star)}
					onFocus={() => setHovered(star)}
					onBlur={() => setHovered(0)}
					aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
					aria-pressed={star <= value}
					className={`transition-transform hover:scale-110 disabled:cursor-not-allowed ${
						star <= displayed ? 'text-amber-400' : 'text-gray-300 dark:text-slate-600'
					}`}
				>
					<Icon name='star' className='w-7 h-7' />
				</button>
			))}

			<span className='ml-2 text-sm text-gray-600 dark:text-slate-400'>
				{value > 0 ? `${value}/5` : 'Sem nota'}
			</span>
		</div>
	);
};

export default RatingInput;
