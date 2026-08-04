'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { DeliverableUploadSlot, type DeliverableManagedFile } from './deliverable-upload-slot';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { uploadStageFile } from '../lib/upload-stage-files';
import { createClient } from '@/utils/supabase/client';
import { useSession } from '@/components/providers/session-provider';
import { toUserMessage } from '@/lib/api-client';
import type { ProjectStage } from '@/types/projects';

interface StageSubmissionDialogProps {
  projectId: string;
  stage: ProjectStage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StageSubmissionDialog({
  projectId,
  stage,
  open,
  onOpenChange
}: StageSubmissionDialogProps) {
  const { session } = useSession();
  const createMutation = ProjectsRepository.useCreateSubmission(projectId, stage.id);
  const { data: reviews = [] } = ProjectsRepository.useStageReviews(projectId, stage.id);

  const [files, setFiles] = useState<Record<string, DeliverableManagedFile | null>>({});
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const reworkIds = useMemo(() => {
    const latestRejected = [...reviews]
      .sort((a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime())
      .find((r) => !r.approved);
    return new Set(latestRejected?.rework_deliverable_ids ?? []);
  }, [reviews]);

  useEffect(() => {
    if (open) {
      setFiles({});
      setNotes('');
    }
  }, [open, stage.id]);

  const isSubmitting = createMutation.isPending || isUploading;
  const missingCount = stage.deliverables.filter((d) => !files[d.id]).length;
  const hasError = Object.values(files).some((f) => f?.status === 'error');
  const canSubmit = missingCount === 0 && !hasError && !isSubmitting;

  function handleClose() {
    if (!isSubmitting) onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const userId = session?.user?.id;
    if (!userId) {
      toast.error('Sessão inválida — faça login novamente.');
      return;
    }

    setIsUploading(true);
    setFiles((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key]) next[key] = { ...next[key]!, status: 'uploading' };
      }
      return next;
    });

    try {
      const supabase = createClient();
      const uploaded = await Promise.all(
        stage.deliverables.map(async (deliverable) => {
          const managed = files[deliverable.id];
          if (!managed) throw new Error(`Falta arquivo para "${deliverable.name}"`);
          const result = await uploadStageFile(managed.file, userId, supabase);
          return { deliverable_id: deliverable.id, path: result.path, name: result.name };
        })
      );

      setFiles((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (next[key]) next[key] = { ...next[key]!, status: 'done' };
        }
        return next;
      });
      setIsUploading(false);

      createMutation.mutate(
        { ...(notes.trim() && { notes: notes.trim() }), files: uploaded },
        {
          onSuccess: () => {
            toast.success('Entrega enviada com sucesso!');
            onOpenChange(false);
          },
          onError: (err) => toast.error(toUserMessage(err))
        }
      );
    } catch (err) {
      setFiles((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (next[key]?.status === 'uploading') {
            next[key] = { ...next[key]!, status: 'error', error: 'Falha no upload' };
          }
        }
        return next;
      });
      toast.error(err instanceof Error ? err.message : 'Falha ao enviar entregáveis.');
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className='max-h-[90vh] w-[min(90vw,560px)] overflow-y-auto'
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Enviar Entrega — {stage.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          <div className='space-y-3'>
            {stage.deliverables.map((deliverable) => (
              <DeliverableUploadSlot
                key={deliverable.id}
                deliverableId={deliverable.id}
                deliverableName={deliverable.name}
                needsRework={reworkIds.has(deliverable.id)}
                value={files[deliverable.id] ?? null}
                onChange={(value) => setFiles((prev) => ({ ...prev, [deliverable.id]: value }))}
              />
            ))}
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='submission-notes'>Notas</Label>
            <Textarea
              id='submission-notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Observações sobre a entrega (opcional)'
              rows={2}
              className='resize-none'
              disabled={isSubmitting}
            />
          </div>

          {missingCount > 0 && (
            <p className='text-muted-foreground text-sm'>
              Falta anexar arquivo para {missingCount} entregável(is).
            </p>
          )}

          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type='submit' disabled={!canSubmit}>
              {isSubmitting && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              Enviar Entrega
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
