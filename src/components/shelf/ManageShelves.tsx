import React, { useState } from 'react';
import {
	DEFAULT_SHELF_COLOR,
	DEFAULT_SHELF_ICON,
	MAX_SHELF_NAME,
	SHELF_COLORS,
	SHELF_COLOR_SWATCHES,
	SHELF_ICON_OPTIONS,
	type CustomShelf,
	type ShelfColor,
} from '@/types/CustomShelf';
import type { IconName } from '@/components/Icon';
import { useCustomShelves } from '@/hooks/useCustomShelves';
import Icon from '@/components/Icon';

interface ManageShelvesProps {
	counts: Record<string, number>;
	className?: string;
}

const fieldClasses =
	'px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent';

/** Grade de escolha para ícone e cor — pequena o bastante para caber inteira. */
const Picker = <T extends string>({
	label,
	options,
	value,
	onChange,
	render,
}: {
	label: string;
	options: T[];
	value: T;
	onChange: (value: T) => void;
	render: (option: T, selected: boolean) => React.ReactNode;
}) => (
	<div>
		<span className='block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1'>
			{label}
		</span>
		<div className='flex flex-wrap gap-1.5' role='group' aria-label={label}>
			{options.map((option) => (
				<button
					key={option}
					type='button'
					onClick={() => onChange(option)}
					aria-pressed={value === option}
					aria-label={option}
					className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
						value === option
							? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-900'
							: 'border-gray-300 dark:border-slate-600 hover:border-primary-400'
					}`}
				>
					{render(option, value === option)}
				</button>
			))}
		</div>
	</div>
);

/**
 * Criar, renomear e apagar estantes próprias.
 *
 * Apagar pede confirmação e diz quantos livros perdem o selo — a estante some,
 * mas nenhum livro sai da estante de verdade, porque status e estante
 * personalizada são coisas diferentes.
 */
const ManageShelves: React.FC<ManageShelvesProps> = ({ counts, className = '' }) => {
	const { shelves, isSaving, createShelf, renameShelf, removeShelf } = useCustomShelves();

	const [name, setName] = useState('');
	const [icon, setIcon] = useState<IconName>(DEFAULT_SHELF_ICON);
	const [color, setColor] = useState<ShelfColor>(DEFAULT_SHELF_COLOR);
	const [editing, setEditing] = useState<string | null>(null);
	const [draftName, setDraftName] = useState('');
	const [confirming, setConfirming] = useState<string | null>(null);

	const handleCreate = (event: React.FormEvent) => {
		event.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) return;

		createShelf({ name: trimmed, icon, color });
		setName('');
		setIcon(DEFAULT_SHELF_ICON);
		setColor(DEFAULT_SHELF_COLOR);
	};

	const startEditing = (shelf: CustomShelf) => {
		setEditing(shelf.recordId);
		setDraftName(shelf.name);
		setConfirming(null);
	};

	const commitEditing = (shelf: CustomShelf) => {
		const trimmed = draftName.trim();
		if (trimmed && trimmed !== shelf.name) renameShelf(shelf.recordId, { name: trimmed });
		setEditing(null);
	};

	return (
		<div
			className={`rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 ${className}`}
		>
			<h3 className='text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1'>
				Minhas estantes
			</h3>
			<p className='text-xs text-gray-600 dark:text-slate-400 mb-4'>
				Convivem com "Quero ler", "Lendo" e "Lido" — um livro pode estar em várias ao mesmo tempo.
			</p>

			{shelves.length > 0 && (
				<ul className='mb-5 divide-y divide-gray-100 dark:divide-slate-700'>
					{shelves.map((shelf) => {
						const count = counts[shelf.recordId] ?? 0;

						return (
							<li key={shelf.recordId} className='py-2'>
								{editing === shelf.recordId ? (
									<div className='flex items-center gap-2'>
										<input
											type='text'
											value={draftName}
											autoFocus
											maxLength={MAX_SHELF_NAME}
											onChange={(event) => setDraftName(event.target.value)}
											onKeyDown={(event) => {
												if (event.key === 'Enter') commitEditing(shelf);
												if (event.key === 'Escape') setEditing(null);
											}}
											aria-label={`Novo nome para ${shelf.name}`}
											className={`flex-1 ${fieldClasses}`}
										/>
										<button
											type='button'
											onClick={() => commitEditing(shelf)}
											className='px-3 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700 transition-colors'
										>
											Salvar
										</button>
										<button
											type='button'
											onClick={() => setEditing(null)}
											className='px-3 py-2 text-sm text-gray-600 dark:text-slate-400 hover:underline'
										>
											Cancelar
										</button>
									</div>
								) : confirming === shelf.recordId ? (
									<div className='flex flex-wrap items-center gap-2 text-sm'>
										<span className='text-gray-700 dark:text-slate-300'>
											Apagar "{shelf.name}"?{' '}
											{count > 0 && (
												<span className='text-gray-600 dark:text-slate-400'>
													{count} {count === 1 ? 'livro perde' : 'livros perdem'} o selo — nenhum
													sai da estante.
												</span>
											)}
										</span>
										<button
											type='button'
											disabled={isSaving}
											onClick={() => {
												removeShelf(shelf);
												setConfirming(null);
											}}
											className='px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors disabled:opacity-50'
										>
											Apagar
										</button>
										<button
											type='button'
											onClick={() => setConfirming(null)}
											className='px-3 py-1.5 text-sm text-gray-600 dark:text-slate-400 hover:underline'
										>
											Cancelar
										</button>
									</div>
								) : (
									<div className='flex items-center gap-3'>
										<span
											className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${SHELF_COLOR_SWATCHES[shelf.color]} text-white`}
										>
											<Icon name={shelf.icon} className='w-3.5 h-3.5' />
											{shelf.name}
										</span>
										<span className='text-xs text-gray-600 dark:text-slate-400 tabular-nums'>
											{count} {count === 1 ? 'livro' : 'livros'}
										</span>
										<div className='ml-auto flex items-center gap-1'>
											<button
												type='button'
												onClick={() => startEditing(shelf)}
												className='px-2 py-1 text-xs text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors'
											>
												Renomear
											</button>
											<button
												type='button'
												onClick={() => setConfirming(shelf.recordId)}
												aria-label={`Apagar a estante ${shelf.name}`}
												className='p-1.5 text-gray-400 hover:text-red-500 transition-colors'
											>
												<Icon name='trash' className='w-4 h-4' />
											</button>
										</div>
									</div>
								)}
							</li>
						);
					})}
				</ul>
			)}

			<form onSubmit={handleCreate} className='space-y-3 border-t border-gray-100 dark:border-slate-700 pt-4'>
				<div>
					<label
						htmlFor='nova-estante'
						className='block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1'
					>
						Nova estante
					</label>
					<input
						id='nova-estante'
						type='text'
						value={name}
						maxLength={MAX_SHELF_NAME}
						onChange={(event) => setName(event.target.value)}
						placeholder='ex.: Emprestado, Abandonado, Relendo'
						className={`w-full ${fieldClasses}`}
					/>
				</div>

				<div className='flex flex-wrap gap-5'>
					<Picker
						label='Ícone'
						options={SHELF_ICON_OPTIONS}
						value={icon}
						onChange={setIcon}
						render={(option) => <Icon name={option} className='w-4 h-4' />}
					/>
					<Picker
						label='Cor'
						options={SHELF_COLORS}
						value={color}
						onChange={setColor}
						render={(option) => (
							<span className={`w-4 h-4 rounded-full ${SHELF_COLOR_SWATCHES[option]}`} />
						)}
					/>
				</div>

				<button
					type='submit'
					disabled={isSaving || !name.trim()}
					className='px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50'
				>
					Criar estante
				</button>
			</form>
		</div>
	);
};

export default ManageShelves;
