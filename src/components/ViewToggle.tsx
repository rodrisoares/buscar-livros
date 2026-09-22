import React from 'react';
import type { ListView } from '@/lib/listView';
import Icon, { type IconName } from './Icon';

const VIEWS: { value: ListView; label: string; icon: IconName }[] = [
	{ value: 'grid', label: 'Grade', icon: 'grid' },
	{ value: 'list', label: 'Lista', icon: 'list' },
];

interface ViewToggleProps {
	value: ListView;
	onChange: (view: ListView) => void;
	className?: string;
}

/** Grade ou lista. Mesmo controle na estante e nos resultados de busca. */
const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange, className = '' }) => (
	<div
		className={`inline-flex rounded-lg border border-gray-300 dark:border-slate-600 overflow-hidden ${className}`}
		role='group'
		aria-label='Formato da lista'
	>
		{VIEWS.map((item) => (
			<button
				key={item.value}
				type='button'
				onClick={() => onChange(item.value)}
				aria-pressed={value === item.value}
				title={item.label}
				className={`focus-inset inline-flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
					value === item.value
						? 'bg-primary-600 text-white'
						: 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
				}`}
			>
				<Icon name={item.icon} className='w-4 h-4' />
				<span className='sr-only sm:not-sr-only'>{item.label}</span>
			</button>
		))}
	</div>
);

export default ViewToggle;
