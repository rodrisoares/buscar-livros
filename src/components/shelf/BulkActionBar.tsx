import React, { useState } from 'react';
import { SHELF_ICONS, SHELF_LABELS, SHELF_STATUSES, type ShelfStatus } from '@/types/Shelf';
import type { CustomShelf } from '@/types/CustomShelf';
import Dropdown from '@/components/Dropdown';
import Icon from '@/components/Icon';

interface BulkActionBarProps {
	count: number;
	totalVisible: number;
	isAllSelected: boolean;
	disabled?: boolean;
	tagSuggestions: string[];
	customShelves: CustomShelf[];
	onSelectAll: () => void;
	onClear: () => void;
	onSetStatus: (status: ShelfStatus) => void;
	onTag: (tag: string, mode: 'add' | 'remove') => void;
	onToggleShelf: (shelfId: string, shelfName: string, mode: 'add' | 'remove') => void;
	onRemove: () => void;
}

const actionButton =
	'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const menuItem =
	'focus-inset w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors';

/**
 * Barra das ações em lote.
 *
 * Fica `sticky` no rodapé do conteúdo, e não `fixed` na janela: assim ela não
 * disputa espaço com o botão de voltar ao topo nem com os toasts, e some
 * naturalmente quando a lista acaba.
 */
const BulkActionBar: React.FC<BulkActionBarProps> = ({
	count,
	totalVisible,
	isAllSelected,
	disabled = false,
	tagSuggestions,
	customShelves,
	onSelectAll,
	onClear,
	onSetStatus,
	onTag,
	onToggleShelf,
	onRemove,
}) => {
	const [confirmingRemoval, setConfirmingRemoval] = useState(false);
	const [tagDraft, setTagDraft] = useState('');

	const applyTag = (tag: string, mode: 'add' | 'remove', close: () => void) => {
		const value = tag.trim();
		if (!value) return;

		onTag(value, mode);
		setTagDraft('');
		close();
	};

	return (
		<div
			className='sticky bottom-4 z-30 mt-6'
			role='region'
			// O marcador é lido pelo CSS: no celular o botão de voltar ao topo se
			// esconde enquanto esta barra está na tela, senão os dois brigam pelo
			// mesmo canto (ver a regra em index.css).
			data-barra-lote
			aria-label={`Ações para ${count} ${count === 1 ? 'livro selecionado' : 'livros selecionados'}`}
		>
			<div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl px-4 py-3 flex flex-wrap items-center gap-3'>
				<p className='text-sm font-medium text-gray-900 dark:text-slate-100' aria-live='polite'>
					{count} {count === 1 ? 'selecionado' : 'selecionados'}
				</p>

				<button
					type='button'
					onClick={isAllSelected ? onClear : onSelectAll}
					className='text-sm text-primary-700 dark:text-primary-300 hover:underline underline-offset-4'
				>
					{isAllSelected ? 'Limpar seleção' : `Selecionar os ${totalVisible}`}
				</button>

				<div className='flex-1' />

				{confirmingRemoval ? (
					<div className='flex items-center gap-2'>
						<span className='text-sm text-gray-700 dark:text-slate-300'>
							Remover {count} da estante?
						</span>
						<button
							type='button'
							disabled={disabled}
							onClick={() => {
								onRemove();
								setConfirmingRemoval(false);
							}}
							className={`${actionButton} bg-red-600 text-white hover:bg-red-700`}
						>
							Confirmar
						</button>
						<button
							type='button'
							onClick={() => setConfirmingRemoval(false)}
							className={`${actionButton} border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700`}
						>
							Cancelar
						</button>
					</div>
				) : (
					<div className='flex flex-wrap items-center gap-2'>
						{/* Cada menu ancora pelo lado que cabe: "Mover para" é o primeiro
						    botão da linha e, alinhado à direita, o painel vazaria pela
						    borda esquerda no celular. "Tags" é o oposto — fica à direita
						    e o painel, mais largo, precisa crescer para a esquerda. */}
						<Dropdown
							align='left'
							direction='up'
							disabled={disabled}
							panelClassName='w-52'
							triggerClassName={`${actionButton} bg-primary-600 text-white hover:bg-primary-700`}
							trigger={
								<>
									<Icon name='library' className='w-4 h-4' />
									Mover para
									<Icon name='chevron-down' className='w-4 h-4' />
								</>
							}
						>
							{(close) => (
								<div role='menu' aria-label='Mover para a estante'>
									{SHELF_STATUSES.map((status) => (
										<button
											key={status}
											type='button'
											role='menuitem'
											onClick={() => {
												onSetStatus(status);
												close();
											}}
											className={menuItem}
										>
											<Icon name={SHELF_ICONS[status]} className='w-4 h-4 shrink-0' />
											{SHELF_LABELS[status]}
										</button>
									))}
								</div>
							)}
						</Dropdown>

						{customShelves.length > 0 && (
							<Dropdown
								align='right'
								direction='up'
								disabled={disabled}
								panelClassName='w-64'
								triggerClassName={`${actionButton} border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700`}
								trigger={
									<>
										<Icon name='bookmark' className='w-4 h-4' />
										Minhas estantes
										<Icon name='chevron-down' className='w-4 h-4' />
									</>
								}
							>
								{(close) => (
									<div role='menu' aria-label='Minhas estantes'>
										{customShelves.map((shelf) => (
											<div
												key={shelf.recordId}
												className='flex items-center border-b border-gray-100 dark:border-slate-700 last:border-0'
											>
												<span className='flex-1 flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 truncate'>
													<Icon name={shelf.icon} className='w-4 h-4 shrink-0' />
													{shelf.name}
												</span>
												{/* Pôr e tirar no mesmo lugar: a seleção pode misturar
												    livros que já estão na estante com outros que não. */}
												<button
													type='button'
													role='menuitem'
													onClick={() => {
														onToggleShelf(shelf.recordId, shelf.name, 'add');
														close();
													}}
													aria-label={`Pôr os selecionados em ${shelf.name}`}
													className='focus-inset px-2 py-2 text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline'
												>
													Pôr
												</button>
												<button
													type='button'
													role='menuitem'
													onClick={() => {
														onToggleShelf(shelf.recordId, shelf.name, 'remove');
														close();
													}}
													aria-label={`Tirar os selecionados de ${shelf.name}`}
													className='focus-inset px-3 py-2 text-xs text-gray-600 dark:text-slate-400 hover:underline'
												>
													Tirar
												</button>
											</div>
										))}
									</div>
								)}
							</Dropdown>
						)}

						<Dropdown
							align='right'
							direction='up'
							disabled={disabled}
							panelClassName='w-72'
							triggerClassName={`${actionButton} border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700`}
							trigger={
								<>
									<Icon name='tag' className='w-4 h-4' />
									Tags
									<Icon name='chevron-down' className='w-4 h-4' />
								</>
							}
						>
							{(close) => (
								<div className='p-4 space-y-3'>
									<label
										htmlFor='tag-em-lote'
										className='block text-sm font-medium text-gray-700 dark:text-slate-300'
									>
										Tag para aplicar ou retirar
									</label>
									<input
										id='tag-em-lote'
										type='text'
										value={tagDraft}
										autoFocus
										onChange={(event) => setTagDraft(event.target.value)}
										onKeyDown={(event) => {
											if (event.key !== 'Enter') return;
											event.preventDefault();
											applyTag(tagDraft, 'add', close);
										}}
										placeholder='ex.: releitura'
										className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent'
									/>

									<div className='flex gap-2'>
										<button
											type='button'
											disabled={!tagDraft.trim()}
											onClick={() => applyTag(tagDraft, 'add', close)}
											className={`${actionButton} flex-1 justify-center bg-secondary-600 text-white hover:bg-secondary-700`}
										>
											Aplicar
										</button>
										<button
											type='button'
											disabled={!tagDraft.trim()}
											onClick={() => applyTag(tagDraft, 'remove', close)}
											className={`${actionButton} flex-1 justify-center border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700`}
										>
											Retirar
										</button>
									</div>

									{tagSuggestions.length > 0 && (
										<div className='flex flex-wrap gap-1.5 pt-1'>
											{tagSuggestions.slice(0, 8).map((tag) => (
												<button
													key={tag}
													type='button'
													onClick={() => setTagDraft(tag)}
													className='px-2 py-1 rounded-full border border-gray-300 dark:border-slate-600 text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
												>
													{tag}
												</button>
											))}
										</div>
									)}
								</div>
							)}
						</Dropdown>

						<button
							type='button'
							disabled={disabled}
							onClick={() => setConfirmingRemoval(true)}
							className={`${actionButton} border border-red-300 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950`}
						>
							<Icon name='trash' className='w-4 h-4' />
							Remover
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default BulkActionBar;
