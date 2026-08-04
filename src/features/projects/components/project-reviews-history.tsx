'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { formatDateTime } from '../lib/format';

interface ProjectReviewsHistoryProps {
  projectId: string;
}

export function ProjectReviewsHistory({ projectId }: ProjectReviewsHistoryProps) {
  const { data: reviews, isLoading } = ProjectsRepository.useProjectReviews(projectId);

  if (isLoading) {
    return (
      <div className='space-y-2'>
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-12 w-full' />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return <p className='text-muted-foreground text-sm'>Nenhuma revisão de diretoria ainda.</p>;
  }

  const sorted = [...reviews].sort((a, b) => b.round - a.round);

  return (
    <ul className='space-y-2'>
      {sorted.map((review) => (
        <li
          key={review.id}
          className={
            review.approved
              ? 'rounded-lg border-l-4 border-l-green-500 border-y border-r p-3 text-sm'
              : 'rounded-lg border-l-4 border-l-destructive border-y border-r p-3 text-sm'
          }
        >
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <span className='flex items-center gap-1.5 font-medium'>
              {review.approved ? (
                <Icons.circleCheck className='size-4 text-green-500' />
              ) : (
                <Icons.circleX className='size-4 text-destructive' />
              )}
              Rodada {review.round} — {review.approved ? 'Aprovado' : 'Reprovado'}
            </span>
            <span className='text-muted-foreground text-xs'>
              {formatDateTime(review.reviewed_at)}
            </span>
          </div>
          {review.notes && <p className='text-muted-foreground mt-1.5'>{review.notes}</p>}
        </li>
      ))}
    </ul>
  );
}
