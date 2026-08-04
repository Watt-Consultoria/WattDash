'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { toUserMessage } from '@/lib/api-client';

interface ProjectReviewDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectReviewDialog({ projectId, open, onOpenChange }: ProjectReviewDialogProps) {
  const reviewMutation = ProjectsRepository.useUpdateProjectReview(projectId);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) setNotes('');
  }, [open]);

  const isPending = reviewMutation.isPending;
  const canSubmit = notes.trim() && !isPending;

  function handleClose() {
    if (!isPending) onOpenChange(false);
  }

  function handleDecision(approved: boolean) {
    if (!notes.trim()) return;
    reviewMutation.mutate(
      { approved, notes: notes.trim() },
      {
        onSuccess: () => {
          toast.success(approved ? 'Projeto aprovado!' : 'Projeto reprovado.');
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
          <DialogTitle>Revisão de Diretoria</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 pt-1'>
          <div className='space-y-1.5'>
            <Label htmlFor='review-notes'>Notas *</Label>
            <Textarea
              id='review-notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Justifique a decisão'
              rows={3}
              className='resize-none'
            />
          </div>

          <DialogFooter className='gap-2 sm:justify-end'>
            <Button type='button' variant='outline' onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={() => handleDecision(false)}
              disabled={!canSubmit}
            >
              {isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              Reprovar
            </Button>
            <Button type='button' onClick={() => handleDecision(true)} disabled={!canSubmit}>
              {isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              Aprovar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
