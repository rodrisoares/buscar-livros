import { createContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastAction {
	label: string;
	onClick: () => void;
}

export interface Toast {
	id: number;
	message: string;
	variant: ToastVariant;
	action?: ToastAction;
	duration: number;
}

export interface ToastInput {
	message: string;
	variant?: ToastVariant;
	action?: ToastAction;
	/** Milissegundos até sumir sozinho. 0 mantém o toast até o usuário fechar. */
	duration?: number;
}

export interface ToastContextValue {
	showToast: (toast: ToastInput) => number;
	dismissToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
