import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
	className?: string;
}

const links = [
	{ to: '/', label: 'Buscar' },
	{ to: '/favorites', label: 'Minha estante' },
	{ to: '/colecoes', label: 'Coleções' },
	{ to: '/dashboard', label: 'Painel' },
	{ to: '/about', label: 'Sobre' },
	{ to: '/contact', label: 'Contato' },
];

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
	const currentYear = new Date().getFullYear();

	return (
		<footer className={`bg-slate-900 text-white py-10 px-6 ${className}`}>
			<div className='max-w-7xl mx-auto grid gap-8 md:grid-cols-3'>
				<div>
					<h2 className='text-lg font-semibold mb-2'>Buscar Livros</h2>
					<p className='text-sm text-slate-400 max-w-[40ch]'>
						Pesquise livros e organize sua estante de leitura em um só lugar.
					</p>
				</div>

				<nav aria-label='Links do rodapé'>
					<h2 className='text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3'>
						Navegação
					</h2>
					<ul className='space-y-2'>
						{links.map((link) => (
							<li key={link.to}>
								<Link
									to={link.to}
									className='text-sm text-slate-300 hover:text-white transition-colors'
								>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</nav>

				<div>
					<h2 className='text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3'>
						Dados
					</h2>
					{/* Crédito exigido pelos termos de uso da API. */}
					<p className='text-sm text-slate-300'>
						Informações de livros fornecidas pela{' '}
						<a
							href='https://developers.google.com/books'
							target='_blank'
							rel='noopener noreferrer'
							className='underline underline-offset-2 hover:text-white transition-colors'
						>
							Google Books API
						</a>
						. Este site não é afiliado ao Google.
					</p>
				</div>
			</div>

			<div className='max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-700 text-center'>
				<p className='text-sm text-slate-400'>Copyright © Buscar Livros {currentYear}</p>
			</div>
		</footer>
	);
};

export default Footer;
