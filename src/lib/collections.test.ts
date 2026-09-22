import type { Collection } from '@/types/Collection';
import { makeFavorite } from '@/test/utils';
import {
	addToCollection,
	collectionCovers,
	collectionsOf,
	getCollectionProgress,
	listCollectionEntries,
	moveInCollection,
	removeFromCollection,
} from './collections';

const colecao = (bookIds: string[], overrides: Partial<Collection> = {}): Collection => ({
	recordId: 'c1',
	name: 'O Senhor dos Anéis',
	description: '',
	bookIds,
	...overrides,
});

const naEstante = [
	makeFavorite({ id: 'v1', title: 'A Sociedade do Anel', status: 'read' }),
	makeFavorite({ id: 'v2', title: 'As Duas Torres', status: 'read' }),
	makeFavorite({ id: 'v3', title: 'O Retorno do Rei', status: 'reading' }),
	makeFavorite({ id: 'v4', title: 'O Silmarillion', status: 'want_to_read' }),
];

describe('listCollectionEntries', () => {
	it('segue a ordem da coleção, não a da estante', () => {
		const entries = listCollectionEntries(colecao(['v3', 'v1', 'v2']), naEstante);

		expect(entries.map((e) => e.bookId)).toEqual(['v3', 'v1', 'v2']);
	});

	it('numera em base 1, como se lê numa saga', () => {
		const entries = listCollectionEntries(colecao(['v1', 'v2']), naEstante);

		expect(entries.map((e) => e.position)).toEqual([1, 2]);
	});

	it('mantém a posição de um volume que saiu da estante', () => {
		// Sem isto, tirar o volume 2 da estante renumeraria o 3 para 2 e a saga
		// passaria a mentir sobre o que falta.
		const entries = listCollectionEntries(colecao(['v1', 'sumiu', 'v3']), naEstante);

		expect(entries).toHaveLength(3);
		expect(entries[1].book).toBeUndefined();
		expect(entries[2].position).toBe(3);
	});
});

describe('getCollectionProgress', () => {
	it('conta lidos, em leitura e ausentes', () => {
		const progress = getCollectionProgress(colecao(['v1', 'v2', 'v3', 'sumiu']), naEstante);

		expect(progress).toEqual({ total: 4, read: 2, reading: 1, missing: 1, percent: 50 });
	});

	it('coleção vazia não divide por zero', () => {
		expect(getCollectionProgress(colecao([]), naEstante).percent).toBe(0);
	});

	it('saga inteira lida chega a 100%', () => {
		expect(getCollectionProgress(colecao(['v1', 'v2']), naEstante).percent).toBe(100);
	});

	it('volume ausente conta contra o progresso — ele ainda falta', () => {
		expect(getCollectionProgress(colecao(['v1', 'sumiu']), naEstante).percent).toBe(50);
	});
});

describe('addToCollection', () => {
	it('acrescenta ao fim', () => {
		expect(addToCollection(['v1', 'v2'], 'v3')).toEqual(['v1', 'v2', 'v3']);
	});

	it('não repete um volume já presente', () => {
		const atual = ['v1', 'v2'];

		expect(addToCollection(atual, 'v1')).toBe(atual);
	});

	it('id vazio não entra', () => {
		const atual = ['v1'];

		expect(addToCollection(atual, '')).toBe(atual);
	});
});

describe('removeFromCollection', () => {
	it('tira só o volume pedido', () => {
		expect(removeFromCollection(['v1', 'v2', 'v3'], 'v2')).toEqual(['v1', 'v3']);
	});
});

describe('moveInCollection', () => {
	it('sobe um volume trocando com o de cima', () => {
		expect(moveInCollection(['v1', 'v2', 'v3'], 1, 'up')).toEqual(['v2', 'v1', 'v3']);
	});

	it('desce um volume trocando com o de baixo', () => {
		expect(moveInCollection(['v1', 'v2', 'v3'], 1, 'down')).toEqual(['v1', 'v3', 'v2']);
	});

	it('o primeiro não sobe e o último não desce', () => {
		const atual = ['v1', 'v2', 'v3'];

		expect(moveInCollection(atual, 0, 'up')).toBe(atual);
		expect(moveInCollection(atual, 2, 'down')).toBe(atual);
	});

	it('índice fora da lista não faz nada', () => {
		const atual = ['v1', 'v2'];

		expect(moveInCollection(atual, 9, 'up')).toBe(atual);
		expect(moveInCollection(atual, -1, 'down')).toBe(atual);
	});

	it('não altera o vetor recebido', () => {
		const atual = ['v1', 'v2', 'v3'];
		const copia = [...atual];

		moveInCollection(atual, 1, 'up');

		expect(atual).toEqual(copia);
	});
});

describe('collectionsOf', () => {
	it('acha as coleções a que o livro pertence', () => {
		const saga = colecao(['v1', 'v2']);
		const outra = colecao(['v3'], { recordId: 'c2', name: 'Ficção científica' });

		expect(collectionsOf([saga, outra], 'v1')).toEqual([saga]);
		expect(collectionsOf([saga, outra], 'v9')).toEqual([]);
	});
});

describe('collectionCovers', () => {
	it('devolve as capas na ordem da saga', () => {
		const covers = collectionCovers(colecao(['v3', 'v1']), naEstante);

		expect(covers.map((b) => b.id)).toEqual(['v3', 'v1']);
	});

	it('pula os volumes ausentes em vez de deixar buracos', () => {
		const covers = collectionCovers(colecao(['sumiu', 'v1']), naEstante);

		expect(covers.map((b) => b.id)).toEqual(['v1']);
	});

	it('respeita o limite', () => {
		expect(collectionCovers(colecao(['v1', 'v2', 'v3', 'v4']), naEstante, 2)).toHaveLength(2);
	});
});
