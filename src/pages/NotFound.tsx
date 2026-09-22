import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import Icon from '@/components/Icon';

const NotFound: React.FC = () => {
	const location = useLocation();
	useDocumentTitle('Página não encontrada');

	return (
		<div className='max-w-3xl mx-auto px-6 py-24 text-center'>
			<div className='w-24 h-24 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-6'>
				<Icon name='search' className='w-10 h-10' />
			</div>
			<h1 className='text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4'>Página não encontrada</h1>
			<p className='text-gray-600 dark:text-slate-400 mb-2'>
				Não existe nada em <span className='font-mono text-gray-800 dark:text-slate-200'>{location.pathname}</span>.
			</p>
			<p className='text-gray-600 dark:text-slate-400 mb-8'>
				O endereço pode estar incorreto ou a página pode ter sido removida.
			</p>
			<div className='flex items-center justify-center gap-3'>
				<Link
					to='/'
					className='bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium'
				>
					Voltar para a busca
				</Link>
				<Link
					to='/favorites'
					className='border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium'
				>
					Meus favoritos
				</Link>
			</div>
		</div>
	);
};

export default NotFound;
