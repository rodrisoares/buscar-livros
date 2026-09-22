import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MAX_COLLECTION_NAME } from '@/types/Collection';
import { SHELF_BADGE_CLASSES, SHELF_ICONS, SHELF_LABELS } from '@/types/Shelf';
import { useCollections } from '@/hooks/useCollections';
import { useFavorites } from '@/hooks/useFavorites';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getCollectionProgress, listCollectionEntries } from '@/lib/collections';
import { normalizeForSearch } from '@/utils/normalize';
import BookCover from '@/components/BookCover';
import Breadcrumb from '@/components/Breadcrumb';
import EmptyState from '@/components/EmptyState';
import Icon from '@/components/Icon';

const CollectionDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const {
		isLoading,
		findCollection,
		renameCollection,
		removeCollection,
		addBook,
		removeBook,
		moveBook,
	} = useCollections();
	const { favorites } = useFavorites();

	const collection = findCollection(id ?? '');

	useDocumentTitle(isLoading ? null : (collection?.name ?? 'Coleção não encontrada'));

	const [isEditing, setIsEditing] = useState(false);
	const [draftName, setDraftName] = useState('');
	const [draftDescription, setDraftDescription] = useState('');
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const [pickerTerm, setPickerTerm] = useState('');
	const debouncedTerm = useDebouncedValue(pickerTerm, 200);

	const entries = useMemo(
		() => (collection ? listCollectionEntries(collection, favorites) : []),
		[collection, favorites]
	);

	const progress = useMemo(
		() => (collection ? getCollectionProgress(collection, favorites) : null),
		[collection, favorites]
	);

	/** Candidatos: o que está na estante e ainda não entrou nesta coleção. */
	const candidates = useMemo(() => {
		if (!collection) return [];

		const term = normalizeForSearch(debouncedTerm);
		return favorites
			.filter((book) => !collection.bookIds.includes(book.id))
			.filter(
				(book) =>
					!term ||
					normalizeForSearch(book.title).includes(term) ||
					normalizeForSearch(book.author).includes(term)
			)
			.slice(0, 8);
	}, [collection, favorites, debouncedTerm]);

	if (isLoading) {
		return (
			<div className='max-w-4xl mx-auto px-6 py-12' role='status' aria-live='polite'>
				<span className='sr-only'>Carregando a coleção...</span>
				<div className='h-10 w-72 max-w-full rounded bg-gray-200 dark:bg-slate-700 animate-pulse mb-4' />
				<div className='h-4 w-56 rounded bg-gray-200 dark:bg-slate-700 animate-pulse mb-8' />
				<div className='space-y-3'>
					{Array.from({ length: 4 }, (_, index) => (
						<div
							key={index}
							className='h-20 rounded-xl bg-gray-200 dark:bg-slate-700 animate-pulse'
						/>
					))}
				</div>
			</div>
		);
	}

	if (!collection || !progress) {
		return (
			<div className='max-w-4xl mx-auto px-6 py-12'>
				<EmptyState
					icon='library'
					variant='error'
					title='Coleção não encontrada'
					description='Ela pode ter sido apagada, ou o endereço está incorreto.'
					actions={
						<Link
							to='/colecoes'
							className='bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium'
						>
							Ver minhas coleções
						</Link>
					}
				/>
			</div>
		);
	}

	const startEditing = () => {
		setDraftName(collection.name);
		setDraftDescription(collection.description);
		setIsEditing(true);
	};

	const commitEditing = (event: React.FormEvent) => {
		event.preventDefault();
		const trimmed = draftName.trim();
		if (!trimmed) return;

		renameCollection(collection.recordId, {
			name: trimmed,
			description: draftDescription.trim(),
		});
		setIsEditing(false);
	};

	const fieldClasses =
		'w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent';

	return (
		<div className='max-w-4xl mx-auto px-6 py-8'>
			<Breadcrumb
				className='mb-6'
				items={[
					{ label: 'Coleções', to: '/colecoes' },
					{ label: collection.name },
				]}
			/>

			{isEditing ? (
				<form onSubmit={commitEditing} className='mb-8 space-y-3'>
					<input
						type='text'
						value={draftName}
						autoFocus
						maxLength={MAX_COLLECTION_NAME}
						onChange={(event) => setDraftName(event.target.value)}
						aria-label='Nome da coleção'
						className={fieldClasses}
					/>
					<input
						type='text'
						value={draftDescription}
						onChange={(event) => setDraftDescription(event.target.value)}
						placeholder='Descrição (opcional)'
						aria-label='Descrição da coleção'
						className={fieldClasses}
					/>
					<div className='flex items-center gap-3'>
						<button
							type='submit'
							className='px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors'
						>
							Salvar
						</button>
						<button
							type='button'
							onClick={() => setIsEditing(false)}
							className='text-sm text-gray-600 dark:text-slate-400 hover:underline'
						>
							Cancelar
						</button>
					</div>
				</form>
			) : (
				<div className='mb-8 flex flex-wrap items-start justify-between gap-4'>
					<div>
						<h1 className='text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2'>
							{collection.name}
						</h1>
						{collection.description && (
							<p className='text-gray-600 dark:text-slate-400'>{collection.description}</p>
						)}
					</div>

					<div className='flex items-center gap-2'>
						<button
							type='button'
							onClick={startEditing}
							className='px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors'
						>
							Editar
						</button>
						<button
							type='button'
							onClick={() => setConfirmingDelete(true)}
							aria-label={`Apagar a coleção ${collection.name}`}
							className='p-2 rounded-lg text-gray-400 hover:text-red-500 transition-colors'
						>
							<Icon name='trash' className='w-5 h-5' />
						</button>
					</div>
				</div>
			)}

			{confirmingDelete && (
				<div className='mb-8 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-4 flex flex-wrap items-center gap-3'>
					<p className='text-sm text-red-900 dark:text-red-200 flex-1'>
						Apagar "{collection.name}"? Os livros continuam na sua estante — só o agrupamento some.
					</p>
					<button
						type='button'
						onClick={() => {
							removeCollection(collection);
							navigate('/colecoes');
						}}
						className='px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors'
					>
						Apagar
					</button>
					<button
						type='button'
						onClick={() => setConfirmingDelete(false)}
						className='text-sm text-red-900 dark:text-red-200 hover:underline'
					>
						Cancelar
					</button>
				</div>
			)}

			{/* Progresso da saga */}
			<section className='mb-8 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5'>
				<p className='text-sm text-gray-700 dark:text-slate-300 mb-2'>
					{progress.total === 0
						? 'Nenhum volume ainda — use o campo abaixo para montar a saga.'
						: `${progress.read} de ${progress.total} ${progress.total === 1 ? 'volume lido' : 'volumes lidos'}`}
					{progress.reading > 0 && ` · ${progress.reading} em leitura`}
				</p>

				{progress.total > 0 && (
					<div
						className='h-3 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden'
						role='progressbar'
						aria-valuenow={progress.percent}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-label={`Progresso de ${collection.name}`}
					>
						<div
							className='h-full rounded-full bg-emerald-500 transition-[width] duration-500'
							style={{ width: `${progress.percent}%` }}
						/>
					</div>
				)}
			</section>

			{/* Volumes, na ordem */}
			{entries.length > 0 && (
				<ol
					aria-label={`Volumes de ${collection.name}, em ordem`}
					className='mb-8 rounded-xl border border-gray-200 dark:border-slate-700 divide-y divide-gray-200 dark:divide-slate-700 overflow-hidden'
				>
					{entries.map((entry, index) => (
						<li key={entry.bookId} className='flex items-center gap-4 p-4'>
							<span className='w-6 shrink-0 text-center text-sm font-medium text-gray-600 dark:text-slate-400 tabular-nums'>
								{entry.position}
							</span>

							{entry.book ? (
								<>
									<Link
										to={`/book/${entry.book.id}`}
										tabIndex={-1}
										aria-hidden='true'
										className='shrink-0'
									>
										<div className='w-10 aspect-[2/3] rounded bg-gray-100 dark:bg-slate-700 overflow-hidden'>
											<BookCover
												src={entry.book.thumbnail}
												title={entry.book.title}
												className='w-full h-full object-cover'
											/>
										</div>
									</Link>

									<div className='min-w-0 flex-1'>
										<h2 className='text-sm font-medium text-gray-900 dark:text-slate-100 truncate'>
											<Link
												to={`/book/${entry.book.id}`}
												className='hover:text-primary-700 dark:hover:text-primary-300 transition-colors'
											>
												{entry.book.title}
											</Link>
										</h2>
										<p className='text-xs text-gray-600 dark:text-slate-400 truncate'>
											{entry.book.author}
										</p>
									</div>

									<span
										className={`hidden sm:inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-xs ${SHELF_BADGE_CLASSES[entry.book.status]}`}
									>
										<Icon name={SHELF_ICONS[entry.book.status]} className='w-3.5 h-3.5' />
										{SHELF_LABELS[entry.book.status]}
									</span>
								</>
							) : (
								/* O volume saiu da estante: a posição fica, para "falta o 2"
								   continuar visível em vez de a saga se renumerar sozinha. */
								<div className='min-w-0 flex-1'>
									<p className='text-sm text-gray-600 dark:text-slate-400 italic'>
										Volume fora da estante
									</p>
									<p className='text-xs text-gray-500 dark:text-slate-500 truncate'>
										{entry.bookId}
									</p>
								</div>
							)}

							<div className='shrink-0 flex items-center gap-1'>
								<button
									type='button'
									onClick={() => moveBook(collection, index, 'up')}
									disabled={index === 0}
									aria-label={`Mover para a posição ${entry.position - 1}`}
									className='p-1.5 rounded text-gray-500 hover:text-gray-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
								>
									<Icon name='chevron-down' className='w-4 h-4 rotate-180' />
								</button>
								<button
									type='button'
									onClick={() => moveBook(collection, index, 'down')}
									disabled={index === entries.length - 1}
									aria-label={`Mover para a posição ${entry.position + 1}`}
									className='p-1.5 rounded text-gray-500 hover:text-gray-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
								>
									<Icon name='chevron-down' className='w-4 h-4' />
								</button>
								<button
									type='button'
									onClick={() => removeBook(collection, entry.bookId)}
									aria-label={`Tirar da coleção: ${entry.book?.title ?? entry.bookId}`}
									className='p-1.5 rounded text-gray-400 hover:text-red-500 transition-colors'
								>
									<Icon name='x' className='w-4 h-4' />
								</button>
							</div>
						</li>
					))}
				</ol>
			)}

			{/* Acrescentar da estante */}
			<section className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5'>
				<h2 className='text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1'>
					Acrescentar volume
				</h2>
				<p className='text-xs text-gray-600 dark:text-slate-400 mb-3'>
					Só livros que já estão na sua estante — o volume entra no fim e você reordena acima.
				</p>

				<label htmlFor='buscar-volume' className='sr-only'>
					Buscar na estante
				</label>
				<input
					id='buscar-volume'
					type='search'
					value={pickerTerm}
					onChange={(event) => setPickerTerm(event.target.value)}
					placeholder='Título ou autoria...'
					className={fieldClasses}
				/>

				{candidates.length === 0 ? (
					<p className='mt-3 text-sm text-gray-600 dark:text-slate-400'>
						{favorites.length === 0
							? 'Sua estante está vazia. Busque livros e guarde-os primeiro.'
							: 'Nenhum livro da estante fora desta coleção casa com esse texto.'}
					</p>
				) : (
					<ul className='mt-3 divide-y divide-gray-100 dark:divide-slate-700'>
						{candidates.map((book) => (
							<li key={book.id} className='flex items-center gap-3 py-2'>
								<div className='w-8 shrink-0 aspect-[2/3] rounded bg-gray-100 dark:bg-slate-700 overflow-hidden'>
									<BookCover
										src={book.thumbnail}
										title={book.title}
										className='w-full h-full object-cover'
									/>
								</div>
								<div className='min-w-0 flex-1'>
									<p className='text-sm text-gray-800 dark:text-slate-100 truncate'>
										{book.title}
									</p>
									<p className='text-xs text-gray-600 dark:text-slate-400 truncate'>
										{book.author}
									</p>
								</div>
								<button
									type='button'
									onClick={() => addBook(collection, book.id)}
									aria-label={`Acrescentar ${book.title} à coleção`}
									className='shrink-0 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition-colors'
								>
									Acrescentar
								</button>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
};

export default CollectionDetail;
