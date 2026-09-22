import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MAX_COLLECTION_DESCRIPTION, MAX_COLLECTION_NAME } from '@/types/Collection';
import { useCollections } from '@/hooks/useCollections';
import { useFavorites } from '@/hooks/useFavorites';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { collectionCovers, getCollectionProgress } from '@/lib/collections';
import BookCover from '@/components/BookCover';
import EmptyState from '@/components/EmptyState';
import Icon from '@/components/Icon';

const fieldClasses =
	'w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent';

const Collections: React.FC = () => {
	const { collections, isLoading, isSaving, createCollection } = useCollections();
	const { favorites } = useFavorites();

	useDocumentTitle('Minhas coleções');

	const [isCreating, setIsCreating] = useState(false);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');

	const cards = useMemo(
		() =>
			collections.map((collection) => ({
				collection,
				progress: getCollectionProgress(collection, favorites),
				covers: collectionCovers(collection, favorites),
			})),
		[collections, favorites]
	);

	const handleCreate = (event: React.FormEvent) => {
		event.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) return;

		createCollection({ name: trimmed, description: description.trim(), bookIds: [] });
		setName('');
		setDescription('');
		setIsCreating(false);
	};

	const form = (
		<form
			onSubmit={handleCreate}
			className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-3 mb-8'
		>
			<div>
				<label
					htmlFor='nome-colecao'
					className='block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1'
				>
					Nome da coleção
				</label>
				<input
					id='nome-colecao'
					type='text'
					value={name}
					autoFocus
					maxLength={MAX_COLLECTION_NAME}
					onChange={(event) => setName(event.target.value)}
					placeholder='ex.: O Senhor dos Anéis'
					className={fieldClasses}
				/>
			</div>

			<div>
				<label
					htmlFor='descricao-colecao'
					className='block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1'
				>
					Descrição <span className='font-normal'>(opcional)</span>
				</label>
				<input
					id='descricao-colecao'
					type='text'
					value={description}
					maxLength={MAX_COLLECTION_DESCRIPTION}
					onChange={(event) => setDescription(event.target.value)}
					placeholder='ex.: na ordem de publicação'
					className={fieldClasses}
				/>
			</div>

			<div className='flex items-center gap-3'>
				<button
					type='submit'
					disabled={isSaving || !name.trim()}
					className='px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50'
				>
					Criar coleção
				</button>
				<button
					type='button'
					onClick={() => setIsCreating(false)}
					className='text-sm text-gray-600 dark:text-slate-400 hover:underline'
				>
					Cancelar
				</button>
			</div>
		</form>
	);

	return (
		<div className='max-w-7xl mx-auto px-6 py-12'>
			<div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
				<div>
					<h1 className='text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2'>
						Minhas coleções
					</h1>
					<p className='text-xl text-gray-600 dark:text-slate-400'>
						Sagas, trilogias e séries, na ordem que você definir
					</p>
				</div>

				{!isCreating && (
					<button
						type='button'
						onClick={() => setIsCreating(true)}
						className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors'
					>
						<Icon name='library' className='w-4 h-4' />
						Nova coleção
					</button>
				)}
			</div>

			{isCreating && form}

			{isLoading ? (
				<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3' role='status' aria-live='polite'>
					<span className='sr-only'>Carregando suas coleções...</span>
					{Array.from({ length: 3 }, (_, index) => (
						<div
							key={index}
							className='h-52 rounded-xl bg-gray-200 dark:bg-slate-700 animate-pulse'
						/>
					))}
				</div>
			) : collections.length === 0 ? (
				<EmptyState
					icon='library'
					title='Nenhuma coleção ainda'
					description='Uma coleção guarda os volumes de uma saga na ordem certa — o que tag e estante não fazem, porque nelas não existe "volume 2".'
					actions={
						!isCreating ? (
							<button
								onClick={() => setIsCreating(true)}
								className='bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium'
							>
								Criar a primeira
							</button>
						) : null
					}
				/>
			) : (
				<ul className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
					{cards.map(({ collection, progress, covers }) => (
						<li key={collection.recordId}>
							<Link
								to={`/colecoes/${collection.recordId}`}
								className='group block h-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 hover:border-primary-400 dark:hover:border-primary-500 transition-colors'
							>
								<h2 className='font-semibold text-gray-900 dark:text-slate-100 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors'>
									{collection.name}
								</h2>

								{collection.description && (
									<p className='mt-1 text-sm text-gray-600 dark:text-slate-400 line-clamp-2'>
										{collection.description}
									</p>
								)}

								<p className='mt-3 text-sm text-gray-700 dark:text-slate-300'>
									{progress.total === 0
										? 'Nenhum volume ainda'
										: `${progress.read} de ${progress.total} ${progress.total === 1 ? 'lido' : 'lidos'}`}
								</p>

								{progress.total > 0 && (
									<div
										className='mt-2 h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden'
										role='progressbar'
										aria-valuenow={progress.percent}
										aria-valuemin={0}
										aria-valuemax={100}
										aria-label={`Progresso de ${collection.name}`}
									>
										<div
											className='h-full rounded-full bg-emerald-500'
											style={{ width: `${progress.percent}%` }}
										/>
									</div>
								)}

								{covers.length > 0 && (
									<div className='mt-4 flex gap-1.5'>
										{covers.map((book) => (
											<div
												key={book.id}
												className='w-10 aspect-[2/3] rounded bg-gray-100 dark:bg-slate-700 overflow-hidden'
											>
												<BookCover
													src={book.thumbnail}
													title={book.title}
													className='w-full h-full object-cover'
												/>
											</div>
										))}
									</div>
								)}

								{progress.missing > 0 && (
									<p className='mt-3 text-xs text-amber-700 dark:text-amber-400'>
										{progress.missing}{' '}
										{progress.missing === 1 ? 'volume saiu' : 'volumes saíram'} da estante
									</p>
								)}
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default Collections;
