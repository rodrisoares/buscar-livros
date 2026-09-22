import React from 'react';
import Icon, { type IconName } from './Icon';

interface EmptyStateProps {
	icon: IconName;
	title: string;
	description?: React.ReactNode;
	/** Botões ou links de saída — sem eles o estado vazio vira um beco sem saída. */
	actions?: React.ReactNode;
	variant?: 'neutral' | 'error';
	className?: string;
}

const CIRCLE_CLASSES = {
	neutral: 'bg-gray-100 dark:bg-slate-800',
	error: 'bg-red-100 dark:bg-red-950',
};

const ICON_CLASSES = {
	neutral: 'text-gray-500 dark:text-slate-400',
	error: 'text-red-600 dark:text-red-400',
};

/**
 * Estado vazio/erro padronizado. Antes cada tela desenhava o seu, com tamanhos,
 * espaçamentos e tons diferentes.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
	icon,
	title,
	description,
	actions,
	variant = 'neutral',
	className = '',
}) => (
	<div className={`text-center py-16 ${className}`}>
		<div className='max-w-md mx-auto'>
			<div
				className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${CIRCLE_CLASSES[variant]} ${ICON_CLASSES[variant]}`}
			>
				<Icon name={icon} className='w-10 h-10' />
			</div>

			<h2 className='text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-3'>{title}</h2>

			{description && (
				<div className='text-gray-600 dark:text-slate-300 mb-6'>{description}</div>
			)}

			{actions && <div className='flex flex-wrap items-center justify-center gap-3'>{actions}</div>}
		</div>
	</div>
);

export default EmptyState;
