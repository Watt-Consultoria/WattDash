'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/components/icons';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { UserRepository } from '@/repositories/users.repository';
import { StageStatusBadge } from './stage-status-badge';
import { StageReviewAlert } from './stage-review-alert';
import { ProjectStageFormDialog } from './project-stage-form-dialog';
import { StageSubmissionDialog } from './stage-submission-dialog';
import { StageReviewDialog } from './stage-review-dialog';
import { SubmissionsHistory } from './submissions-history';
import { formatDate } from '../lib/format';
import { useLatestStageReview } from '../lib/stage-review';
import type { Project, ProjectStage } from '@/types/projects';
import type { ProjectCapabilities } from '../lib/permissions';

interface StageCardProps {
  projectId: string;
  projectDeliveryDate: string;
  stage: ProjectStage;
  consultantName: string;
  capabilities: ProjectCapabilities;
}

function StageCard({
  projectId,
  projectDeliveryDate,
  stage,
  consultantName,
  capabilities
}: StageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { latest } = useLatestStageReview(projectId, stage.id);
  const needsRework = stage.status === 'pendente' && !!latest && !latest.approved;

  const canEdit = capabilities.canManageStages && stage.status === 'pendente';
  const canSubmit = capabilities.canSubmitStage(stage);
  const canReview = capabilities.canReviewStage(stage);

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
        <span className='min-w-0 flex-1 truncate text-sm font-medium'>
          {stage.position}. {stage.name}
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
              onResubmit={canSubmit ? () => setSubmitOpen(true) : undefined}
            />
          )}

          {stage.description && <p className='text-muted-foreground'>{stage.description}</p>}

          <div className='grid grid-cols-2 gap-2 text-xs sm:grid-cols-3'>
            <div>
              <p className='text-muted-foreground'>Consultor</p>
              <p className='font-medium'>{consultantName}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Entrega</p>
              <p className='font-medium'>{formatDate(stage.delivery_date)}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Prazo</p>
              <p className='font-medium'>{formatDate(stage.deadline_date)}</p>
            </div>
          </div>

          <div className='space-y-1'>
            <p className='text-muted-foreground text-xs'>
              Entregáveis ({stage.deliverables.length})
            </p>
            <ul className='space-y-0.5'>
              {stage.deliverables.map((d) => (
                <li key={d.id} className='flex items-baseline gap-1.5'>
                  <span className='font-medium'>{d.name}</span>
                  {d.description && (
                    <span className='text-muted-foreground text-xs'>— {d.description}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div className='flex flex-wrap gap-2'>
            {canEdit && (
              <Button size='sm' variant='outline' onClick={() => setEditOpen(true)}>
                <Icons.edit className='mr-1.5 size-3.5' />
                Editar
              </Button>
            )}
            {canSubmit && (
              <Button size='sm' onClick={() => setSubmitOpen(true)}>
                <Icons.upload className='mr-1.5 size-3.5' />
                {needsRework ? 'Reenviar Entrega' : 'Enviar Entrega'}
              </Button>
            )}
            {canReview && (
              <Button size='sm' onClick={() => setReviewOpen(true)}>
                <Icons.checks className='mr-1.5 size-3.5' />
                Revisar Entrega
              </Button>
            )}
            <Button size='sm' variant='ghost' onClick={() => setHistoryOpen((v) => !v)}>
              <Icons.post className='mr-1.5 size-3.5' />
              {historyOpen ? 'Ocultar Submissões' : 'Ver Submissões'}
            </Button>
          </div>

          {historyOpen && (
            <div className='rounded-md bg-muted/20 p-2'>
              <SubmissionsHistory
                projectId={projectId}
                stageId={stage.id}
                deliverables={stage.deliverables}
              />
            </div>
          )}
        </div>
      )}

      <ProjectStageFormDialog
        projectId={projectId}
        projectDeliveryDate={projectDeliveryDate}
        stage={stage}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <StageSubmissionDialog
        projectId={projectId}
        stage={stage}
        open={submitOpen}
        onOpenChange={setSubmitOpen}
      />
      <StageReviewDialog
        projectId={projectId}
        stage={stage}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
      />
    </li>
  );
}

interface StagesSectionProps {
  project: Project;
  capabilities: ProjectCapabilities;
}

export function StagesSection({ project, capabilities }: StagesSectionProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: stages, isLoading } = ProjectsRepository.useStages(project.id);
  const { data: users = [] } = UserRepository.useSelectable();

  const consultantName = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const sorted = (stages ?? []).toSorted((a, b) => a.position - b.position);
  const doneCount = sorted.filter((s) => s.status === 'concluida').length;
  const progress = sorted.length > 0 ? Math.round((doneCount / sorted.length) * 100) : 0;

  return (
    <div className='space-y-3 rounded-xl border bg-card p-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-sm font-semibold'>Etapas</h3>
          {sorted.length > 0 && (
            <p className='text-muted-foreground text-xs'>
              {doneCount} de {sorted.length} concluídas
            </p>
          )}
        </div>
        {capabilities.canManageStages && (
          <Button size='sm' variant='outline' onClick={() => setCreateOpen(true)}>
            <Icons.add className='mr-1.5 size-4' />
            Nova Etapa
          </Button>
        )}
      </div>

      {sorted.length > 0 && <Progress value={progress} className='h-1.5' />}

      {isLoading ? (
        <div className='space-y-2'>
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
        </div>
      ) : sorted.length === 0 ? (
        <p className='text-muted-foreground text-sm'>Nenhuma etapa cadastrada ainda.</p>
      ) : (
        <ul className='space-y-2'>
          {sorted.map((stage) => (
            <StageCard
              key={stage.id}
              projectId={project.id}
              projectDeliveryDate={project.delivery_date}
              stage={stage}
              consultantName={consultantName(stage.consultant_id)}
              capabilities={capabilities}
            />
          ))}
        </ul>
      )}

      <ProjectStageFormDialog
        projectId={project.id}
        projectDeliveryDate={project.delivery_date}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
