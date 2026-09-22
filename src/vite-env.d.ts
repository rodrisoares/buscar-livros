/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** URL base da API de favoritos (json-server). Ex.: http://localhost:3001 */
	readonly VITE_API_URL?: string;
	/** Endpoint do formulário de contato (Formspree, Basin...). Vazio usa o cliente de e-mail. */
	readonly VITE_CONTACT_ENDPOINT?: string;
	/** Chave da Google Books API. Sem ela, vale a cota anônima compartilhada (bem pequena). */
	readonly VITE_GOOGLE_BOOKS_API_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
