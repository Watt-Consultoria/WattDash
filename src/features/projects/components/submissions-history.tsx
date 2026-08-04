'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { formatDateTime } from '../lib/format';
import type { Deliverable, StageReview } from '@/types/projects';

interface SubmissionDetailProps {
  projectId: string;
  stageId: string;
  submissionId: string;
}

function SubmissionDetail({ projectId, stageId, submissionId }: SubmissionDetailProps) {
  const { data, isLoading } = ProjectsRepository.useSubmission(projectId, stageId, submissionId);

  if (isLoading) return <Skeleton className='h-8 w-full' />;
  if (!data) return null;

  return (
    <div className='flex flex-wrap gap-2'>
      {data.files.map((file) => (
        <a
          key={file.id}
          href={file.signed_url}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-muted'
        >
          <Icons.paperclip className='size-3' />
          {file.name}
        </a>
      ))}
    </div>
  );
}

function ReviewStatusBadge({ review }: { review: StageReview | undefined }) {
  if (!review) {
    return (
      <Badge
        variant='outline'
        className='border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      >
        <Icons.clock className='size-3' />
        Aguardando revisão
      </Badge>
    );
  }

  return review.approved ? (
    <Badge
      variant='outline'
      className='border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400'
    >
      <Icons.circleCheck className='size-3' />
      Aprovada
    </Badge>
  ) : (
    <Badge
      variant='outline'
      className='border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    >
      <Icons.warning className='size-3' />
      Reprovada
    </Badge>
  );
}

interface SubmissionsHistoryProps {
  projectId: string;
  stageId: string;
  deliverables: Deliverable[];
}

export function SubmissionsHistory({ projectId, stageId, deliverables }: SubmissionsHistoryProps) {
  const { data: submissions, isLoading: isLoadingSubmissions } = ProjectsRepository.useSubmissions(
    projectId,
    stageId
  );
  const { data: reviews = [], isLoading: isLoadingReviews } = ProjectsRepository.useStageReviews(
    projectId,
    stageId
  );
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoadingSubmissions || isLoadingReviews) {
    return (
      <div className='space-y-2'>
        <Skeleton className='h-10 w-full' />
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return <p className='text-muted-foreground text-sm'>Nenhuma submissão ainda.</p>;
  }

  const sorted = submissions.toSorted((a, b) => b.attempt - a.attempt);

  return (
    <ul className='space-y-2'>
      {sorted.map((submission) => {
        const review = reviews.find((r) => r.submission_id === submission.id);
        const isOpen = openId === submission.id;

        return (
          <li key={submission.id} className='rounded-lg border p-3 text-sm'>
            <button
              type='button'
              onClick={() => setOpenId((prev) => (prev === submission.id ? null : submission.id))}
              className='flex w-full flex-wrap items-center justify-between gap-2 text-left'
            >
              <span className='flex flex-wrap items-center gap-2'>
                <span className='font-medium'>Tentativa {submission.attempt}</span>
                <ReviewStatusBadge review={review} />
              </span>
              <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                {formatDateTime(submission.submitted_at)}
                {isOpen ? (
                  <Icons.chevronUp className='size-3.5' />
                ) : (
                  <Icons.chevronDown className='size-3.5' />
                )}
              </span>
            </button>

            {submission.notes && (
              <p className='text-muted-foreground mt-1.5'>
                <span className='font-medium'>Notas do envio:</span> {submission.notes}
              </p>
            )}

            {isOpen && (
              <div className='mt-2.5 space-y-2.5 border-t pt-2.5'>
                <SubmissionDetail
                  projectId={projectId}
                  stageId={stageId}
                  submissionId={submission.id}
                />

                {review && (
                  <div className='rounded-md bg-muted/30 p-2.5 text-xs'>
                    <p className='font-medium'>
                      {review.approved ? 'Aprovada' : 'Reprovada'} em{' '}
                      {formatDateTime(review.reviewed_at)}
                    </p>
                    {review.notes && <p className='text-muted-foreground mt-0.5'>{review.notes}</p>}
                    {!review.approved && review.rework_deliverable_ids && (
                      <p className='text-muted-foreground mt-0.5'>
                        Entregáveis para reenvio:{' '}
                        {review.rework_deliverable_ids
                          .map((id) => deliverables.find((d) => d.id === id)?.name ?? id)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
