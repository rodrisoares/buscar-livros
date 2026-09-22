import { shouldPersistQuery } from './queryPersister';
import { queryKeys } from './queryKeys';

const consulta = (queryKey: readonly unknown[], status = 'success') =>
	({ queryKey, state: { status } }) as unknown as Parameters<typeof shouldPersistQuery>[0];

describe('shouldPersistQuery', () => {
	it('guarda o que é do usuário', () => {
		expect(shouldPersistQuery(consulta(queryKeys.favorites))).toBe(true);
		expect(shouldPersistQuery(consulta(queryKeys.shelves))).toBe(true);
		expect(shouldPersistQuery(consulta(queryKeys.collections))).toBe(true);
		expect(shouldPersistQuery(consulta(queryKeys.goals))).toBe(true);
	});

	it('não guarda resultado de busca — o acervo muda e a lista envelhece', () => {
		expect(shouldPersistQuery(consulta(queryKeys.booksSearch('tolkien', {})))).toBe(false);
	});

	it('nem as sugestões do campo de busca', () => {
		expect(shouldPersistQuery(consulta(queryKeys.booksSuggest('dom casmurro')))).toBe(false);
	});

	it('nem a ficha de um livro', () => {
		expect(shouldPersistQuery(consulta(queryKeys.bookDetail('vol-01')))).toBe(false);
	});

	it('nem os relacionados', () => {
		expect(shouldPersistQuery(consulta(queryKeys.relatedBooks('author', 'Tolkien')))).toBe(false);
	});

	it('uma chave desconhecida fica de fora por padrão', () => {
		expect(shouldPersistQuery(consulta(['algo', 'novo']))).toBe(false);
	});

	it('chave vazia não quebra', () => {
		expect(shouldPersistQuery(consulta([]))).toBe(false);
	});

	it('consulta em erro fica de fora — senão o app abre quebrado na visita seguinte', () => {
		expect(shouldPersistQuery(consulta(queryKeys.favorites, 'error'))).toBe(false);
	});

	it('nem a que ainda nem respondeu', () => {
		expect(shouldPersistQuery(consulta(queryKeys.shelves, 'pending'))).toBe(false);
	});
});
