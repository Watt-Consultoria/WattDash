'use client';

import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { apiGet } from '@/lib/api-client';
import { ProjectsRepository, projectsKeys } from '@/repositories/projects.repository';
import { useAccessToken } from '@/repositories/_shared/use-access-token';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { StageStatusBadge } from './stage-status-badge';
import { StageReviewAlert } from './stage-review-alert';
import { StageSubmissionDialog } from './stage-submission-dialog';
import { SubmissionsHistory } from './submissions-history';
import { formatDate } from '../lib/format';
import { useLatestStageReview } from '../lib/stage-review';
import type { ProjectStage } from '@/types/projects';

// pendente/em_revisao (aguardando ação) aparecem antes de concluida
const STATUS_PRIORITY: Record<ProjectStage['status'], number> = {
  pendente: 0,
  em_revisao: 0,
  concluida: 1
};

interface MyStageRowProps {
  stage: ProjectStage;
  projectName: string;
}

function MyStageRow({ stage, projectName }: MyStageRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const { latest } = useLatestStageReview(stage.project_id, stage.id);
  const needsRework = stage.status === 'pendente' && !!latest && !latest.approved;

  return (
    <li
      className={
        needsRework
          ? 'rounded-lg border border-orange-300 dark:border-orange-800'
          : 'rounded-lg border'
      }
    >
      <button
        type='button'
        onClick={() => setExpanded((v) => !v)}
        className='flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left'
      >
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-sm font-medium'>{stage.name}</span>
          <span className='text-muted-foreground block truncate text-xs'>{projectName}</span>
        </span>
        <span className='flex shrink-0 items-center gap-2'>
          {needsRework && (
            <span className='hidden items-center gap-1 text-xs font-medium text-orange-600 sm:inline-flex dark:text-orange-400'>
              <Icons.warning className='size-3.5' />
              Ação necessária
            </span>
          )}
          <StageStatusBadge status={stage.status} />
          {expanded ? (
            <Icons.chevronUp className='text-muted-foreground size-4' />
          ) : (
            <Icons.chevronDown className='text-muted-foreground size-4' />
          )}
        </span>
      </button>

      {expanded && (
        <div className='space-y-3.5 border-t px-3 py-3 text-sm'>
          {needsRework && (
            <StageReviewAlert
              review={latest!}
              deliverables={stage.deliverables}
              onResubmit={() => setSubmitOpen(true)}
            />
          )}

          <div className='grid grid-cols-2 gap-2 text-xs'>
            <div>
              <p className='text-muted-foreground'>Entrega</p>
              <p className='font-medium'>{formatDate(stage.delivery_date)}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Prazo</p>
              <p className='font-medium'>{formatDate(stage.deadline_date)}</p>
            </div>
          </div>

          <ul className='space-y-0.5'>
            {stage.deliverables.map((d) => (
              <li key={d.id} className='text-xs'>
                <span className='font-medium'>{d.name}</span>
                {d.description && <span className='text-muted-foreground'> — {d.description}</span>}
              </li>
            ))}
          </ul>

          {stage.status === 'pendente' && (
            <Button size='sm' onClick={() => setSubmitOpen(true)}>
              <Icons.upload className='mr-1.5 size-3.5' />
              {needsRework ? 'Reenviar Entrega' : 'Enviar Entrega'}
            </Button>
          )}

          <SubmissionsHistory
            projectId={stage.project_id}
            stageId={stage.id}
            deliverables={stage.deliverables}
          />
        </div>
      )}

      <StageSubmissionDialog
        projectId={stage.project_id}
        stage={stage}
        open={submitOpen}
        onOpenChange={setSubmitOpen}
      />
    </li>
  );
}

export function MyStagesTab() {
  const { profile } = useUserProfile();
  const token = useAccessToken();
  const myId = profile?.id;

  const { data: projects = [], isLoading: isLoadingProjects } = ProjectsRepository.useProjects(
    myId ? { consultant_id: myId } : {}
  );

  const stageQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: projectsKeys.stages(project.id, { consultant_id: myId }),
      queryFn: () =>
        apiGet<ProjectStage[]>(`/projects/${project.id}/stages?consultant_id=${myId}`, token),
      enabled: !!token && !!myId
    }))
  });

  const isLoading = isLoadingProjects || stageQueries.some((q) => q.isLoading);

  if (isLoading) {
    return (
      <div className='space-y-2'>
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-12 w-full' />
      </div>
    );
  }

  const rows = stageQueries.flatMap((query, index) => {
    const project = projects[index];
    return (query.data ?? []).map((stage) => ({ stage, projectName: project.name }));
  });

  rows.sort((a, b) => {
    const priorityDiff = STATUS_PRIORITY[a.stage.status] - STATUS_PRIORITY[b.stage.status];
    if (priorityDiff !== 0) return priorityDiff;
    return a.stage.delivery_date.localeCompare(b.stage.delivery_date);
  });

  if (rows.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center'>
        <div className='bg-muted flex size-14 items-center justify-center rounded-full'>
          <Icons.checks className='text-muted-foreground size-6' />
        </div>
        <div>
          <p className='font-medium'>Nenhuma etapa atribuída</p>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            Você ainda não foi atribuído a nenhuma etapa de projeto.
          </p>
        </div>
      </div>
    );
  }

  const pendingRows = rows.filter((r) => r.stage.status !== 'concluida');
  const doneRows = rows.filter((r) => r.stage.status === 'concluida');

  return (
    <div className='space-y-5'>
      {pendingRows.length > 0 && (
        <div className='space-y-2'>
          <h3 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
            Pendentes ({pendingRows.length})
          </h3>
          <ul className='space-y-2'>
            {pendingRows.map(({ stage, projectName }) => (
              <MyStageRow key={stage.id} stage={stage} projectName={projectName} />
            ))}
          </ul>
        </div>
      )}

      {doneRows.length > 0 && (
        <div className='space-y-2'>
          <h3 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
            Concluídas ({doneRows.length})
          </h3>
          <ul className='space-y-2'>
            {doneRows.map(({ stage, projectName }) => (
              <MyStageRow key={stage.id} stage={stage} projectName={projectName} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
