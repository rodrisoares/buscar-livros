import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clampGoalTarget, type ReadingGoal } from '@/types/Goal';
import { getGoals, saveGoal } from '@/services/goalsApi';
import { queryKeys } from '@/lib/queryKeys';
import { logger } from '@/utils/logger';
import { useToast } from './useToast';

export const useReadingGoal = (year: number = new Date().getFullYear()) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	const { data: goals = [], isLoading } = useQuery({
		queryKey: queryKeys.goals,
		queryFn: ({ signal }) => getGoals(signal),
	});

	const goal = goals.find((item) => item.year === year);

	const mutation = useMutation<ReadingGoal, Error, number>({
		mutationFn: (target) => saveGoal(year, target, goal),
		onSuccess: () => {
			showToast({ message: 'Meta de leitura atualizada.', variant: 'success' });
			queryClient.invalidateQueries({ queryKey: queryKeys.goals });
		},
		onError: (error) => {
			logger.error('[useReadingGoal] Falha ao salvar a meta:', error);
			showToast({ message: 'Não foi possível salvar a meta. Tente novamente.', variant: 'error' });
		},
	});

	/**
	 * O teto é aplicado aqui, e não só no formulário: é a última porta antes da
	 * API, e vale para qualquer tela que venha a gravar uma meta.
	 */
	const setTarget = useCallback(
		(target: number) => mutation.mutate(clampGoalTarget(target)),
		[mutation]
	);

	return {
		year,
		/** Todas as metas já registradas — é o que alimenta o seletor de ano. */
		goals,
		goal,
		target: goal?.target ?? 0,
		isLoading,
		isSaving: mutation.isPending,
		setTarget,
	};
};
