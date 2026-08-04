'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { useLatestStageReview } from '../lib/stage-review';
import { formatDate } from '../lib/format';
import type { ProjectStage } from '@/types/projects';

interface StageApprovedFilesProps {
  projectId: string;
  stageId: string;
}

/** Arquivos da submissão aprovada mais recente da etapa — vazio se nenhuma foi aprovada ainda. */
function StageApprovedFiles({ projectId, stageId }: StageApprovedFilesProps) {
  const { reviews, isLoading: isLoadingReviews } = useLatestStageReview(projectId, stageId);
  const approvedReview = reviews.find((r) => r.approved) ?? null;

  const { data: submission, isLoading: isLoadingSubmission } = ProjectsRepository.useSubmission(
    projectId,
    stageId,
    approvedReview?.submission_id ?? null
  );

  if (isLoadingReviews || (approvedReview && isLoadingSubmission)) {
    return <Skeleton className='h-7 w-full' />;
  }

  if (!approvedReview || !submission) {
    return <p className='text-muted-foreground text-xs'>Nenhum arquivo aprovado ainda.</p>;
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {submission.files.map((file) => (
        <a
          key={file.id}
          href={file.signed_url}
          target='_blank'
          rel='noopener noreferrer'
          className='hover:bg-muted inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs transition-colors'
        >
          <Icons.paperclip className='size-3' />
          {file.name}
        </a>
      ))}
    </div>
  );
}

interface ProjectReviewFilesProps {
  projectId: string;
  stages: ProjectStage[];
}

/** Tela de revisão do diretor: todas as etapas do projeto com os últimos arquivos aprovados de cada uma. */
export function ProjectReviewFiles({ projectId, stages }: ProjectReviewFilesProps) {
  const sorted = stages.toSorted((a, b) => a.position - b.position);

  if (sorted.length === 0) {
    return <p className='text-muted-foreground text-sm'>Nenhuma etapa cadastrada.</p>;
  }

  return (
    <ul className='space-y-2'>
      {sorted.map((stage) => (
        <li key={stage.id} className='rounded-lg border p-3'>
          <div className='flex items-center justify-between gap-2'>
            <p className='truncate text-sm font-medium'>
              {stage.position}. {stage.name}
            </p>
            <span className='text-muted-foreground shrink-0 text-xs'>
              {formatDate(stage.delivery_date)}
            </span>
          </div>
          <div className='mt-2'>
            <StageApprovedFiles projectId={projectId} stageId={stage.id} />
          </div>
        </li>
      ))}
    </ul>
  );
}
