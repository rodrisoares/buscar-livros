/**
 * Um agrupamento ordenado de livros — uma saga, uma trilogia, um curso.
 *
 * O que separa uma coleção de uma tag ou de uma estante personalizada é a
 * **ordem**: "O Senhor dos Anéis" tem volume 1, 2 e 3, e essa sequência não sai
 * de nenhum dado da API. Ela é escolhida à mão e guardada aqui.
 */
export interface Collection {
	/** Chave do registro na API. */
	recordId: string;
	name: string;
	description: string;
	/** Ids de volume do Google Books, na ordem definida pelo usuário. */
	bookIds: string[];
}

export interface RawCollection {
	id?: string | number;
	name?: string;
	description?: string;
	bookIds?: unknown;
}

export const MAX_COLLECTION_NAME = 60;
export const MAX_COLLECTION_DESCRIPTION = 200;
