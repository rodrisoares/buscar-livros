import React from 'react';
import illustration from '@/assets/illustration.png';

interface BookIllustrationProps {
	className?: string;
}

const BookIllustration: React.FC<BookIllustrationProps> = ({ className = '' }) => {
	return (
		<div className={`relative ${className}`}>
			<img
				src={illustration}
				alt='Ilustração de uma pessoa organizando livros em estantes'
				className='w-full h-auto max-w-lg mx-auto'
			/>
		</div>
	);
};

export default BookIllustration;
