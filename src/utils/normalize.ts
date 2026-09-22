export const normalizeString = (value: string | undefined | null, defaultValue = '') => {
	return value?.trim() || defaultValue;
};

export const normalizeArray = <T>(value: T[] | undefined | null, defaultValue: T[] = []): T[] => {
	return value || defaultValue;
};

export const normalizeNumber = (value: number | undefined | null, defaultValue = 0): number => {
	return typeof value === 'number' && !isNaN(value) ? value : defaultValue;
};

export const normalizeUrl = (value: string | undefined | null, defaultValue = ''): string => {
	const normalized = normalizeString(value, defaultValue);
	return normalized.startsWith('http://') ? normalized.replace('http://', 'https://') : normalized;
};

export const joinArrayToString = (
	array: string[] | undefined | null,
	separator = ', ',
	defaultValue = 'Unknown'
): string => {
	const normalizedArray = normalizeArray(array);
	return normalizedArray.length > 0 ? normalizedArray.join(separator) : defaultValue;
};

/** Minúsculas e sem acentos, para comparar texto digitado com o conteúdo da tela. */
export const normalizeForSearch = (value: string): string =>
	value
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.trim();

/**
 * Nome legível virando pedaço de URL: "Emprestado p/ Ana" -> "emprestado-p-ana".
 *
 * Dois nomes muito parecidos podem gerar o mesmo slug; quem resolve é quem lê,
 * pegando a primeira estante que casar.
 */
export const toSlug = (value: string): string =>
	normalizeForSearch(value)
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
