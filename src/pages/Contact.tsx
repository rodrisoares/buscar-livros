import React, { useRef, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { env } from '@/config/env';
import { request } from '@/lib/http';
import {
	CONTACT_SUBJECTS,
	EMPTY_CONTACT_FORM,
	hasErrors,
	looksLikeBot,
	validateContactForm,
	type ContactErrors,
	type ContactFormData,
} from '@/lib/contactForm';
import { logger } from '@/utils/logger';
import Icon from '@/components/Icon';
import Accordion from '@/components/Accordion';
import { FAQ_ITEMS } from '@/data/faq';

const CONTACT_EMAIL = 'contato@buscarlivros.com';
const CONTACT_ENDPOINT = env.contactEndpoint;

type FormStatus = 'idle' | 'sending';

const Contact: React.FC = () => {
	useDocumentTitle('Contato');

	const { showToast } = useToast();
	const [formData, setFormData] = useState<ContactFormData>(EMPTY_CONTACT_FORM);
	const [errors, setErrors] = useState<ContactErrors>({});
	const [status, setStatus] = useState<FormStatus>('idle');
	const [openFaq, setOpenFaq] = useState<number | null>(null);
	const faqRef = useRef<HTMLDivElement>(null);
	const formRef = useRef<HTMLFormElement>(null);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));

		// O aviso some assim que o campo é corrigido, sem esperar outro envio.
		setErrors((prev) => {
			if (!prev[name as keyof ContactFormData]) return prev;
			const next = { ...prev };
			delete next[name as keyof ContactFormData];
			return next;
		});
	};

	/**
	 * Sem endpoint configurado (VITE_CONTACT_ENDPOINT), a mensagem é aberta no
	 * cliente de e-mail do usuário — melhor do que um alert() que não envia nada.
	 */
	const sendByEmailClient = () => {
		const subject = CONTACT_SUBJECTS[formData.subject as keyof typeof CONTACT_SUBJECTS];
		const body = `Nome: ${formData.name}\nE-mail: ${formData.email}\n\n${formData.message}`;

		window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
			`[Buscar Livros] ${subject}`
		)}&body=${encodeURIComponent(body)}`;

		showToast({
			message: 'Abrimos seu aplicativo de e-mail com a mensagem preenchida.',
			variant: 'info',
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (status === 'sending') return;

		const found = validateContactForm(formData);
		setErrors(found);

		if (hasErrors(found)) {
			// Leva o foco ao primeiro campo com problema, para quem usa teclado ou
			// leitor de tela não ter que caçar o aviso.
			const first = Object.keys(found)[0];
			formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
			return;
		}

		// Robô caiu na isca: fingimos sucesso e não enviamos nada.
		if (looksLikeBot(formData)) {
			setFormData(EMPTY_CONTACT_FORM);
			showToast({ message: 'Mensagem enviada! Responderemos em até 24 horas.', variant: 'success' });
			return;
		}

		if (!CONTACT_ENDPOINT) {
			sendByEmailClient();
			return;
		}

		setStatus('sending');

		try {
			await request(CONTACT_ENDPOINT, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				// A isca não é dado do usuário e não vai junto.
				body: JSON.stringify({
					name: formData.name,
					email: formData.email,
					subject: formData.subject,
					message: formData.message,
				}),
			});

			showToast({
				message: 'Mensagem enviada! Responderemos em até 24 horas.',
				variant: 'success',
			});
			setFormData(EMPTY_CONTACT_FORM);
		} catch (error) {
			logger.error('[Contact] Falha ao enviar a mensagem:', error);
			showToast({
				message: 'Não foi possível enviar agora. Tente novamente ou use o e-mail ao lado.',
				variant: 'error',
			});
		} finally {
			setStatus('idle');
		}
	};

	const openFaqSection = () => {
		setOpenFaq(0);
		faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const fieldClasses = (field: keyof ContactFormData) =>
		`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:border-transparent transition-colors ${
			errors[field]
				? 'border-red-500 dark:border-red-500 focus:ring-red-500'
				: 'border-gray-300 dark:border-slate-600 focus:ring-primary-500'
		}`;

	/** Props de acessibilidade que todo campo com aviso precisa repetir. */
	const errorProps = (field: keyof ContactFormData) => ({
		'aria-invalid': Boolean(errors[field]),
		'aria-describedby': errors[field] ? `erro-${field}` : undefined,
	});

	const FieldError: React.FC<{ field: keyof ContactFormData }> = ({ field }) =>
		errors[field] ? (
			<p id={`erro-${field}`} role='alert' className='mt-1 text-sm text-red-700 dark:text-red-400'>
				{errors[field]}
			</p>
		) : null;

	const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2';

	return (
		<div className='max-w-4xl mx-auto px-6 py-12'>
			<div className='text-center mb-12'>
				<h1 className='text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4'>Entre em Contato</h1>
				<p className='text-xl text-gray-600 dark:text-slate-400'>
					Tem alguma pergunta ou sugestão? Adoraríamos ouvir você!
				</p>
			</div>

			<div className='grid md:grid-cols-2 gap-12'>
				{/* Contact Form */}
				<div>
					<h2 className='text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-6'>
						Envie-nos uma mensagem
					</h2>

					{/* noValidate: a validação é nossa, senão o navegador mostra os
					    próprios balões e as mensagens abaixo nunca apareceriam. */}
					<form ref={formRef} onSubmit={handleSubmit} noValidate className='space-y-6'>
						<div>
							<label htmlFor='name' className={labelClasses}>
								Nome
							</label>
							<input
								type='text'
								id='name'
								name='name'
								value={formData.name}
								onChange={handleChange}
								className={fieldClasses('name')}
								{...errorProps('name')}
							/>
							<FieldError field='name' />
						</div>

						<div>
							<label htmlFor='email' className={labelClasses}>
								Email
							</label>
							<input
								type='email'
								id='email'
								name='email'
								value={formData.email}
								onChange={handleChange}
								className={fieldClasses('email')}
								{...errorProps('email')}
							/>
							<FieldError field='email' />
						</div>

						<div>
							<label htmlFor='subject' className={labelClasses}>
								Assunto
							</label>
							<select
								id='subject'
								name='subject'
								value={formData.subject}
								onChange={handleChange}
								className={fieldClasses('subject')}
								{...errorProps('subject')}
							>
								<option value=''>Selecione um assunto</option>
								{Object.entries(CONTACT_SUBJECTS).map(([value, label]) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</select>
							<FieldError field='subject' />
						</div>

						<div>
							<label htmlFor='message' className={labelClasses}>
								Mensagem
							</label>
							<textarea
								id='message'
								name='message'
								value={formData.message}
								onChange={handleChange}
								rows={6}
								className={`${fieldClasses('message')} resize-none`}
								{...errorProps('message')}
							/>
							<FieldError field='message' />
						</div>

						{/* Isca antirrobô: fora da tela, fora da tabulação e fora do leitor
						    de tela. Só um preenchedor automático encosta aqui. */}
						<div className='hidden' aria-hidden='true'>
							<label htmlFor='website'>Não preencha este campo</label>
							<input
								type='text'
								id='website'
								name='website'
								value={formData.website}
								onChange={handleChange}
								tabIndex={-1}
								autoComplete='off'
							/>
						</div>

						<button
							type='submit'
							disabled={status === 'sending'}
							className='w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-wait'
						>
							{status === 'sending' ? 'Enviando...' : 'Enviar Mensagem'}
						</button>

						{!CONTACT_ENDPOINT && (
							<p className='text-xs text-gray-600 dark:text-slate-400'>
								O envio abre seu aplicativo de e-mail. Para enviar direto pelo site, configure
								<code className='mx-1 px-1 bg-gray-100 dark:bg-slate-700 rounded'>VITE_CONTACT_ENDPOINT</code>
								com o endereço do seu formulário.
							</p>
						)}
					</form>
				</div>

				{/* Contact Information */}
				<div>
					<h2 className='text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-6'>
						Entre em contato
					</h2>

					<div className='space-y-6'>
						<div className='flex items-start'>
							<div className='w-12 h-12 bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0'>
								<Icon name='mail' className='w-6 h-6' />
							</div>
							<div>
								<h3 className='font-medium text-gray-900 dark:text-slate-100'>Email</h3>
								<a
									href={`mailto:${CONTACT_EMAIL}`}
									className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline underline-offset-2'
								>
									{CONTACT_EMAIL}
								</a>
							</div>
						</div>

						<div className='flex items-start'>
							<div className='w-12 h-12 bg-secondary-100 dark:bg-secondary-950 text-secondary-600 dark:text-secondary-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0'>
								<Icon name='clock' className='w-6 h-6' />
							</div>
							<div>
								<h3 className='font-medium text-gray-900 dark:text-slate-100'>Tempo de Resposta</h3>
								<p className='text-gray-600 dark:text-slate-400'>Normalmente respondemos em 24 horas</p>
							</div>
						</div>
					</div>

					<div className='mt-8 p-6 bg-gray-50 dark:bg-slate-800 rounded-lg'>
						<h3 className='font-medium text-gray-900 dark:text-slate-100 mb-3'>Perguntas Frequentes</h3>
						<p className='text-sm text-gray-600 dark:text-slate-400 mb-3'>
							Antes de entrar em contato, veja se sua dúvida já está respondida abaixo.
						</p>
						<button
							type='button'
							onClick={openFaqSection}
							className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium'
						>
							Ver FAQ →
						</button>
					</div>
				</div>
			</div>

			{/* FAQ */}
			<div ref={faqRef} className='mt-16 border-t border-gray-200 dark:border-slate-700 pt-8 scroll-mt-8'>
				<h2 className='text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-6'>
					Perguntas Frequentes
				</h2>

				<Accordion
					items={FAQ_ITEMS}
					openIndex={openFaq}
					onOpenChange={setOpenFaq}
					headingLevel='h3'
				/>
			</div>
		</div>
	);
};

export default Contact;
