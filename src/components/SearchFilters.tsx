import React, { useEffect, useId, useState } from 'react';
import {
	AVAILABILITY_LABELS,
	EMPTY_FILTERS,
	LANGUAGE_OPTIONS,
	PRINT_TYPE_LABELS,
	type Availability,
	type PrintType,
	type SearchFilters as Filters,
} from '@/lib/searchQuery';
import Icon from './Icon';

interface SearchFiltersProps {
	filters: Filters;
	activeCount: number;
	onApply: (filters: Filters) => void;
	/** Autorias já vistas nos resultados e na estante, para o campo sugerir. */
	authorOptions?: string[];
	subjectOptions?: string[];
	className?: string;
}

const fieldClasses =
	'w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent';

const labelClasses =
	'block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1';

/** Painel de filtros que usa os operadores nativos da Google Books API. */
const SearchFilters: React.FC<SearchFiltersProps> = ({
	filters,
	activeCount,
	onApply,
	authorOptions = [],
	subjectOptions = [],
	className = '',
}) => {
	const [isOpen, setIsOpen] = useState(activeCount > 0);
	const [draft, setDraft] = useState<Filters>(filters);

	// Ids próprios: pode haver mais de um painel montado na mesma página.
	const uid = useId();
	const authorListId = `sugestoes-autor${uid}`;
	const subjectListId = `sugestoes-assunto${uid}`;

	// A URL é a fonte da verdade: mudou lá, o rascunho acompanha.
	useEffect(() => {
		setDraft(filters);
	}, [filters]);

	const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
		setDraft((current) => ({ ...current, [key]: value }));

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onApply(draft);
		setIsOpen(false);
	};

	const handleClear = () => {
		const cleared = { ...EMPTY_FILTERS, term: draft.term };
		setDraft(cleared);
		onApply(cleared);
	};

	return (
		<div className={className}>
			<button
				type='button'
				onClick={() => setIsOpen((open) => !open)}
				aria-expanded={isOpen}
				aria-controls='painel-filtros'
				className='inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors'
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
						d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
					/>
				</svg>
				Busca avançada
				{activeCount > 0 && (
					<span className='inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary-600 text-white text-xs'>
						{activeCount}
					</span>
				)}
				<Icon
					name='chevron-down'
					className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
				/>
			</button>

			{isOpen && (
				<form
					id='painel-filtros'
					onSubmit={handleSubmit}
					className='mt-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm'
				>
					<div className='grid gap-4 sm:grid-cols-2'>
						<div>
							<label htmlFor='filtro-titulo' className={labelClasses}>
								Título contém
							</label>
							<input
								id='filtro-titulo'
								type='text'
								value={draft.title}
								onChange={(e) => update('title', e.target.value)}
								placeholder='ex.: o hobbit'
								className={fieldClasses}
							/>
						</div>

						<div>
							<label htmlFor='filtro-autor' className={labelClasses}>
								Autoria
							</label>
							<input
								id='filtro-autor'
								type='text'
								value={draft.author}
								onChange={(e) => update('author', e.target.value)}
								placeholder='ex.: tolkien'
								list={authorOptions.length > 0 ? authorListId : undefined}
								className={fieldClasses}
							/>
							{authorOptions.length > 0 && (
								<datalist id={authorListId}>
									{authorOptions.map((option) => (
										<option key={option} value={option} />
									))}
								</datalist>
							)}
						</div>

						<div>
							<label htmlFor='filtro-assunto' className={labelClasses}>
								Assunto
							</label>
							<input
								id='filtro-assunto'
								type='text'
								value={draft.subject}
								onChange={(e) => update('subject', e.target.value)}
								placeholder='ex.: fantasia'
								list={subjectOptions.length > 0 ? subjectListId : undefined}
								className={fieldClasses}
							/>
							{subjectOptions.length > 0 && (
								<datalist id={subjectListId}>
									{subjectOptions.map((option) => (
										<option key={option} value={option} />
									))}
								</datalist>
							)}
						</div>

						<div>
							<label htmlFor='filtro-isbn' className={labelClasses}>
								ISBN
							</label>
							<input
								id='filtro-isbn'
								type='text'
								inputMode='numeric'
								value={draft.isbn}
								onChange={(e) => update('isbn', e.target.value)}
								placeholder='ex.: 9780261102217'
								className={fieldClasses}
							/>
						</div>

						<div>
							<label htmlFor='filtro-idioma' className={labelClasses}>
								Idioma
							</label>
							<select
								id='filtro-idioma'
								value={draft.lang}
								onChange={(e) => update('lang', e.target.value)}
								className={fieldClasses}
							>
								{LANGUAGE_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor='filtro-disponibilidade' className={labelClasses}>
								Disponibilidade
							</label>
							<select
								id='filtro-disponibilidade'
								value={draft.availability}
								onChange={(e) => update('availability', e.target.value as Availability)}
								className={fieldClasses}
							>
								{(Object.keys(AVAILABILITY_LABELS) as Availability[]).map((value) => (
									<option key={value} value={value}>
										{AVAILABILITY_LABELS[value]}
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor='filtro-tipo' className={labelClasses}>
								Tipo de publicação
							</label>
							<select
								id='filtro-tipo'
								value={draft.printType}
								onChange={(e) => update('printType', e.target.value as PrintType)}
								className={fieldClasses}
							>
								{(Object.keys(PRINT_TYPE_LABELS) as PrintType[]).map((value) => (
									<option key={value} value={value}>
										{PRINT_TYPE_LABELS[value]}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className='mt-5 flex flex-wrap items-center gap-3'>
						<button
							type='submit'
							className='bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors'
						>
							Aplicar filtros
						</button>
						<button
							type='button'
							onClick={handleClear}
							className='text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 underline underline-offset-2'
						>
							Limpar filtros
						</button>
					</div>
				</form>
			)}
		</div>
	);
};

export default SearchFilters;
