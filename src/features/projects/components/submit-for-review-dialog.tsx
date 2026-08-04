'use client';

import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { toUserMessage } from '@/lib/api-client';
import type { ProjectStage } from '@/types/projects';

interface SubmitForReviewDialogProps {
  projectId: string;
  stages: ProjectStage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmitForReviewDialog({
  projectId,
  stages,
  open,
  onOpenChange
}: SubmitForReviewDialogProps) {
  const updateMutation = ProjectsRepository.useUpdateProjectStatus(projectId);

  const pendingStages = stages.filter((stage) => stage.status !== 'concluida');
  const canSubmit = stages.length > 0 && pendingStages.length === 0 && !updateMutation.isPending;

  function handleClose() {
    if (!updateMutation.isPending) onOpenChange(false);
  }

  function handleConfirm() {
    if (!canSubmit) return;
    updateMutation.mutate(
      { status: 'em_revisao' },
      {
        onSuccess: () => {
          toast.success('Projeto enviado para revisão!');
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='w-[min(90vw,440px)]' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Enviar para Revisão</DialogTitle>
          <DialogDescription>
            O projeto será enviado para a diretoria de projetos avaliar.
          </DialogDescription>
        </DialogHeader>

        {stages.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            Este projeto ainda não possui etapas. Crie ao menos uma etapa antes de enviar para
            revisão.
          </p>
        ) : pendingStages.length > 0 ? (
          <p className='text-sm text-muted-foreground'>
            Ainda há {pendingStages.length} etapa(s) não concluída(s). Todas as etapas precisam
            estar <span className='font-medium'>concluídas</span> antes de enviar o projeto para
            revisão.
          </p>
        ) : (
          <p className='text-sm text-muted-foreground'>
            Todas as etapas foram concluídas. Confirme para enviar o projeto para revisão da
            diretoria.
          </p>
        )}

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={handleClose}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button type='button' onClick={handleConfirm} disabled={!canSubmit}>
            {updateMutation.isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
            Enviar para Revisão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
