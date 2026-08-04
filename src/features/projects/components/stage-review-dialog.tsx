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
import { Checkbox } from '@/components/ui/checkbox';
import { DateField } from '@/components/date-field';
import { Icons } from '@/components/icons';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { toUserMessage } from '@/lib/api-client';
import type { ProjectStage } from '@/types/projects';

type Decision = 'approve' | 'reject';

interface StageReviewDialogProps {
  projectId: string;
  stage: ProjectStage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StageReviewDialog({
  projectId,
  stage,
  open,
  onOpenChange
}: StageReviewDialogProps) {
  const reviewMutation = ProjectsRepository.useCreateStageReview(projectId, stage.id);

  const [decision, setDecision] = useState<Decision>('approve');
  const [notes, setNotes] = useState('');
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  const [reworkIds, setReworkIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setDecision('approve');
      setNotes('');
      setNewDeliveryDate('');
      setReworkIds(new Set());
      setError('');
    }
  }, [open, stage.id]);

  const isPending = reviewMutation.isPending;
  const canSubmit =
    decision === 'approve'
      ? !isPending
      : notes.trim() && newDeliveryDate && reworkIds.size > 0 && !isPending;

  function toggleDeliverable(id: string) {
    setReworkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleClose() {
    if (!isPending) onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (decision === 'approve') {
      reviewMutation.mutate(
        { approved: true, ...(notes.trim() && { notes: notes.trim() }) },
        {
          onSuccess: () => {
            toast.success('Submissão aprovada!');
            onOpenChange(false);
          },
          onError: (err) => toast.error(toUserMessage(err))
        }
      );
      return;
    }

    if (!notes.trim() || !newDeliveryDate || reworkIds.size === 0) return;
    if (newDeliveryDate >= stage.deadline_date) {
      setError('A nova data de entrega deve ser anterior ao prazo da etapa.');
      return;
    }

    reviewMutation.mutate(
      {
        approved: false,
        notes: notes.trim(),
        new_delivery_date: newDeliveryDate,
        deliverable_ids: Array.from(reworkIds)
      },
      {
        onSuccess: () => {
          toast.success('Submissão reprovada.');
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className='max-h-[90vh] w-[min(90vw,520px)] overflow-y-auto'
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Revisar Entrega — {stage.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant={decision === 'approve' ? 'default' : 'outline'}
              className='flex-1'
              onClick={() => setDecision('approve')}
              disabled={isPending}
            >
              Aprovar
            </Button>
            <Button
              type='button'
              variant={decision === 'reject' ? 'destructive' : 'outline'}
              className='flex-1'
              onClick={() => setDecision('reject')}
              disabled={isPending}
            >
              Reprovar
            </Button>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='review-notes'>Notas {decision === 'reject' && '*'}</Label>
            <Textarea
              id='review-notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                decision === 'approve'
                  ? 'Observações (opcional)'
                  : 'Explique o motivo da reprovação'
              }
              rows={2}
              className='resize-none'
              disabled={isPending}
            />
          </div>

          {decision === 'reject' && (
            <>
              <div className='space-y-1.5'>
                <Label htmlFor='new-delivery-date'>Nova Data de Entrega *</Label>
                <DateField
                  id='new-delivery-date'
                  value={newDeliveryDate}
                  onChange={(value) => {
                    setNewDeliveryDate(value);
                    setError('');
                  }}
                  disabled={isPending}
                />
              </div>

              <div className='space-y-2'>
                <Label>Entregáveis para Reenvio *</Label>
                <div className='space-y-1.5'>
                  {stage.deliverables.map((deliverable) => (
                    <div key={deliverable.id} className='flex items-center gap-2'>
                      <Checkbox
                        id={`rework-${deliverable.id}`}
                        checked={reworkIds.has(deliverable.id)}
                        onCheckedChange={() => toggleDeliverable(deliverable.id)}
                        disabled={isPending}
                      />
                      <Label
                        htmlFor={`rework-${deliverable.id}`}
                        className='cursor-pointer text-sm font-normal'
                      >
                        {deliverable.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <p className='text-destructive text-sm'>{error}</p>}

          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type='submit' disabled={!canSubmit}>
              {isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
