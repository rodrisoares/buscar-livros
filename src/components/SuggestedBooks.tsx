import React from 'react';
import BookGrid from './BookGrid';
import { BookGridSkeleton } from './BookCardSkeleton';
import { useSuggestedBooks } from '@/hooks/useSuggestedBooks';
import { QUOTA_MESSAGE } from '@/lib/apiErrors';

/** Vitrine de livros na tela inicial, para quem chega sem um título em mente. */
const SuggestedBooks: React.FC<{ className?: string }> = ({ className = '' }) => {
	const { theme, books, isLoading, hasError, isQuotaError } = useSuggestedBooks();

	return (
		<section className={`bg-white dark:bg-slate-900 px-6 py-12 ${className}`} aria-labelledby='titulo-sugestoes'>
			<div className='max-w-6xl mx-auto'>
				<div className='mb-6'>
					<h2
						id='titulo-sugestoes'
						className='text-2xl font-semibold text-gray-900 dark:text-slate-100'
					>
						{theme.title}
					</h2>
					<p className='text-gray-600 dark:text-slate-400 mt-1'>
						Uma amostra do acervo para você começar.
					</p>
				</div>

				{isLoading ? (
					<BookGridSkeleton count={12} />
				) : hasError ? (
					// Sugestão é conteúdo acessório: avisa discretamente, sem alarme.
					<p className='rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-3 text-sm text-gray-600 dark:text-slate-300'>
						{isQuotaError
							? QUOTA_MESSAGE
							: 'Não foi possível carregar as sugestões agora. A busca continua funcionando normalmente.'}
					</p>
				) : books.length > 0 ? (
					<BookGrid books={books} />
				) : null}
			</div>
		</section>
	);
};

export default SuggestedBooks;
