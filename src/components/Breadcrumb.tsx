import React from 'react';
import { Link } from 'react-router-dom';

export interface Crumb {
	label: string;
	to?: string;
}

const Breadcrumb: React.FC<{ items: Crumb[]; className?: string }> = ({ items, className = '' }) => (
	<nav aria-label='Trilha de navegação' className={className}>
		<ol className='flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-slate-400'>
			{items.map((item, index) => {
				const isLast = index === items.length - 1;

				return (
					<li key={`${item.label}-${index}`} className='flex items-center gap-2'>
						{item.to && !isLast ? (
							<Link
								to={item.to}
								className='hover:text-gray-900 dark:hover:text-slate-100 transition-colors underline-offset-2 hover:underline'
							>
								{item.label}
							</Link>
						) : (
							<span
								className={isLast ? 'text-gray-900 dark:text-slate-200 font-medium' : undefined}
								aria-current={isLast ? 'page' : undefined}
							>
								{item.label}
							</span>
						)}

						{!isLast && (
							<span aria-hidden='true' className='text-gray-300 dark:text-slate-600'>
								/
							</span>
						)}
					</li>
				);
			})}
		</ol>
	</nav>
);

export default Breadcrumb;
