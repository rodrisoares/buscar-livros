import React, { useState } from 'react';
import type { Book } from '@/types/Book';
import { useToast } from '@/hooks/useToast';
import { shareLink } from '@/utils/share';

interface ShareButtonProps {
	book: Book;
	className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ book, className = '' }) => {
	const { showToast } = useToast();
	const [isSharing, setIsSharing] = useState(false);

	const handleShare = async () => {
		setIsSharing(true);

		const outcome = await shareLink({
			title: book.title,
			text: `${book.title} — ${book.author}`,
			url: `${window.location.origin}/book/${book.id}`,
		});

		setIsSharing(false);

		if (outcome === 'copied') {
			showToast({ message: 'Link copiado para a área de transferência.', variant: 'success' });
		} else if (outcome === 'failed') {
			showToast({ message: 'Não foi possível compartilhar este livro.', variant: 'error' });
		}
		// 'shared' e 'cancelled' já têm retorno visual do próprio sistema.
	};

	return (
		<button
			type='button'
			onClick={handleShare}
			disabled={isSharing}
			className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-60 ${className}`}
		>
			<svg
				className='w-4 h-4'
				fill='none'
				stroke='currentColor'
				viewBox='0 0 24 24'
				aria-hidden='true'
			>
				<path
					strokeLinecap='round'
					strokeLinejoin='round'
					strokeWidth={2}
					d='M8.684 13.342a3 3 0 100-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684zm0-12a3 3 0 105.368-2.684A3 3 0 0015.316 6.658z'
				/>
			</svg>
			Compartilhar
		</button>
	);
};

export default ShareButton;
