import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookData } from '@/hooks/useBookData';
import { useFavorites } from '@/hooks/useFavorites';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import BookCover from '@/components/BookCover';
import StarRating from '@/components/StarRating';
import ShareButton from '@/components/ShareButton';
import RelatedBooks from '@/components/RelatedBooks';
import EmptyState from '@/components/EmptyState';
import Breadcrumb from '@/components/Breadcrumb';
import ShelfPanel from '@/components/shelf/ShelfPanel';
import ShelfButton from '@/components/shelf/ShelfButton';
import ReadingSummary from '@/components/shelf/ReadingSummary';
import ExpandableText from '@/components/ExpandableText';
import Icon from '@/components/Icon';
import { SHELF_BADGE_CLASSES, SHELF_ICONS, SHELF_LABELS } from '@/types/Shelf';
import { stripHtml } from '@/utils/html';
import { highResCover } from '@/utils/cover';
import {
	getAvailableFormats,
	getLanguageName,
	getMaturityLabel,
	getSaleabilityLabel,
	getViewabilityLabel,
} from '@/utils/bookLabels';

/**
 * Rótulo e valor lado a lado, em colunas.
 *
 * Era `justify-between`, que joga os dois nos extremos: numa tela larga
 * sobrava um vão enorme no meio e o olho perdia a ligação entre um e outro.
 * Com a largura do rótulo fixa, os valores alinham numa coluna só.
 */
const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
	<div className='grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-4 border-b border-gray-100 dark:border-slate-800 pb-2'>
		<dt className='font-medium text-gray-700 dark:text-slate-300'>{label}</dt>
		<dd className='text-gray-600 dark:text-slate-400'>{value}</dd>
	</div>
);

const BookDetails: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	// `isFavorite`/`toggleFavorite` saíram junto com o coração: quem cuida da
	// estante nesta tela agora é o ShelfButton, que fala direto com useFavorites.
	const { book, isLoading, error, staleNotice } = useBookData(id);
	const { findFavorite } = useFavorites();

	useDocumentTitle(isLoading ? null : (book?.title ?? 'Livro não encontrado'));

	const handleGoBack = () => navigate(-1);

	if (isLoading) {
		return (
			<div className='max-w-7xl mx-auto px-6 py-12'>
				{/* O esqueleto acompanha a grade real (capa estreita à esquerda), senão
				    a tela dá um salto lateral no instante em que os dados chegam. */}
				<div className='animate-pulse' role='status' aria-live='polite'>
					<span className='sr-only'>Carregando detalhes do livro...</span>
					<div className='grid gap-10 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]'>
						<div className='bg-gray-300 dark:bg-slate-700 rounded-lg aspect-[2/3] max-w-xs mx-auto md:max-w-none w-full' />
						<div className='space-y-4'>
							<div className='h-10 bg-gray-300 dark:bg-slate-700 rounded w-3/4'></div>
							<div className='h-6 bg-gray-300 dark:bg-slate-700 rounded w-1/2'></div>
							<div className='h-4 bg-gray-300 dark:bg-slate-700 rounded w-full'></div>
							<div className='h-4 bg-gray-300 dark:bg-slate-700 rounded w-full'></div>
							<div className='h-4 bg-gray-300 dark:bg-slate-700 rounded w-3/4'></div>
							<div className='h-32 bg-gray-300 dark:bg-slate-700 rounded'></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error || !book) {
		return (
			<div className='max-w-7xl mx-auto px-6 py-12'>
				<EmptyState
					icon='book-closed'
					variant='error'
					title='Livro não encontrado'
					description={
						error || 'O livro que você está procurando não existe ou pode ter sido removido.'
					}
					actions={
						<button
							onClick={handleGoBack}
							className='bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium'
						>
							Voltar
						</button>
					}
				/>
			</div>
		);
	}

	const favorite = findFavorite(book.id);
	const description = stripHtml(book.description);
	const formats = getAvailableFormats(book.epubAvailable, book.pdfAvailable);
	const viewabilityLabel = getViewabilityLabel(book.viewability);
	const saleabilityLabel = getSaleabilityLabel(book.saleability);
	const maturityLabel = getMaturityLabel(book.maturityRating);
	const languageName = getLanguageName(book.language);

	// A ficha técnica só traz o que ainda não apareceu acima.
	const technicalRows = [
		book.isbn13 && { label: 'ISBN-13', value: book.isbn13 },
		book.isbn10 && { label: 'ISBN-10', value: book.isbn10 },
		languageName && { label: 'Idioma', value: languageName },
		book.averageRating > 0 && {
			label: 'Avaliação dos leitores',
			value: `${book.averageRating.toFixed(1)} / 5 (${book.ratingsCount})`,
		},
		formats.length > 0 && { label: 'Formatos digitais', value: formats.join(', ') },
		// Vem de accessInfo.viewability — não é mais um "Disponível" fixo.
		viewabilityLabel && { label: 'Disponibilidade', value: viewabilityLabel },
		saleabilityLabel && {
			label: 'Comercialização',
			value: book.price ? `${saleabilityLabel} — ${book.price}` : saleabilityLabel,
		},
		maturityLabel && { label: 'Classificação', value: maturityLabel },
	].filter((row): row is { label: string; value: string } => Boolean(row));

	return (
		<div className='max-w-7xl mx-auto px-6 py-8'>
			{/* "Voltar" e a trilha dividem uma faixa só.
			    Eles não fazem a mesma coisa — o botão desanda o histórico, e é o
			    que devolve os resultados com os filtros e a página intactos; a
			    trilha leva ao início —, mas empilhados em duas linhas coladas
			    liam-se como o mesmo controle repetido. */}
			<nav className='mb-6 flex flex-wrap items-center gap-x-3 gap-y-2' aria-label='Navegação da ficha'>
				<button
					onClick={handleGoBack}
					className='inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-200 hover:text-gray-900 dark:hover:text-white transition-colors'
				>
					<Icon name='arrow-left' className='w-4 h-4' />
					Voltar
				</button>

				<span aria-hidden='true' className='text-gray-300 dark:text-slate-600'>
					|
				</span>

				<Breadcrumb
					items={[
						{ label: 'Início', to: '/' },
						{ label: book.categories[0] ?? 'Livros' },
						{ label: book.title },
					]}
				/>
			</nav>

			{/* Os dados vieram da estante ou de uma busca já carregada: a página
			    abre normalmente e o aviso explica por que pode estar defasada. */}
			{staleNotice && (
				<p
					role='status'
					className='mb-6 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm text-amber-900 dark:text-amber-200'
				>
					{staleNotice}
				</p>
			)}

			{/* A capa deixou de dividir a largura meio a meio com o texto: ela nunca
			    passa de 24rem, e o resto ia para um vão vazio. A coluna estreita
			    devolve esse espaço ao conteúdo — que agora inclui a ficha técnica
			    e o painel de leitura, antes largados em faixas soltas abaixo. */}
			<div className='grid gap-10 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]'>
				{/* No celular a capa deixa de ocupar a tela inteira antes do conteúdo.
				    No desktop ela fica presa no topo enquanto a coluna da direita
				    rola: `self-start` é o que dá folga para o sticky — esticada até
				    o fim da linha da grade, ela não teria para onde correr. */}
				<div className='flex justify-center'>
					<div className='w-full max-w-xs mx-auto md:max-w-none md:sticky md:top-6 md:self-start'>
						{/* zoom=2 dobra a resolução; se falhar, cai para a thumbnail original. */}
						<BookCover
							src={highResCover(book.thumbnail)}
							fallbackSrc={book.thumbnail}
							title={book.title}
							className='w-full h-auto rounded-lg shadow-lg'
						/>
					</div>
				</div>

				<div className='space-y-6'>
					<div>
						{/* O selo fica colado ao título porque é a primeira pergunta de
						    quem volta à ficha: "eu já tenho esse?". O coração ficava no
						    meio da coluna, abaixo da descrição inteira. */}
						<div className='flex flex-wrap items-start justify-between gap-3 mb-2'>
							<h1 className='text-3xl lg:text-4xl font-bold text-gray-900 dark:text-slate-100'>
								{book.title}
							</h1>

							{favorite && (
								<span
									className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${SHELF_BADGE_CLASSES[favorite.status]}`}
								>
									<Icon name={SHELF_ICONS[favorite.status]} className='w-4 h-4' />
									{SHELF_LABELS[favorite.status]}
								</span>
							)}
						</div>
						<p className='text-xl text-gray-600 dark:text-slate-400 mb-4'>por {book.author}</p>

						<StarRating
							rating={book.averageRating}
							ratingsCount={book.ratingsCount}
							className='mb-4'
						/>

						<div className='flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-gray-600 dark:text-slate-300'>
							{book.pageCount > 0 && <span>{book.pageCount} páginas</span>}
							{book.publishedDate && <span>{book.publishedDate}</span>}
							{book.publisher && <span>{book.publisher}</span>}
							{languageName && <span>{languageName}</span>}
						</div>

						<div className='flex flex-wrap gap-2 mb-6'>
							{book.categories.map((category, index) => (
								<span
									key={index}
									className='px-3 py-1 bg-primary-100 dark:bg-primary-950 text-primary-800 dark:text-primary-200 rounded-full text-sm'
								>
									{category}
								</span>
							))}
							{formats.map((format) => (
								<span
									key={format}
									className='px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-full text-sm'
								>
									{format}
								</span>
							))}
							{book.saleability === 'FREE' && (
								<span className='px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 rounded-full text-sm'>
									Gratuito
								</span>
							)}
						</div>
					</div>

					{/* Resumo da leitura antes da descrição — só a faixa, não o painel
					    inteiro: guardar o livro passa a acrescentar uma linha fina, e
					    não a reorganizar meia página. */}
					{favorite && <ReadingSummary book={favorite} />}

					<div>
						<h2 className='text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-3'>
							Descrição
						</h2>
						{/* A API devolve HTML; stripHtml converte para texto e as quebras
						    viram parágrafos. Sinopses de três mil caracteres empurravam
						    tudo o que vem depois para fora da tela, então o texto começa
						    recolhido — e o "ler mais" só aparece quando ele não cabe. */}
						{/* `max-w-prose` segura a linha em ~65 caracteres: a coluna ficou
						    larga e o texto corrido chegava a mais de cem por linha, que é
						    onde o olho começa a perder a volta do parágrafo. */}
						<ExpandableText
							text={description || 'Descrição não disponível.'}
							lines={10}
							className='max-w-prose'
						/>
					</div>

					<div className='border-t border-gray-200 dark:border-slate-700 pt-6'>
						{/* Um único controle de estante na página — ele guarda, move entre
						    as três e remove. O painel "Minha leitura", mais abaixo, cuida
						    só do acompanhamento. */}
						<div className='flex flex-wrap items-center gap-3 mb-6'>
							<ShelfButton book={book} />
							<ShareButton book={book} />
						</div>

						{/* Três faixas de largura total, uma sobre a outra, davam o mesmo
						    peso a ler, comprar e "saber mais". Agora: primária e
						    secundária lado a lado, e a terceira como link de texto. */}
						<div className='max-w-md space-y-3'>
							<div className='flex flex-wrap gap-3'>
								{book.previewLink && (
									<a
										href={book.previewLink}
										target='_blank'
										rel='noopener noreferrer'
										className='flex-1 min-w-40 bg-primary-600 text-white py-3 px-5 rounded-lg hover:bg-primary-700 transition-colors font-medium text-center'
									>
										Visualizar Livro
									</a>
								)}
								{book.buyLink && (
									<a
										href={book.buyLink}
										target='_blank'
										rel='noopener noreferrer'
										className='flex-1 min-w-40 border border-primary-600 text-primary-700 dark:text-primary-300 py-3 px-5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors font-medium text-center'
									>
										{book.price ? `Comprar por ${book.price}` : 'Comprar'}
									</a>
								)}
							</div>

							{book.infoLink && (
								<a
									href={book.infoLink}
									target='_blank'
									rel='noopener noreferrer'
									className='inline-flex items-center gap-1 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 underline underline-offset-4 transition-colors'
								>
									Mais informações no Google Books
									<span aria-hidden='true'>→</span>
								</a>
							)}
						</div>
					</div>

					{/* Acompanhamento de leitura.
					    Vive dentro da coluna, e não numa faixa solta embaixo: é o que
					    dá curso ao sticky da capa — com só o texto acima, a grade
					    acabava logo depois da primeira tela e a capa não chegava a
					    grudar em nada. */}
					<div className='pt-6'>
						<ShelfPanel book={book} favorite={favorite} />
					</div>

					{technicalRows.length > 0 && (
						<div className='border-t border-gray-200 dark:border-slate-700 pt-8'>
							<h2 className='text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-6'>
								Ficha Técnica
							</h2>
							{/* Duas colunas só a partir de xl: na coluna estreita, o rótulo
							    de 9rem não deixaria largura útil para o valor. */}
							<dl className='grid xl:grid-cols-2 gap-x-12 gap-y-3'>
								{technicalRows.map((row) => (
									<DetailRow key={row.label} label={row.label} value={row.value} />
								))}
							</dl>
						</div>
					)}
				</div>
			</div>

			<RelatedBooks book={book} />
		</div>
	);
};

export default BookDetails;
