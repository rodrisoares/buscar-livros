import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';
import Logo from './Logo';

interface HeaderProps {
	className?: string;
}

const navItems = [
	{ to: '/favorites', label: 'Minha estante' },
	{ to: '/colecoes', label: 'Coleções' },
	{ to: '/dashboard', label: 'Painel' },
	{ to: '/about', label: 'Sobre' },
	{ to: '/contact', label: 'Contato' },
];

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const location = useLocation();
	const { favoritesCount } = useFavorites();

	const drawerRef = useRef<HTMLDivElement>(null);
	const toggleRef = useRef<HTMLButtonElement>(null);

	// A Home já tem a busca na página; nas outras telas ela vem no cabeçalho,
	// para não obrigar o usuário a voltar para buscar de novo.
	const showHeaderSearch = location.pathname !== '/';

	// Fecha o menu ao navegar, senão ele fica aberto sobre a página nova.
	useEffect(() => {
		setIsMenuOpen(false);
	}, [location.pathname]);

	// Trava a rolagem do fundo enquanto o drawer está aberto.
	useEffect(() => {
		if (!isMenuOpen) return;

		const { overflow } = document.body.style;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = overflow;
		};
	}, [isMenuOpen]);

	// Esc fecha, e o Tab circula dentro do drawer em vez de vazar para a página.
	useEffect(() => {
		if (!isMenuOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setIsMenuOpen(false);
				toggleRef.current?.focus();
				return;
			}

			if (event.key !== 'Tab' || !drawerRef.current) return;

			const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input, select, textarea'
			);
			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		// O foco entra no drawer assim que ele abre.
		drawerRef.current?.querySelector<HTMLElement>('a[href], button')?.focus();

		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isMenuOpen]);

	const linkClasses = ({ isActive }: { isActive: boolean }) =>
		`transition-colors ${
			isActive
				? 'text-white font-semibold border-b-2 border-primary-400 pb-0.5'
				: 'text-slate-300 hover:text-white border-b-2 border-transparent pb-0.5'
		}`;

	const renderLink = (item: (typeof navItems)[number]) => (
		<NavLink key={item.to} to={item.to} className={linkClasses}>
			<span className='inline-flex items-center gap-2'>
				{item.label}
				{item.to === '/favorites' && favoritesCount > 0 && (
					<span
						className='inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold'
						aria-label={`${favoritesCount} ${favoritesCount === 1 ? 'livro na estante' : 'livros na estante'}`}
					>
						{favoritesCount > 99 ? '99+' : favoritesCount}
					</span>
				)}
			</span>
		</NavLink>
	);

	return (
		<header className={`bg-slate-900 text-white px-6 py-4 ${className}`}>
			<div className='max-w-7xl mx-auto flex items-center justify-between gap-4'>
				<div className='flex items-center gap-6 flex-1 min-w-0'>
					{/* O nome acessível do link vem do <title> dentro do SVG. */}
					<Link to='/' className='shrink-0 text-white'>
						<Logo className='h-9 w-auto' />
					</Link>

					{showHeaderSearch && (
						<SearchBar size='mobile' className='hidden lg:block w-full max-w-xs' />
					)}
				</div>

				<nav className='hidden md:flex items-center gap-6'>{navItems.map(renderLink)}</nav>

				<div className='flex items-center gap-3'>
					<ThemeToggle className='hidden sm:inline-flex' />

					<button
						ref={toggleRef}
						type='button'
						onClick={() => setIsMenuOpen((open) => !open)}
						aria-expanded={isMenuOpen}
						aria-controls='mobile-menu'
						aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
						className='md:hidden text-white hover:text-slate-300 transition-colors'
					>
						<svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M4 6h16M4 12h16M4 18h16'
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Drawer lateral */}
			{isMenuOpen && (
				<div className='md:hidden fixed inset-0 z-50'>
					<button
						type='button'
						aria-label='Fechar menu'
						tabIndex={-1}
						onClick={() => setIsMenuOpen(false)}
						className='absolute inset-0 bg-black/60'
					/>

					<div
						ref={drawerRef}
						id='mobile-menu'
						role='dialog'
						aria-modal='true'
						aria-label='Menu de navegação'
						className='absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-slate-900 shadow-2xl p-6 flex flex-col gap-6 overflow-y-auto'
					>
						<div className='flex items-center justify-between'>
							<span className='text-sm uppercase tracking-wide text-slate-400'>Menu</span>
							<button
								type='button'
								onClick={() => {
									setIsMenuOpen(false);
									toggleRef.current?.focus();
								}}
								aria-label='Fechar menu'
								className='text-white hover:text-slate-300 transition-colors'
							>
								<svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M6 18L18 6M6 6l12 12'
									/>
								</svg>
							</button>
						</div>

						{showHeaderSearch && <SearchBar size='mobile' className='w-full' />}

						<nav className='flex flex-col gap-4 text-lg'>{navItems.map(renderLink)}</nav>

						<div className='mt-auto pt-6 border-t border-slate-700'>
							<p className='text-xs text-slate-400 mb-3'>Tema</p>
							<ThemeToggle />
						</div>
					</div>
				</div>
			)}
		</header>
	);
};

export default Header;
