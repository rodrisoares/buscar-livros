import React from 'react';
import type { FavoriteBook } from '@/types/Book';
import { fromDateInputValue, toDateInputValue, todayAsInputValue } from '@/lib/dates';

interface ReadingDatesProps {
	book: FavoriteBook;
	onChange: (patch: { startedAt?: number; finishedAt?: number }) => void;
	disabled?: boolean;
}

const fieldClasses =
	'px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60';

const labelClasses = 'block text-sm text-gray-600 dark:text-slate-400 mb-1';

/**
 * Início e fim da leitura.
 *
 * As duas datas já eram gravadas ao mudar de estante, mas não apareciam em
 * lugar nenhum e não havia como corrigir uma data errada. Como o painel conta
 * os livros concluídos pelo ano de `finishedAt`, ajustar aqui é o que permite
 * lançar uma leitura terminada semana passada no lugar certo.
 */
const ReadingDates: React.FC<ReadingDatesProps> = ({ book, onChange, disabled = false }) => {
	// Quem só marcou "quero ler" ainda não tem leitura para datar.
	if (book.status === 'want_to_read') return null;

	const hoje = todayAsInputValue();
	const inicio = toDateInputValue(book.startedAt);
	const mostraConclusao = book.status === 'read';

	return (
		<div>
			<h3 className='text-sm font-medium text-gray-700 dark:text-slate-300 mb-2'>
				Datas de leitura
			</h3>

			<div className='flex flex-wrap gap-4'>
				<div>
					<label htmlFor='data-inicio' className={labelClasses}>
						Começou em
					</label>
					<input
						id='data-inicio'
						type='date'
						value={inicio}
						max={hoje}
						disabled={disabled}
						onChange={(e) => onChange({ startedAt: fromDateInputValue(e.target.value) })}
						className={fieldClasses}
					/>
				</div>

				{mostraConclusao && (
					<div>
						<label htmlFor='data-fim' className={labelClasses}>
							Terminou em
						</label>
						<input
							id='data-fim'
							type='date'
							value={toDateInputValue(book.finishedAt)}
							// Terminar antes de começar não existe; o navegador já barra.
							min={inicio || undefined}
							max={hoje}
							disabled={disabled}
							onChange={(e) => onChange({ finishedAt: fromDateInputValue(e.target.value) })}
							className={fieldClasses}
						/>
					</div>
				)}
			</div>

			<p className='mt-2 text-xs text-gray-600 dark:text-slate-400'>
				{mostraConclusao
					? 'A data de conclusão é o que coloca o livro na contagem do ano no painel.'
					: 'A data de conclusão aparece quando você marcar o livro como lido.'}
			</p>
		</div>
	);
};

export default ReadingDates;
