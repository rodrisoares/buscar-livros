export const CONTACT_SUBJECTS = {
	general: 'Consulta Geral',
	bug: 'Relatório de Erro',
	feature: 'Solicitação de Funcionalidade',
	partnership: 'Parceria',
} as const;

export type ContactSubject = keyof typeof CONTACT_SUBJECTS;

export interface ContactFormData {
	name: string;
	email: string;
	subject: string;
	message: string;
	/**
	 * Campo isca, invisível para quem usa o site. Robô que preenche tudo cai
	 * aqui, e a mensagem é descartada sem alarde.
	 */
	website: string;
}

export type ContactErrors = Partial<Record<keyof ContactFormData, string>>;

export const EMPTY_CONTACT_FORM: ContactFormData = {
	name: '',
	email: '',
	subject: '',
	message: '',
	website: '',
};

export const MIN_NAME_LENGTH = 2;
export const MIN_MESSAGE_LENGTH = 10;

/**
 * Checagem de formato, não de existência: exige algo antes da arroba, um
 * domínio com ponto e nenhum espaço. Validar e-mail além disso rejeita
 * endereços válidos e continua aceitando endereços que não existem.
 */
export const isValidEmail = (value: string): boolean =>
	/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value.trim());

const isKnownSubject = (value: string): value is ContactSubject =>
	Object.prototype.hasOwnProperty.call(CONTACT_SUBJECTS, value);

export const validateContactForm = (data: ContactFormData): ContactErrors => {
	const errors: ContactErrors = {};

	const name = data.name.trim();
	if (!name) errors.name = 'Diga como podemos chamar você.';
	else if (name.length < MIN_NAME_LENGTH) errors.name = 'O nome precisa ter ao menos 2 letras.';

	const email = data.email.trim();
	if (!email) errors.email = 'Precisamos do seu e-mail para responder.';
	else if (!isValidEmail(email)) errors.email = 'Esse e-mail não parece completo. Confira.';

	if (!data.subject) errors.subject = 'Escolha um assunto.';
	else if (!isKnownSubject(data.subject)) errors.subject = 'Escolha um dos assuntos da lista.';

	const message = data.message.trim();
	if (!message) errors.message = 'Escreva sua mensagem.';
	else if (message.length < MIN_MESSAGE_LENGTH) {
		errors.message = `Conte um pouco mais — ao menos ${MIN_MESSAGE_LENGTH} caracteres.`;
	}

	return errors;
};

export const hasErrors = (errors: ContactErrors): boolean => Object.keys(errors).length > 0;

/** Isca preenchida: veio de robô, e a mensagem não deve ser enviada. */
export const looksLikeBot = (data: ContactFormData): boolean => data.website.trim().length > 0;
