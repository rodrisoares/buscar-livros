import type { AccordionItem } from '@/components/Accordion';

/**
 * Perguntas frequentes da tela de contato.
 *
 * Ficam aqui, e não no componente: são texto que muda quando o produto muda,
 * sem nada a ver com o formulário ao lado. Rever esta lista depois de acrescentar
 * uma funcionalidade é mais fácil num arquivo que só tem conteúdo.
 */
export const FAQ_ITEMS: AccordionItem[] = [
	{
		title: 'De onde vêm os dados dos livros?',
		content:
			'Todos os títulos, capas e fichas técnicas vêm da Google Books API. O Buscar Livros não hospeda nem vende livros — ele ajuda você a encontrá-los e a organizar sua estante.',
	},
	{
		title: 'Minha estante fica salva?',
		content:
			'Sim. Estantes, progresso de leitura, notas, anotações, tags e coleções são gravados na API do projeto e continuam disponíveis quando você volta. Não é preciso criar conta.',
	},
	{
		title: 'Qual a diferença entre estante, tag e coleção?',
		content:
			'A estante diz em que pé está a leitura — "Quero ler", "Lendo" ou "Lido" —, e um livro está em exatamente uma. Você também pode criar estantes próprias ("Emprestado", "Relendo"), e nessas um livro pode estar em várias ao mesmo tempo. Tags são palavras livres para filtrar. Coleções guardam uma saga na ordem dos volumes, que é o que nenhuma das outras faz.',
	},
	{
		title: 'Como o app sabe quando vou terminar um livro?',
		content:
			'Cada vez que você anota a página em que está, a marcação entra num histórico. Com duas ou mais, a ficha calcula seu ritmo em páginas por dia e projeta a data de conclusão. Sem anotar, não há o que projetar — e o app prefere não dizer nada a inventar um número.',
	},
	{
		title: 'Por que alguns livros não têm capa ou descrição?',
		content:
			'Esses campos são opcionais na Google Books API. Quando a editora não os informa, mostramos uma capa padrão e avisamos que a descrição não está disponível.',
	},
	{
		title: 'Consigo ler o livro inteiro por aqui?',
		content:
			'Depende do título. Na ficha técnica, o campo "Disponibilidade" indica se há leitura completa, apenas uma amostra ou nenhuma pré-visualização. Os botões levam para o Google Books.',
	},
];
