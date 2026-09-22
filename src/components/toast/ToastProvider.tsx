import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { ToastContext, type Toast, type ToastInput } from './ToastContext';

const VARIANT_STYLES: Record<Toast['variant'], string> = {
	success: 'bg-slate-900 text-white',
	error: 'bg-red-600 text-white',
	info: 'bg-slate-800 text-white',
};

let nextId = 1;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
	const [toasts, setToasts] = useState<Toast[]>([]);
	const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

	const dismissToast = useCallback((id: number) => {
		const timer = timers.current.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.current.delete(id);
		}
		setToasts((current) => current.filter((toast) => toast.id !== id));
	}, []);

	const showToast = useCallback(
		({ message, variant = 'info', action, duration = 5000 }: ToastInput) => {
			const id = nextId++;
			setToasts((current) => [...current, { id, message, variant, action, duration }]);

			if (duration > 0) {
				timers.current.set(
					id,
					setTimeout(() => dismissToast(id), duration)
				);
			}

			return id;
		},
		[dismissToast]
	);

	// Evita timers pendurados se o provider sair da árvore.
	const timersRef = timers;
	useEffect(() => {
		const map = timersRef.current;
		return () => {
			map.forEach((timer) => clearTimeout(timer));
			map.clear();
		};
	}, [timersRef]);

	const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

	return (
		<ToastContext.Provider value={value}>
			{children}

			<div
				className='fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-3 w-[calc(100%-2rem)] max-w-md'
				role='region'
				aria-label='Notificações'
			>
				{toasts.map((toast) => (
					<div
						key={toast.id}
						role={toast.variant === 'error' ? 'alert' : 'status'}
						aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
						className={`w-full flex items-center gap-4 rounded-lg px-4 py-3 shadow-lg text-sm ${VARIANT_STYLES[toast.variant]}`}
					>
						<span className='flex-1'>{toast.message}</span>

						{toast.action && (
							<button
								type='button'
								onClick={() => {
									toast.action?.onClick();
									dismissToast(toast.id);
								}}
								className='font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap'
							>
								{toast.action.label}
							</button>
						)}

						<button
							type='button'
							onClick={() => dismissToast(toast.id)}
							aria-label='Fechar notificação'
							className='opacity-70 hover:opacity-100 transition-opacity'
						>
							<Icon name='x' className='w-4 h-4' />
						</button>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
};

export default ToastProvider;
