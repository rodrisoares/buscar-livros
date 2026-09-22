import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import Icon, { type IconName } from '@/components/Icon';

/**
 * O que o app faz hoje.
 *
 * A lista descrevia "estante de favoritos com filtro e ordenação" quando já
 * havia estantes por status, estantes próprias, coleções, metas e painel —
 * texto de portfólio envelhece calado, e este envelheceu.
 */
const features = [
	'Busca no acervo do Google Books por título, autoria, assunto ou ISBN, com sugestões de livros enquanto você digita',
	'Estante com três situações — quero ler, lendo e lido — mais as estantes que você criar ("emprestado", "relendo")',
	'Acompanhamento de leitura por página, com histórico: o painel calcula seu ritmo e projeta quando o livro acaba',
	'Coleções ordenadas para sagas e séries, com o progresso do conjunto',
	'Meta anual de leitura e painel com gráfico mês a mês, autores, categorias e tags',
	'Notas, anotações e tags por livro, tudo salvo entre as sessões e sem exigir conta',
];

const highlights: {
	icon: IconName;
	bg: string;
	color: string;
	title: string;
	description: string;
}[] = [
	{
		icon: 'library',
		bg: 'bg-primary-100 dark:bg-primary-950',
		color: 'text-primary-600 dark:text-primary-400',
		title: 'Acervo do Google Books',
		description: 'Milhões de volumes em um só lugar',
	},
	{
		icon: 'book-open',
		bg: 'bg-green-100 dark:bg-green-950',
		color: 'text-green-600 dark:text-green-400',
		title: 'Leitura acompanhada',
		description: 'Anote a página e veja o ritmo e a previsão',
	},
	{
		icon: 'chart',
		bg: 'bg-secondary-100 dark:bg-secondary-950',
		color: 'text-secondary-600 dark:text-secondary-400',
		title: 'Meta e painel',
		description: 'Quanto você leu no ano, mês a mês',
	},
];

const About: React.FC = () => {
	useDocumentTitle('Sobre');

	return (
		<div className='max-w-4xl mx-auto px-6 py-12'>
			<div className='text-center mb-12'>
				<h1 className='text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4'>
					Sobre o Buscar Livros
				</h1>
				<p className='text-xl text-gray-600 dark:text-slate-400'>
					Encontre o próximo livro e acompanhe o que você está lendo
				</p>
			</div>

			<div className='grid md:grid-cols-2 gap-12 items-start'>
				<div className='space-y-6'>
					<h2 className='text-2xl font-semibold text-gray-900 dark:text-slate-100'>Nossa Missão</h2>
					<p className='text-gray-700 dark:text-slate-300 leading-relaxed'>
						No Buscar Livros, acreditamos que cada livro tem o poder de transformar vidas. Nossa
						missão é ajudar você a encontrar rapidamente o livro certo, guardar o que importa e
						não perder de vista onde parou.
					</p>

					<h2 className='text-2xl font-semibold text-gray-900 dark:text-slate-100'>
						O Que Oferecemos
					</h2>
					<ul className='space-y-3 text-gray-700 dark:text-slate-300'>
						{features.map((feature) => (
							<li key={feature} className='flex items-start'>
								<span className='text-primary-500 dark:text-primary-400 mr-2' aria-hidden='true'>
									•
								</span>
								{feature}
							</li>
						))}
					</ul>

					<p className='text-sm text-gray-600 dark:text-slate-400'>
						Os dados dos livros são fornecidos pela{' '}
						<a
							href='https://developers.google.com/books'
							target='_blank'
							rel='noopener noreferrer'
							className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline underline-offset-2'
						>
							Google Books API
						</a>
						. O que é seu — estantes, progresso, notas e coleções — fica guardado à parte e não é
						compartilhado com ninguém.
					</p>
				</div>

				<div className='bg-gray-50 dark:bg-slate-800 p-8 rounded-lg'>
					<h2 className='text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4'>
						Por Que Escolher o Buscar Livros?
					</h2>
					<div className='space-y-4'>
						{highlights.map((item) => (
							<div key={item.title} className='flex items-center'>
								<div
									className={`w-12 h-12 ${item.bg} ${item.color} rounded-full flex items-center justify-center mr-4 flex-shrink-0`}
								>
									<Icon name={item.icon} className='w-6 h-6' />
								</div>
								<div>
									<h3 className='font-medium text-gray-900 dark:text-slate-100'>{item.title}</h3>
									<p className='text-sm text-gray-600 dark:text-slate-400'>{item.description}</p>
								</div>
							</div>
						))}
					</div>

					{/* Dois caminhos: quem chegou sem estante começa buscando, quem já
					    tem uma quer ver o retrato dela. */}
					<div className='mt-6 flex flex-wrap gap-3'>
						<Link
							to='/'
							className='inline-block bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium'
						>
							Começar a buscar
						</Link>
						<Link
							to='/dashboard'
							className='inline-block border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 px-5 py-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors font-medium'
						>
							Ver meu painel
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default About;
