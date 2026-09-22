import React, { useState } from 'react';
import { normalizeForSearch } from '@/utils/normalize';
import Icon from '@/components/Icon';

interface TagInputProps {
	tags: string[];
	onChange: (tags: string[]) => void;
	disabled?: boolean;
	suggestions?: string[];
}

const MAX_TAG_LENGTH = 24;

const TagInput: React.FC<TagInputProps> = ({
	tags,
	onChange,
	disabled = false,
	suggestions = [],
}) => {
	const [draft, setDraft] = useState('');

	const addTag = (value: string) => {
		const tag = value.trim().slice(0, MAX_TAG_LENGTH);
		if (!tag) return;

		// Não repete a mesma tag por diferença de acento ou caixa.
		const exists = tags.some((item) => normalizeForSearch(item) === normalizeForSearch(tag));
		if (!exists) onChange([...tags, tag]);

		setDraft('');
	};

	const removeTag = (tag: string) => onChange(tags.filter((item) => item !== tag));

	const availableSuggestions = suggestions
		.filter((item) => !tags.some((tag) => normalizeForSearch(tag) === normalizeForSearch(item)))
		.slice(0, 6);

	return (
		<div className='space-y-3'>
			<div className='flex flex-wrap gap-2'>
				{tags.length === 0 && (
					<p className='text-sm text-gray-600 dark:text-slate-400'>
						Nenhuma tag ainda.
					</p>
				)}

				{tags.map((tag) => (
					<span
						key={tag}
						className='inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-100 dark:bg-secondary-950 text-secondary-800 dark:text-secondary-200 text-sm'
					>
						{tag}
						<button
							type='button'
							onClick={() => removeTag(tag)}
							disabled={disabled}
							aria-label={`Remover a tag ${tag}`}
							className='hover:text-secondary-950 dark:hover:text-white transition-colors'
						>
							<Icon name='x' className='w-3.5 h-3.5' />
						</button>
					</span>
				))}
			</div>

			<div className='flex gap-2'>
				<input
					type='text'
					value={draft}
					disabled={disabled}
					maxLength={MAX_TAG_LENGTH}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ',') {
							// Enter dentro de um formulário não deve enviá-lo.
							e.preventDefault();
							addTag(draft);
						}
					}}
					placeholder='Nova tag e Enter'
					aria-label='Adicionar tag'
					className='flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent'
				/>
				<button
					type='button'
					onClick={() => addTag(draft)}
					disabled={disabled || !draft.trim()}
					className='px-4 py-2 rounded-lg bg-secondary-600 text-white text-sm font-medium hover:bg-secondary-700 transition-colors disabled:opacity-50'
				>
					Adicionar
				</button>
			</div>

			{availableSuggestions.length > 0 && (
				<div className='flex flex-wrap items-center gap-2'>
					<span className='text-xs text-gray-600 dark:text-slate-400'>
						Já usadas:
					</span>
					{availableSuggestions.map((tag) => (
						<button
							key={tag}
							type='button'
							onClick={() => addTag(tag)}
							disabled={disabled}
							className='px-2 py-1 rounded-full border border-gray-300 dark:border-slate-600 text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
						>
							+ {tag}
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default TagInput;
