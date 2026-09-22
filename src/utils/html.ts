/**
 * A Google Books devolve a descrição com HTML (<p>, <br>, <i>...).
 * Convertemos para texto puro preservando as quebras de parágrafo,
 * evitando renderizar HTML de terceiros na página.
 */
export const stripHtml = (html: string): string => {
	if (!html) return '';

	const withBreaks = html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|div|li|h[1-6])>/gi, '\n');

	const text =
		typeof DOMParser === 'undefined'
			? withBreaks.replace(/<[^>]*>/g, '')
			: (new DOMParser().parseFromString(withBreaks, 'text/html').body.textContent ?? '');

	return text
		.replace(/[ \t]+/g, ' ')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
};
