import React from 'react';
import { SHELF_LABELS, SHELF_STATUSES, type ShelfStatus } from '@/types/Shelf';

interface ShelfStatusSelectProps {
	value: ShelfStatus;
	onChange: (status: ShelfStatus) => void;
	disabled?: boolean;
	id?: string;
	className?: string;
}

const ShelfStatusSelect: React.FC<ShelfStatusSelectProps> = ({
	value,
	onChange,
	disabled = false,
	id,
	className = '',
}) => (
	<select
		id={id}
		value={value}
		disabled={disabled}
		onChange={(e) => onChange(e.target.value as ShelfStatus)}
		aria-label='Estante do livro'
		className={`px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 ${className}`}
	>
		{SHELF_STATUSES.map((status) => (
			<option key={status} value={status}>
				{SHELF_LABELS[status]}
			</option>
		))}
	</select>
);

export default ShelfStatusSelect;
