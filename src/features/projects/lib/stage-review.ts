import { ProjectsRepository } from '@/repositories/projects.repository';
import type { Deliverable, StageReview } from '@/types/projects';

/** Retorna a revisão mais recente de uma etapa (por `reviewed_at`), ou `null` se não houver. */
export function useLatestStageReview(projectId: string, stageId: string) {
  const { data: reviews = [], isLoading } = ProjectsRepository.useStageReviews(projectId, stageId);

  const sorted = reviews.toSorted(
    (a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime()
  );

  return { latest: sorted[0] ?? null, reviews: sorted, isLoading };
}

/** Resolve os ids de entregáveis marcados para reenvio em uma revisão para os nomes correspondentes. */
export function resolveReworkNames(review: StageReview, deliverables: Deliverable[]): string[] {
  const ids = review.rework_deliverable_ids ?? [];
  return ids.map((id) => deliverables.find((d) => d.id === id)?.name ?? id);
}
