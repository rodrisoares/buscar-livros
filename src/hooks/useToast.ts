import { useContext } from 'react';
import { ToastContext } from '@/components/toast/ToastContext';

export const useToast = () => {
	const context = useContext(ToastContext);
	if (context === undefined) {
		throw new Error('useToast deve ser usado dentro de um ToastProvider');
	}
	return context;
};
