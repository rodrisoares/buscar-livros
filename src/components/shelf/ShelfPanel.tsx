import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Book, FavoriteBook } from '@/types/Book';
import { useFavorites } from '@/hooks/useFavorites';
import { useCustomShelves } from '@/hooks/useCustomShelves';
import { useCollections } from '@/hooks/useCollections';
import { SHELF_COLOR_CLASSES } from '@/types/CustomShelf';
import Icon from '@/components/Icon';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import ShelfStatusSelect from './ShelfStatusSelect';
import RatingInput from './RatingInput';
import ReadingProgress from './ReadingProgress';
import ReadingDates from './ReadingDates';
import TagInput from './TagInput';

interface ShelfPanelProps {
	book: Book;
	favorite: FavoriteBook | undefined;
}

/**
 * Painel de acompanhamento na página de detalhes: estante, progresso, nota,
 * anotações e tags. Só aparece depois que o livro entra na estante.
 */
const ShelfPanel: React.FC<ShelfPanelProps> = ({ book, favorite }) => {
	const { favorites, setStatus, updateShelf, recordProgress, isUpdatingBook } = useFavorites();
	const { shelves: customShelves, toggleBookShelf } = useCustomShelves();
	const { collections, toggleBook } = useCollections();
	// O painel trava apenas enquanto este livro está sendo salvo.
	const isSaving = isUpdatingBook(book.id);
	const [notes, setNotes] = useState(favorite?.notes ?? '');
	const debouncedNotes = useDebouncedValue(notes, 800);

	/**
	 * Se o campo já recebeu algo do teclado.
	 *
	 * Sem esta trava o salvamento automático apagava as anotações do livro: o
	 * painel monta antes de a estante carregar, então o campo começa vazio e o
	 * valor com atraso do debounce continua vazio por mais um instante. Quando o
	 * favorito chegava com texto, o efeito via "vazio diferente do servidor" e
	 * gravava o vazio por cima. A gravação invalidava a consulta, o favorito
	 * voltava, e os dois valores passavam a se sobrescrever em laço até o React
	 * interromper a árvore.
	 */
	const hasTyped = useRef(false);
	const currentRecord = useRef(favorite?.recordId);
	/** Último texto enviado, para não reenviar o mesmo enquanto ele não volta. */
	const lastSent = useRef<string | null>(null);

	/**
	 * Mantém o campo em dia com o servidor sem atropelar quem está digitando.
	 *
	 * Trocar de livro recomeça do zero — a rota `/book/:id` troca o parâmetro
	 * sem desmontar o painel, então o texto do livro anterior ficaria no campo.
	 * No mesmo livro, o que vem do servidor (ou de outra aba) só entra enquanto
	 * ninguém escreveu nada.
	 */
	useEffect(() => {
		const fromServer = favorite?.notes ?? '';
		const changedBook = currentRecord.current !== favorite?.recordId;

		if (changedBook) {
			currentRecord.current = favorite?.recordId;
			hasTyped.current = false;
			lastSent.current = null;
		}

		if (changedBook || !hasTyped.current) setNotes(fromServer);
	}, [favorite?.recordId, favorite?.notes]);

	/**
	 * Salva sozinho, sem exigir um botão "salvar" — mas só o que foi digitado, e
	 * cada texto uma vez só.
	 *
	 * A guarda do `lastSent` é o que impede o efeito de reenviar enquanto a
	 * gravação não volta pela releitura da estante: `favorite` ganha referência
	 * nova a cada releitura, o efeito roda de novo, e comparar apenas com
	 * `favorite.notes` faria a mesma escrita sair repetidas vezes.
	 */
	useEffect(() => {
		if (!favorite || !hasTyped.current) return;
		if (debouncedNotes === favorite.notes) return;
		if (debouncedNotes === lastSent.current) return;

		lastSent.current = debouncedNotes;
		updateShelf(favorite.id, { notes: debouncedNotes });
	}, [debouncedNotes, favorite, updateShelf]);

	if (!favorite) {
		/**
		 * Só o aviso, sem botões.
		 *
		 * Aqui existiam três botões de estante que repetiam — e contradiziam — o
		 * controle da barra de ações lá em cima: o de cima guardava em "Quero
		 * ler", os daqui ofereciam as três estantes. Eram duas respostas para a
		 * mesma pergunta, a meia tela de distância. A escolha agora mora num
		 * lugar só, e este bloco apenas diz o que ela destrava.
		 */
		return (
			<div className='rounded-xl border border-dashed border-gray-300 dark:border-slate-600 p-6 text-center'>
				<p className='text-gray-600 dark:text-slate-400'>
					Adicione este livro à sua estante para acompanhar a leitura, dar uma nota e escrever
					anotações.
				</p>
			</div>
		);
	}

	// Sugestões de tag: tudo que o usuário já usou nos outros livros.
	const tagSuggestions = [...new Set(favorites.flatMap((item) => item.tags))];

	return (
		<div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-6 space-y-6'>
			<div className='flex flex-wrap items-center justify-between gap-4'>
				<h2 className='text-xl font-semibold text-gray-900 dark:text-slate-100'>
					Minha leitura
				</h2>
				<ShelfStatusSelect
					value={favorite.status}
					disabled={isSaving}
					onChange={(status) => setStatus(book, status)}
				/>
			</div>

			<ReadingProgress
				book={favorite}
				disabled={isSaving}
				// `recordProgress` em vez de `updateShelf`: a página não é só um
				// campo, é uma marcação no histórico de leitura.
				onChange={(currentPage) => recordProgress(favorite.id, currentPage)}
			/>

			<ReadingDates
				book={favorite}
				disabled={isSaving}
				onChange={(patch) => updateShelf(favorite.id, patch)}
			/>

			<div>
				<h3 className='text-sm font-medium text-gray-700 dark:text-slate-300 mb-2'>
					Minha nota
				</h3>
				<RatingInput
					value={favorite.rating}
					disabled={isSaving}
					onChange={(rating) => updateShelf(favorite.id, { rating })}
				/>
			</div>

			<div>
				<label
					htmlFor='book-notes'
					className='block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2'
				>
					Anotações
				</label>
				<textarea
					id='book-notes'
					rows={4}
					value={notes}
					onChange={(e) => {
						hasTyped.current = true;
						setNotes(e.target.value);
					}}
					placeholder='O que você achou? Trechos, ideias, o que quiser.'
					className='w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y'
				/>
				<p className='mt-1 text-xs text-gray-600 dark:text-slate-400'>
					Salvo automaticamente.
				</p>
			</div>

			{customShelves.length > 0 && (
				<div>
					<h3 className='text-sm font-medium text-gray-700 dark:text-slate-300 mb-2'>
						Minhas estantes
					</h3>
					{/* Caixas, e não um seletor: o livro pode estar em várias ao mesmo
					    tempo, e em nenhuma delas sem deixar de estar em "Lendo". */}
					<div className='flex flex-wrap gap-2'>
						{customShelves.map((shelf) => {
							const isIn = favorite.shelves.includes(shelf.recordId);

							return (
								<label
									key={shelf.recordId}
									className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
										isIn
											? SHELF_COLOR_CLASSES[shelf.color]
											: 'border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-primary-400'
									}`}
								>
									<input
										type='checkbox'
										checked={isIn}
										disabled={isSaving}
										onChange={() => toggleBookShelf(favorite.id, shelf.recordId)}
										className='w-3.5 h-3.5 accent-primary-600'
									/>
									<Icon name={shelf.icon} className='w-3.5 h-3.5' />
									{shelf.name}
								</label>
							);
						})}
					</div>
				</div>
			)}

			{collections.length > 0 && (
				<div>
					<h3 className='text-sm font-medium text-gray-700 dark:text-slate-300 mb-2'>
						Coleções
					</h3>
					<div className='flex flex-wrap gap-2'>
						{collections.map((collection) => {
							const isIn = collection.bookIds.includes(favorite.id);

							return (
								<label
									key={collection.recordId}
									className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
										isIn
											? 'bg-primary-100 dark:bg-primary-950 text-primary-800 dark:text-primary-200'
											: 'border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-primary-400'
									}`}
								>
									<input
										type='checkbox'
										checked={isIn}
										disabled={isSaving}
										onChange={() => toggleBook(collection, favorite.id)}
										className='w-3.5 h-3.5 accent-primary-600'
									/>
									<Icon name='library' className='w-3.5 h-3.5' />
									{collection.name}
								</label>
							);
						})}
					</div>
					{/* A ordem dos volumes se ajusta na página da coleção; aqui só se
					    decide se o livro pertence a ela. */}
					<Link
						to='/colecoes'
						className='mt-2 inline-block text-xs text-primary-700 dark:text-primary-300 hover:underline underline-offset-4'
					>
						Organizar a ordem dos volumes →
					</Link>
				</div>
			)}

			<div>
				<h3 className='text-sm font-medium text-gray-700 dark:text-slate-300 mb-2'>
					Tags
				</h3>
				<TagInput
					tags={favorite.tags}
					disabled={isSaving}
					suggestions={tagSuggestions}
					onChange={(tags) => updateShelf(favorite.id, { tags })}
				/>
			</div>
		</div>
	);
};

export default ShelfPanel;
