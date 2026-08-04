'use client';

import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { usePendingFeedbackProjects } from '../lib/pending-feedback';
import { formatDate } from '../lib/format';
import { cn } from '@/lib/utils';
import { ProjectFeedbackForm } from './project-feedback-form';

interface PendingFeedbackGateProps {
  children: ReactNode;
}

/**
 * Bloqueia o uso da página de Projetos enquanto o consultor tiver feedback pendente de algum
 * projeto finalizado em que atuou — um projeto por vez (como o Uber impede pedir uma nova
 * corrida antes de avaliar a última). O modal não pode ser fechado sem enviar a pesquisa; ao
 * enviar, a lista de pendências é revalidada e o próximo projeto pendente (se houver) aparece.
 */
export function PendingFeedbackGate({ children }: PendingFeedbackGateProps) {
  const { pendingProjects, isLoading } = usePendingFeedbackProjects();
  const blockingProject = pendingProjects[0] ?? null;
  const isBlocking = !isLoading && !!blockingProject;
  const queueLength = pendingProjects.length;

  return (
    <>
      <div aria-hidden={isBlocking} inert={isBlocking || undefined}>
        {children}
      </div>

      <Dialog open={isBlocking}>
        <DialogContent
          className='flex max-h-[85vh] w-[min(92vw,560px)] flex-col gap-0 overflow-hidden p-0'
          showCloseButton={false}
          aria-describedby={undefined}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className='from-primary/10 space-y-3 border-b bg-gradient-to-b to-transparent px-6 pt-6 pb-5'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2.5 text-base'>
                <span className='bg-primary/15 flex size-9 items-center justify-center rounded-full'>
                  <Icons.chat className='text-primary size-4.5' />
                </span>
                Sua opinião é importante
              </DialogTitle>
            </DialogHeader>
            <p className='text-muted-foreground text-sm'>
              Para continuar navegando pela página de Projetos, avalie sua experiência no projeto
              abaixo. Leva menos de um minuto.
            </p>

            {blockingProject && (
              <div className='flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 shadow-sm'>
                <span className='bg-muted flex size-8 shrink-0 items-center justify-center rounded-md'>
                  <Icons.workspace className='text-muted-foreground size-4' />
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{blockingProject.name}</p>
                  <p className='text-muted-foreground text-xs'>
                    Finalizado em{' '}
                    {formatDate(blockingProject.closed_at ?? blockingProject.updated_at)}
                  </p>
                </div>
                {queueLength > 1 && (
                  <span className='bg-primary/10 text-primary shrink-0 rounded-full px-2 py-0.5 text-xs font-medium'>
                    1 de {queueLength}
                  </span>
                )}
              </div>
            )}

            {queueLength > 1 && (
              <div className='flex items-center gap-1'>
                {pendingProjects.map((project, index) => (
                  <span
                    key={project.id}
                    className={cn(
                      'h-1 flex-1 rounded-full',
                      index === 0 ? 'bg-primary' : 'bg-primary/15'
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          <div className='overflow-y-auto px-6 py-5'>
            {blockingProject && (
              <ProjectFeedbackForm projectId={blockingProject.id} variant='plain' />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
