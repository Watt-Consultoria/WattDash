'use client';

import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { toUserMessage } from '@/lib/api-client';

interface CloseProjectDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseProjectDialog({ projectId, open, onOpenChange }: CloseProjectDialogProps) {
  const updateMutation = ProjectsRepository.useUpdateProjectStatus(projectId);
  const [closingNotes, setClosingNotes] = useState('');

  useEffect(() => {
    if (open) setClosingNotes('');
  }, [open]);

  const isPending = updateMutation.isPending;
  const canSubmit = closingNotes.trim() && !isPending;

  function handleClose() {
    if (!isPending) onOpenChange(false);
  }

  function handleConfirm() {
    if (!closingNotes.trim()) return;
    updateMutation.mutate(
      { status: 'finalizado', closing_notes: closingNotes.trim() },
      {
        onSuccess: () => {
          toast.success('Projeto finalizado!');
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='w-[min(90vw,480px)]' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Fechar Projeto</DialogTitle>
          <DialogDescription>
            Ao fechar, o projeto se torna somente leitura e os consultores atribuídos serão
            notificados para enviar feedback.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 pt-1'>
          <div className='space-y-1.5'>
            <Label htmlFor='closing-notes'>Notas de Fechamento *</Label>
            <Textarea
              id='closing-notes'
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder='Ex.: Projeto entregue com sucesso'
              rows={3}
              className='resize-none'
            />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type='button' onClick={handleConfirm} disabled={!canSubmit}>
              {isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              Fechar Projeto
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
