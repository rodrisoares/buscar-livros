import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '@/types/Book';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useTitleSuggestions } from '@/hooks/useTitleSuggestions';
import { filterRecentSearches } from '@/lib/recentSearches';
import { getPublicationYear } from '@/utils/bookLabels';
import BookCover from './BookCover';
import Icon from './Icon';

interface SearchBarProps {
	placeholder?: string;
	size?: 'desktop' | 'tablet' | 'mobile';
	className?: string;
	onSearch?: (value: string) => void;
}

/**
 * Uma opção da lista suspensa.
 *
 * As duas origens convivem numa lista só porque o teclado precisa percorrer
 * tudo com as mesmas setas — dois grupos separados dariam dois índices e um
 * `aria-activedescendant` ambíguo.
 */
type Suggestion =
	| { kind: 'recent'; key: string; term: string }
	| { kind: 'book'; key: string; book: Book };

/** Com livros na lista, o histórico encolhe para o painel não virar uma tela. */
const RECENT_LIMIT_WITH_BOOKS = 3;
const RECENT_LIMIT_ALONE = 6;

const SearchBar: React.FC<SearchBarProps> = ({
	placeholder = 'Busque por assunto, autoria, nome...',
	size = 'desktop',
	className = '',
	onSearch,
}) => {
	const { query, search, clearSearch } = useBookSearch();
	const { recentSearches, remember, forget, clearRecentSearches } = useRecentSearches();
	const navigate = useNavigate();

	const [value, setValue] = useState(query);
	const [isOpen, setIsOpen] = useState(false);
	/** Índice destacado pelas setas; -1 significa "nenhum, vale o que foi digitado". */
	const [activeIndex, setActiveIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Cada barra tem o seu id: o cabeçalho e a página podem coexistir na mesma tela.
	const suggestionsId = `search-suggestions${useId()}`;
	const optionId = (index: number) => `${suggestionsId}-opcao-${index}`;

	// Só filtramos o histórico depois que o usuário para de digitar.
	const debouncedValue = useDebouncedValue(value, 200);

	// Livros de verdade, consultados enquanto se digita. Só com a lista aberta:
	// um campo fora de foco não precisa gastar cota.
	const { books, isLoading: isLoadingBooks, isActive } = useTitleSuggestions(value, isOpen);

	const recentMatches = filterRecentSearches(recentSearches, debouncedValue).slice(
		0,
		books.length > 0 ? RECENT_LIMIT_WITH_BOOKS : RECENT_LIMIT_ALONE
	);

	const suggestions: Suggestion[] = [
		...recentMatches.map((term): Suggestion => ({ kind: 'recent', key: `r:${term}`, term })),
		...books.map((book): Suggestion => ({ kind: 'book', key: `b:${book.id}`, book })),
	];

	const hasPanel = isOpen && (suggestions.length > 0 || isLoadingBooks);

	// Mantém o campo em sincronia com a URL (voltar/avançar, link compartilhado, limpar busca).
	useEffect(() => {
		setValue(query);
	}, [query]);

	// Uma lista nova recomeça sem destaque, senão a seta continuaria de onde parou
	// apontando para outro termo.
	useEffect(() => {
		setActiveIndex(-1);
	}, [debouncedValue, isOpen]);

	// Fecha a lista ao clicar fora.
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen]);

	const runSearch = (term: string) => {
		const trimmed = term.trim();
		if (!trimmed) return;

		setIsOpen(false);
		setActiveIndex(-1);
		remember(trimmed);

		if (onSearch) onSearch(trimmed);
		else search(trimmed);
	};

	const selectSuggestion = (suggestion: Suggestion) => {
		if (suggestion.kind === 'recent') {
			setValue(suggestion.term);
			runSearch(suggestion.term);
			return;
		}

		// Um livro apontado é um destino, não um termo de busca: vai direto para
		// a ficha. E não entra no histórico — "dom casmur" nunca foi uma busca,
		// foi meio caminho até um livro.
		setIsOpen(false);
		setActiveIndex(-1);
		navigate(`/book/${suggestion.book.id}`);
	};

	/**
	 * Setas percorrem as sugestões, Enter usa a destacada (ou o que foi digitado,
	 * quando não há destaque) e Esc fecha. Antes só o mouse alcançava a lista.
	 */
	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Escape') {
			// O preventDefault é o que faz o Esc funcionar: num `input[type=search]`
			// o Escape limpa o campo, essa limpeza dispara o onChange e o onChange
			// reabria a lista que acabáramos de fechar. Fechar sem apagar o que foi
			// digitado também é o comportamento esperado de um combobox — para
			// limpar existe o × ao lado.
			event.preventDefault();
			setIsOpen(false);
			setActiveIndex(-1);
			return;
		}

		const isListVisible = isOpen && suggestions.length > 0;

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			if (!isListVisible) {
				setIsOpen(true);
				return;
			}

			event.preventDefault();
			const step = event.key === 'ArrowDown' ? 1 : -1;
			// O -1 entra na volta: dá para sair da lista e voltar ao texto digitado.
			const total = suggestions.length + 1;
			setActiveIndex((current) => ((current + 1 + step + total) % total) - 1);
			return;
		}

		if (event.key === 'Enter' && isListVisible && activeIndex >= 0) {
			// Sem isto o formulário enviaria o texto digitado, não a sugestão.
			event.preventDefault();
			selectSuggestion(suggestions[activeIndex]);
		}
	};

	const handleClear = () => {
		setValue('');
		setIsOpen(false);
		setActiveIndex(-1);
		// Com uma busca ativa, o × também limpa os resultados.
		if (query) clearSearch();
		inputRef.current?.focus();
	};

	const sizeClasses = {
		desktop: 'w-full h-14 text-lg pl-12 pr-24',
		tablet: 'w-full h-12 text-base pl-11 pr-20',
		mobile: 'w-full h-10 text-sm pl-10 pr-16',
	};

	const iconSizeClasses = { desktop: 'w-5 h-5', tablet: 'w-5 h-5', mobile: 'w-4 h-4' };
	const iconPosition = { desktop: 'left-4', tablet: 'left-3.5', mobile: 'left-3' };

	const groupTitleClasses =
		'px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-gray-600 dark:text-slate-400';

	/** Índice global da opção na lista achatada, para o teclado e o aria. */
	const indexOf = (suggestion: Suggestion) =>
		suggestions.findIndex((item) => item.key === suggestion.key);

	return (
		<div ref={containerRef} className={`relative ${className}`}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					runSearch(value);
				}}
				role='search'
			>
				<div className='relative'>
					<div
						className={`absolute ${iconPosition[size]} top-1/2 -translate-y-1/2 z-10 text-gray-400 dark:text-slate-500 pointer-events-none`}
					>
						<svg
							className={iconSizeClasses[size]}
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
							aria-hidden='true'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
							/>
						</svg>
					</div>

					<input
						ref={inputRef}
						type='search'
						value={value}
						onChange={(e) => {
							setValue(e.target.value);
							setIsOpen(true);
						}}
						onFocus={() => setIsOpen(true)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						aria-label='Buscar livros'
						role='combobox'
						aria-autocomplete='list'
						aria-expanded={isOpen && suggestions.length > 0}
						aria-controls={suggestionsId}
						aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
						autoComplete='off'
						className={`
							${sizeClasses[size]}
							border-2 border-gray-300 dark:border-slate-600 rounded-full
							text-gray-800 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400
							focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900
							shadow-sm hover:shadow-md transition-shadow duration-300
							bg-white dark:bg-slate-800
							[&::-webkit-search-cancel-button]:appearance-none
						`}
					/>

					{/* Limpar a busca no próprio campo, em vez de um botão grande com
					    seta para a esquerda, que se lia como "voltar". */}
					{value && (
						<button
							type='button'
							onClick={handleClear}
							aria-label='Limpar busca'
							title='Limpar busca'
							className='absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors'
						>
							<svg
								className={iconSizeClasses[size]}
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
								aria-hidden='true'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M6 18L18 6M6 6l12 12'
								/>
							</svg>
						</button>
					)}

					<button
						type='submit'
						aria-label='Buscar'
						className='absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full transition-colors duration-300 shadow-sm'
					>
						<svg
							className={iconSizeClasses[size]}
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
							aria-hidden='true'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
							/>
						</svg>
					</button>
				</div>
			</form>

			{hasPanel && (
				<div className='absolute z-30 mt-2 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden text-left'>
					{/* O <li> de título fica como apresentação: o filho da listbox
					    precisa ser a opção em si, e o ✕ é um botão à parte, fora dela. */}
					<ul id={suggestionsId} role='listbox' aria-label='Sugestões de busca'>
						{recentMatches.length > 0 && (
							<li role='presentation' className={groupTitleClasses}>
								Buscas recentes
							</li>
						)}

						{suggestions
							.filter((item): item is Extract<Suggestion, { kind: 'recent' }> => item.kind === 'recent')
							.map((item) => {
								const index = indexOf(item);

								return (
									<li key={item.key} role='presentation' className='flex items-center'>
										<button
											type='button'
											role='option'
											id={optionId(index)}
											aria-selected={index === activeIndex}
											onClick={() => selectSuggestion(item)}
											onMouseEnter={() => setActiveIndex(index)}
											className={`focus-inset flex-1 text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-200 truncate ${
												index === activeIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
											}`}
										>
											{item.term}
										</button>
										<button
											type='button'
											onClick={() => forget(item.term)}
											aria-label={`Remover "${item.term}" do histórico`}
											className='focus-inset px-3 py-2 text-gray-400 hover:text-red-500 transition-colors'
										>
											<Icon name='x' className='w-4 h-4' />
										</button>
									</li>
								);
							})}

						{books.length > 0 && (
							<li
								role='presentation'
								className={`${groupTitleClasses} ${recentMatches.length > 0 ? 'border-t border-gray-100 dark:border-slate-700' : ''}`}
							>
								Livros
							</li>
						)}

						{suggestions
							.filter((item): item is Extract<Suggestion, { kind: 'book' }> => item.kind === 'book')
							.map((item) => {
								const index = indexOf(item);
								const { book } = item;
								const year = getPublicationYear(book.publishedDate);
								const meta = [book.author, year].filter(Boolean).join(' · ');

								return (
									<li key={item.key} role='presentation'>
										<button
											type='button'
											role='option'
											id={optionId(index)}
											aria-selected={index === activeIndex}
											onClick={() => selectSuggestion(item)}
											onMouseEnter={() => setActiveIndex(index)}
											className={`focus-inset w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
												index === activeIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
											}`}
										>
											<div className='w-8 shrink-0 aspect-[2/3] rounded bg-gray-100 dark:bg-slate-700 overflow-hidden'>
												<BookCover
													src={book.thumbnail}
													title={book.title}
													className='w-full h-full object-cover'
												/>
											</div>
											<span className='min-w-0 flex-1'>
												<span className='block text-sm text-gray-800 dark:text-slate-100 truncate'>
													{book.title}
												</span>
												{meta && (
													<span className='block text-xs text-gray-600 dark:text-slate-400 truncate'>
														{meta}
													</span>
												)}
											</span>
										</button>
									</li>
								);
							})}
					</ul>

					{/* Fora da listbox: é aviso de carregamento, não uma opção escolhível. */}
					{isLoadingBooks && (
						<p
							role='status'
							className='px-4 py-2 text-xs text-gray-600 dark:text-slate-400 border-t border-gray-100 dark:border-slate-700'
						>
							Procurando livros...
						</p>
					)}

					{recentMatches.length > 0 && (
						<button
							type='button'
							onClick={clearRecentSearches}
							className='focus-inset w-full text-left px-4 py-2 text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-100 dark:border-slate-700'
						>
							Limpar histórico
						</button>
					)}

					{/* Nada encontrado, mas o campo já tem texto suficiente: dizer isso
					    evita a leitura de que a busca está travada. */}
					{isActive && !isLoadingBooks && books.length === 0 && recentMatches.length === 0 && (
						<p className='px-4 py-3 text-sm text-gray-600 dark:text-slate-400'>
							Nenhum livro encontrado com esse começo. Enter busca no acervo inteiro.
						</p>
					)}
				</div>
			)}
		</div>
	);
};

export default SearchBar;
