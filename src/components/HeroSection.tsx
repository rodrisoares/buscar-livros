import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import BookIllustration from './BookIllustration';
import Icon from './Icon';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { FALLBACK_SHORTCUTS, deriveShortcuts } from '@/lib/suggestionThemes';

interface HeroSectionProps {
	onSearch?: (query: string) => void;
	/**
	 * `compact` é a faixa que fica acima dos resultados da busca: mantém a
	 * identidade da tela inicial (título, campo, atalhos) sem a ilustração nem
	 * a altura de tela cheia. Antes, buscar trocava a Home inteira por uma
	 * lista e o usuário perdia a referência de onde estava.
	 */
	variant?: 'full' | 'compact';
	className?: string;
}

/** Poucos chips por fileira: são duas linhas, e o hero não pode virar uma lista. */
const MAX_RECENT_CHIPS = 4;
const MAX_SHORTCUT_CHIPS = 4;

const chipClasses =
	'px-3 py-1 rounded-full border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors';

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, variant = 'full', className = '' }) => {
	const { search } = useBookSearch();
	const { favorites, favoritesCount } = useFavorites();
	const { recentSearches, forget } = useRecentSearches();

	/**
	 * Atalhos para quem chega sem saber o que procurar. Saem da própria estante
	 * — quatro termos fixos no código serviam igual a quem só lê policial e a
	 * quem só lê técnico. Sem estante que dê pista, valem os termos de sempre.
	 */
	const shortcuts = useMemo(() => {
		const derived = deriveShortcuts(favorites);
		return (derived.length > 0 ? derived : FALLBACK_SHORTCUTS).slice(0, MAX_SHORTCUT_CHIPS);
	}, [favorites]);

	const recents = recentSearches.slice(0, MAX_RECENT_CHIPS);

	const handleSearch = (value: string) => {
		if (onSearch) onSearch(value);
		else search(value);
	};

	const isCompact = variant === 'compact';

	const shelfLink = favoritesCount > 0 && (
		<Link
			to='/favorites'
			className='inline-flex items-center gap-2 text-primary-700 dark:text-primary-300 font-medium hover:underline underline-offset-4'
		>
			Ver minha estante ({favoritesCount})
			<span aria-hidden='true'>→</span>
		</Link>
	);

	return (
		<section
			className={
				isCompact
					? `bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-8 ${className}`
					: // Meia tela no celular, onde a ilustração não aparece: 70vh deixava
						// a primeira dobra quase vazia, só com o campo de busca no meio.
						`bg-gray-50 dark:bg-slate-900 min-h-[50vh] lg:min-h-[70vh] flex flex-col justify-center px-6 py-10 lg:py-12 ${className}`
			}
		>
			<div className={isCompact ? 'max-w-6xl mx-auto w-full' : 'max-w-7xl mx-auto w-full'}>
				<div className={isCompact ? '' : 'grid lg:grid-cols-2 gap-10 lg:gap-16 items-center'}>
					{/* Coluna do texto e da busca */}
					<div className={isCompact ? '' : 'text-center lg:text-left'}>
						<h1
							className={`font-bold text-secondary-600 dark:text-secondary-400 leading-tight ${
								isCompact ? 'text-2xl lg:text-3xl mb-4' : 'text-3xl sm:text-4xl lg:text-5xl mb-4'
							}`}
						>
							Que livro você procura?
						</h1>

						{/* Sem <br /> forçado: a medida de linha controla a quebra. */}
						{!isCompact && (
							<p className='text-lg lg:text-xl text-slate-700 dark:text-slate-300 mb-6 lg:mb-8 max-w-[38ch] mx-auto lg:mx-0'>
								Busque no acervo do Google Books e monte sua estante: o que você quer ler, está
								lendo e já leu.
							</p>
						)}

						<SearchBar
							placeholder='Busque por assunto, autoria, nome...'
							size={isCompact ? 'tablet' : 'desktop'}
							onSearch={onSearch ? handleSearch : undefined}
							className={isCompact ? 'w-full max-w-xl' : 'w-full max-w-lg mx-auto lg:mx-0'}
						/>

						{/* Caminhos para quem não sabe por onde começar.
						    As recentes vêm primeiro: quem já buscou quer repetir; quem
						    nunca buscou só vê a fileira de sugestões. Elas existiam só
						    dentro do dropdown do campo, invisíveis até clicar nele. */}
						<div
							className={`space-y-2 ${isCompact ? 'mt-4' : 'mt-5'} ${
								isCompact ? '' : 'flex flex-col items-center lg:items-start'
							}`}
						>
							{recents.length > 0 && (
								<div className='flex flex-wrap items-center gap-2'>
									<span className='text-sm text-gray-600 dark:text-slate-400'>Recentes:</span>
									{recents.map((term) => (
										<span
											key={term}
											className='inline-flex items-center rounded-full border border-gray-300 dark:border-slate-600 overflow-hidden'
										>
											<button
												type='button'
												onClick={() => handleSearch(term)}
												className='focus-inset pl-3 pr-1.5 py-1 text-sm text-gray-700 dark:text-slate-300 hover:text-primary-700 dark:hover:text-primary-300 transition-colors max-w-[12rem] truncate'
											>
												{term}
											</button>
											<button
												type='button'
												onClick={() => forget(term)}
												aria-label={`Remover "${term}" do histórico`}
												className='focus-inset pr-2 pl-0.5 py-1 text-gray-400 hover:text-red-500 transition-colors'
											>
												<Icon name='x' className='w-3.5 h-3.5' />
											</button>
										</span>
									))}
								</div>
							)}

							<div className='flex flex-wrap items-center gap-2'>
								<span className='text-sm text-gray-600 dark:text-slate-400'>Sugestões:</span>
								{shortcuts.map((term) => (
									<button
										key={term}
										type='button'
										onClick={() => handleSearch(term)}
										className={chipClasses}
									>
										{term}
									</button>
								))}
							</div>
						</div>

						{/* O atalho para a estante vale nas duas variantes: sumir dele
						    justamente quando o usuário está buscando era o contrário do
						    que ele precisa. */}
						{shelfLink && (
							<div className={isCompact ? 'mt-4' : 'mt-6'}>{shelfLink}</div>
						)}
					</div>

					{/* Coluna da ilustração — agora dentro da primeira tela */}
					{!isCompact && (
						<div className='hidden lg:flex justify-center lg:justify-end'>
							<BookIllustration className='w-full max-w-md' />
						</div>
					)}
				</div>
			</div>
		</section>
	);
};

export default HeroSection;
