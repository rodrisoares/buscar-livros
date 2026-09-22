import { useEffect, useState } from 'react';

/** Adia a propagação do valor até o usuário parar de digitar por `delay` ms. */
export const useDebouncedValue = <T>(value: T, delay = 250): T => {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
};
