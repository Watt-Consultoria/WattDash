'use client';

import { useQueries } from '@tanstack/react-query';
import { ProjectsRepository, projectsKeys, getProject } from '@/repositories/projects.repository';
import { useAccessToken } from '@/repositories/_shared/use-access-token';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import type { Project } from '@/types/projects';

/**
 * Projetos finalizados com feedback pendente do consultor autenticado, do mais recentemente
 * finalizado para o mais antigo — espelha `GET /projects/feedback-status` (`pending_feedbacks`),
 * que é a única fonte de verdade para essa checagem e é restrito a `role: 'consultor'`.
 */
export function usePendingFeedbackProjects() {
  const { profile } = useUserProfile();
  const token = useAccessToken();
  const isConsultant = profile?.role === 'consultor';

  const { data: status, isLoading: isLoadingStatus } =
    ProjectsRepository.useFeedbackStatus(isConsultant);
  const pendingIds = status?.pending_feedbacks ?? [];

  const projectQueries = useQueries({
    queries: pendingIds.map((projectId) => ({
      queryKey: projectsKeys.detail(projectId),
      queryFn: () => getProject(token, projectId),
      enabled: !!token && isConsultant
    }))
  });

  const isLoadingProjects = projectQueries.some((q) => q.isLoading);
  const isLoading = isLoadingStatus || isLoadingProjects;

  // `useQueries` preserva a ordem de `pendingIds`, então a ordenação (mais recente primeiro)
  // que vem da API é mantida aqui.
  const pendingProjects: Project[] = projectQueries
    .map((q) => q.data)
    .filter((project): project is Project => !!project);

  return { pendingProjects, isLoading };
}
