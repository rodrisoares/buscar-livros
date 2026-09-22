import React, { useState } from 'react';
import { normalizeForSearch } from '@/utils/normalize';
import Dropdown from '@/components/Dropdown';
import Icon from '@/components/Icon';

interface ShelfTagFilterProps {
	allTags: string[];
	selected: string[];
	/** Quantos livros sobrariam ao somar esta tag ao filtro atual. */
	countFor: (tag: string) => number;
	onToggle: (tag: string) => void;
	onClear: () => void;
	className?: string;
}

/** Acima disso a lista de tags ganha um campo de busca própria. */
const SEARCHABLE_FROM = 8;

/**
 * Filtro de tags cumulativo.
 *
 * Era um `<select>` de uma tag só, então "fantasia" e "relidos" ao mesmo tempo
 * não existia. As tags combinam com E: cada uma escolhida estreita mais a
 * lista, e o número ao lado antecipa quanto sobra — as que zerariam a seleção
 * ficam apagadas em vez de virarem uma tela vazia.
 */
const ShelfTagFilter: React.FC<ShelfTagFilterProps> = ({
	allTags,
	selected,
	countFor,
	onToggle,
	onClear,
	className = '',
}) => {
	const [search, setSearch] = useState('');

	const term = normalizeForSearch(search);
	const visibleTags = term
		? allTags.filter((tag) => normalizeForSearch(tag).includes(term))
		: allTags;

	return (
		<Dropdown
			className={className}
			align='left'
			panelClassName='w-72'
			triggerClassName='inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
			trigger={
				<>
					<Icon name='tag' className='w-4 h-4' />
					{selected.length === 0 ? 'Todas as tags' : `${selected.length} tag(s)`}
					<Icon name='chevron-down' className='w-4 h-4' />
				</>
			}
		>
			{() => (
				<div className='max-h-80 overflow-y-auto'>
					{allTags.length >= SEARCHABLE_FROM && (
						<div className='p-3 border-b border-gray-100 dark:border-slate-700'>
							<input
								type='search'
								value={search}
								autoFocus
								onChange={(event) => setSearch(event.target.value)}
								placeholder='Buscar tag...'
								aria-label='Buscar tag'
								className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent'
							/>
						</div>
					)}

					{visibleTags.length === 0 ? (
						<p className='px-4 py-3 text-sm text-gray-600 dark:text-slate-400'>
							Nenhuma tag com esse nome.
						</p>
					) : (
						<ul>
							{visibleTags.map((tag) => {
								const isSelected = selected.includes(tag);
								const count = countFor(tag);
								// Marcar esta tag zeraria a lista: mostramos, mas apagada.
								const isDead = !isSelected && count === 0;

								return (
									<li key={tag}>
										<label
											className={`flex items-center gap-3 px-4 py-2 text-sm cursor-pointer transition-colors ${
												isDead
													? 'text-gray-400 dark:text-slate-600'
													: 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700'
											}`}
										>
											<input
												type='checkbox'
												checked={isSelected}
												onChange={() => onToggle(tag)}
												className='w-4 h-4 accent-primary-600'
											/>
											<span className='flex-1 truncate'>{tag}</span>
											<span className='text-xs tabular-nums'>{count}</span>
										</label>
									</li>
								);
							})}
						</ul>
					)}

					{selected.length > 0 && (
						<button
							type='button'
							onClick={onClear}
							className='focus-inset w-full text-left px-4 py-2 text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-100 dark:border-slate-700'
						>
							Limpar tags
						</button>
					)}
				</div>
			)}
		</Dropdown>
	);
};

export default ShelfTagFilter;
