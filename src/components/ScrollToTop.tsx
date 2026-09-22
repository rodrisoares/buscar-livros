import { useEffect, useState } from 'react';

const ScrollToTop = () => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		let frame = 0;

		const toggleVisibility = () => {
			// O evento de scroll dispara dezenas de vezes por segundo; o rAF agrupa
			// tudo em uma leitura por frame.
			if (frame) return;
			frame = window.requestAnimationFrame(() => {
				setIsVisible(window.scrollY > 300);
				frame = 0;
			});
		};

		toggleVisibility();
		window.addEventListener('scroll', toggleVisibility, { passive: true });

		return () => {
			window.removeEventListener('scroll', toggleVisibility);
			if (frame) window.cancelAnimationFrame(frame);
		};
	}, []);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	};

	if (!isVisible) {
		return null;
	}

	return (
		<button
			onClick={scrollToTop}
			data-voltar-ao-topo
			className='fixed bottom-6 right-6 bg-secondary-600 hover:bg-secondary-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 group'
			aria-label='Voltar ao topo'
		>
			<svg
				className='w-6 h-6 transform group-hover:-translate-y-1 transition-transform duration-300'
				fill='none'
				stroke='currentColor'
				viewBox='0 0 24 24'
				aria-hidden='true'
			>
				<path
					strokeLinecap='round'
					strokeLinejoin='round'
					strokeWidth={2}
					d='M5 10l7-7m0 0l7 7m-7-7v18'
				/>
			</svg>
		</button>
	);
};

export default ScrollToTop;
