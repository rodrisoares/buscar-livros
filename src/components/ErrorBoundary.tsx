import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/utils/logger';
import Icon from './Icon';

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	error: Error | null;
}

/**
 * Sem isto, qualquer exceção durante o render derruba a árvore inteira e o
 * usuário fica olhando uma página em branco, sem nem saber que houve erro.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		logger.error('[ErrorBoundary] Erro não tratado no render:', error, info.componentStack);
	}

	handleReset = () => {
		this.setState({ error: null });
	};

	render() {
		const { error } = this.state;
		if (!error) return this.props.children;

		return (
			<div className='max-w-2xl mx-auto px-6 py-24 text-center'>
				<div className='w-24 h-24 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-6'>
					<Icon name='alert' className='w-10 h-10' />
				</div>
				<h1 className='text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4'>
					Algo deu errado nesta tela
				</h1>
				<p className='text-gray-600 dark:text-slate-400 mb-8'>
					O erro foi registrado no console. Você pode tentar carregar a página novamente.
				</p>
				<div className='flex items-center justify-center gap-3'>
					<button
						onClick={this.handleReset}
						className='bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium'
					>
						Tentar novamente
					</button>
					<a
						href='/'
						className='border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium'
					>
						Ir para o início
					</a>
				</div>
			</div>
		);
	}
}

export default ErrorBoundary;
