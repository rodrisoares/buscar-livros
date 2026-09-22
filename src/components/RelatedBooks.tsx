import React from 'react';
import { Link } from 'react-router-dom';
import type { Book } from '@/types/Book';
import { useRelatedBooks } from '@/hooks/useRelatedBooks';
import { useInView } from '@/hooks/useInView';
import BookCover from './BookCover';

const RelatedRow: React.FC<{ title: string; books: Book[] }> = ({ title, books }) => {
	if (books.length === 0) return null;

	return (
		<div className='mb-10'>
			<h3 className='text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4'>
				{title}
			</h3>

			<ul className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4'>
				{books.map((book) => (
					<li key={book.id}>
						<Link
							to={`/book/${book.id}`}
							className='group block text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg p-1'
						>
							<BookCover
								src={book.thumbnail}
								title={book.title}
								className='w-full aspect-[2/3] object-cover rounded shadow-sm group-hover:opacity-80 transition-opacity'
							/>
							<span className='mt-2 block text-xs text-gray-700 dark:text-slate-300 line-clamp-2'>
								{book.title}
							</span>
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
};

const Skeleton = () => (
	<div className='mt-16 border-t border-gray-200 dark:border-slate-700 pt-8'>
		<div className='h-6 w-48 rounded bg-gray-200 dark:bg-slate-700 animate-pulse mb-4' />
		<div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4'>
			{Array.from({ length: 6 }, (_, index) => (
				<div
					key={index}
					className='w-full aspect-[2/3] rounded bg-gray-200 dark:bg-slate-700 animate-pulse'
				/>
			))}
		</div>
	</div>
);

/**
 * As duas consultas só partem quando este bloco chega perto da tela — ele vive
 * no fim de uma página longa, e antes elas saíam sempre, gastando cota por
 * quem lia a sinopse e voltava.
 */
const RelatedBooks: React.FC<{ book: Book }> = ({ book }) => {
	const { ref, inView } = useInView<HTMLDivElement>();
	const { author, category, sameAuthor, sameCategory, isLoading } = useRelatedBooks(book, inView);

	// A sentinela fica montada o tempo todo: é ela que o observador acompanha.
	return (
		<div ref={ref}>
			{isLoading ? (
				<Skeleton />
			) : inView && (sameAuthor.length > 0 || sameCategory.length > 0) ? (
				<section className='mt-16 border-t border-gray-200 dark:border-slate-700 pt-8'>
					<h2 className='text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-6'>
						Você também pode gostar
					</h2>

					<RelatedRow title={`Mais de ${author}`} books={sameAuthor} />
					<RelatedRow title={`Mais em ${category}`} books={sameCategory} />
				</section>
			) : null}
		</div>
	);
};

export default RelatedBooks;
