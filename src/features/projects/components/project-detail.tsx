'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { LeadsRepository } from '@/repositories/leads.repository';
import { PortfolioRepository } from '@/repositories/portfolio.repository';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { getProjectCapabilities } from '../lib/permissions';
import { formatDate, isOverdue } from '../lib/format';
import { cn } from '@/lib/utils';
import { ProjectStatusStepper } from './project-status-stepper';
import { StagesSection } from './stages-section';
import { ProjectReviewFiles } from './project-review-files';
import { ProjectReviewsHistory } from './project-reviews-history';
import { SubmitForReviewDialog } from './submit-for-review-dialog';
import { ProjectReviewDialog } from './project-review-dialog';
import { CloseProjectDialog } from './close-project-dialog';
import { ProjectFeedbackList } from './project-feedback-list';

interface ProjectDetailProps {
  projectId: string;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const { profile } = useUserProfile();
  const { data: project, isLoading } = ProjectsRepository.useProject(projectId);
  const { data: stages = [] } = ProjectsRepository.useStages(projectId);
  const { data: leads = [] } = LeadsRepository.useList();
  const { data: portfolioItems = [] } = PortfolioRepository.useList();

  const [submitOpen, setSubmitOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  if (isLoading || !project) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-28 w-full rounded-xl' />
        <Skeleton className='h-40 w-full rounded-xl' />
      </div>
    );
  }

  const capabilities = getProjectCapabilities(profile, project);
  const leadName = leads.find((l) => l.id === project.lead_id)?.company_name ?? project.lead_id;
  const typeName =
    portfolioItems.find((p) => p.id === project.project_type_id)?.name ?? project.project_type_id;

  const showReviewsHistory = project.status !== 'em_andamento';
  const showFeedback = project.status === 'finalizado';
  const deliveryLate = project.status === 'em_andamento' && isOverdue(project.delivery_date);

  const hasActions =
    capabilities.canManageStages || capabilities.canReviewProject || capabilities.canClose;

  return (
    <div className='space-y-4'>
      <div className='space-y-4 rounded-xl border bg-card p-4 sm:p-5'>
        <div className='min-w-0'>
          <h2 className='truncate text-lg font-semibold'>{project.name}</h2>
          {project.description && (
            <p className='text-muted-foreground mt-0.5 text-sm'>{project.description}</p>
          )}
        </div>

        <div className='overflow-x-auto pb-1'>
          <ProjectStatusStepper status={project.status} />
        </div>

        <Separator />

        <div className='grid grid-cols-2 gap-4 text-sm sm:grid-cols-4'>
          <div className='flex items-start gap-2'>
            <Icons.building className='text-muted-foreground mt-0.5 size-4 shrink-0' />
            <div className='min-w-0'>
              <p className='text-muted-foreground text-xs'>Lead</p>
              <p className='truncate font-medium'>{leadName}</p>
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <Icons.tag className='text-muted-foreground mt-0.5 size-4 shrink-0' />
            <div className='min-w-0'>
              <p className='text-muted-foreground text-xs'>Tipo</p>
              <p className='truncate font-medium'>{typeName}</p>
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <Icons.calendar
              className={cn(
                'mt-0.5 size-4 shrink-0',
                deliveryLate ? 'text-destructive' : 'text-muted-foreground'
              )}
            />
            <div className='min-w-0'>
              <p className='text-muted-foreground text-xs'>Entrega</p>
              <p className={cn('font-medium', deliveryLate && 'text-destructive')}>
                {formatDate(project.delivery_date)}
                {deliveryLate && ' · Atrasada'}
              </p>
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <Icons.clock className='text-muted-foreground mt-0.5 size-4 shrink-0' />
            <div className='min-w-0'>
              <p className='text-muted-foreground text-xs'>Criado em</p>
              <p className='font-medium'>{formatDate(project.created_at)}</p>
            </div>
          </div>
        </div>

        {project.closing_notes && (
          <div className='rounded-md bg-muted/30 p-3 text-sm'>
            <p className='text-muted-foreground text-xs font-medium'>Notas de Fechamento</p>
            <p className='mt-0.5'>{project.closing_notes}</p>
          </div>
        )}

        {hasActions && (
          <>
            <Separator />
            <div className='flex flex-wrap gap-2'>
              {capabilities.canManageStages && project.status === 'em_andamento' && (
                <Button size='sm' onClick={() => setSubmitOpen(true)}>
                  <Icons.send className='mr-1.5 size-3.5' />
                  Enviar para Revisão
                </Button>
              )}
              {capabilities.canReviewProject && (
                <Button size='sm' onClick={() => setReviewOpen(true)}>
                  <Icons.checks className='mr-1.5 size-3.5' />
                  Revisar Projeto
                </Button>
              )}
              {capabilities.canClose && (
                <Button size='sm' onClick={() => setCloseOpen(true)}>
                  <Icons.circleCheck className='mr-1.5 size-3.5' />
                  Fechar Projeto
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <StagesSection project={project} capabilities={capabilities} />

      {capabilities.canReviewProject && (
        <div className='space-y-3 rounded-xl border bg-card p-4'>
          <div>
            <h3 className='text-sm font-semibold'>Arquivos para Revisão</h3>
            <p className='text-muted-foreground text-xs'>
              Últimos arquivos aprovados de cada etapa do projeto.
            </p>
          </div>
          <ProjectReviewFiles projectId={projectId} stages={stages} />
        </div>
      )}

      {showReviewsHistory && (
        <div className='space-y-3 rounded-xl border bg-card p-4'>
          <h3 className='text-sm font-semibold'>Revisões de Diretoria</h3>
          <ProjectReviewsHistory projectId={projectId} />
        </div>
      )}

      {showFeedback && capabilities.canViewFeedback && (
        <div className='space-y-3 rounded-xl border bg-card p-4'>
          <h3 className='text-sm font-semibold'>Feedback</h3>
          <p className='text-muted-foreground text-xs'>
            Para dar seu próprio feedback deste projeto, acesse a aba{' '}
            <span className='font-medium'>Feedback</span> na página de Projetos.
          </p>
          <ProjectFeedbackList projectId={projectId} canView={capabilities.canViewFeedback} />
        </div>
      )}

      <SubmitForReviewDialog
        projectId={projectId}
        stages={stages}
        open={submitOpen}
        onOpenChange={setSubmitOpen}
      />
      <ProjectReviewDialog projectId={projectId} open={reviewOpen} onOpenChange={setReviewOpen} />
      <CloseProjectDialog projectId={projectId} open={closeOpen} onOpenChange={setCloseOpen} />
    </div>
  );
}
