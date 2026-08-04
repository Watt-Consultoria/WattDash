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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DateField } from '@/components/date-field';
import { Icons } from '@/components/icons';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { toUserMessage } from '@/lib/api-client';
import type { ProjectStage, CreateStageDeliverablePayload } from '@/types/projects';

interface DeliverableRow extends CreateStageDeliverablePayload {
  id: string;
}

function emptyRow(): DeliverableRow {
  return { id: crypto.randomUUID(), name: '', description: '' };
}

interface ProjectStageFormDialogProps {
  projectId: string;
  /** Data de entrega do projeto — o `delivery_date` da etapa não pode ser posterior. */
  projectDeliveryDate: string;
  stage?: ProjectStage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectStageFormDialog({
  projectId,
  projectDeliveryDate,
  stage,
  open,
  onOpenChange
}: ProjectStageFormDialogProps) {
  const isEdit = !!stage;
  const createMutation = ProjectsRepository.useCreateStage(projectId);
  const updateMutation = ProjectsRepository.useUpdateStage(projectId);
  const { data: lookups } = ProjectsRepository.useProjectLookups();
  const consultants = lookups?.consultants ?? [];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [position, setPosition] = useState('');
  const [consultantId, setConsultantId] = useState('');
  const [deliverables, setDeliverables] = useState<DeliverableRow[]>([emptyRow()]);
  const [dateError, setDateError] = useState('');

  const isPending = isEdit ? updateMutation.isPending : createMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setName(stage?.name ?? '');
    setDescription(stage?.description ?? '');
    setDeliveryDate(stage?.delivery_date.slice(0, 10) ?? '');
    setDeadlineDate(stage?.deadline_date.slice(0, 10) ?? '');
    setPosition(stage?.position?.toString() ?? '');
    setConsultantId(stage?.consultant_id ?? '');
    setDeliverables(
      stage?.deliverables.length
        ? stage.deliverables.map((d) => ({ id: d.id, name: d.name, description: d.description }))
        : [emptyRow()]
    );
    setDateError('');
  }, [open, stage]);

  const hasFilledDeliverable = deliverables.some((d) => d.name.trim());
  const canSubmit =
    name.trim() &&
    deliveryDate &&
    deadlineDate &&
    position &&
    consultantId &&
    (isEdit || hasFilledDeliverable) &&
    !isPending;

  function addDeliverable() {
    setDeliverables((prev) => [...prev, emptyRow()]);
  }

  function removeDeliverable(id: string) {
    setDeliverables((prev) => (prev.length > 1 ? prev.filter((d) => d.id !== id) : prev));
  }

  function updateDeliverable(id: string, field: 'name' | 'description', value: string) {
    setDeliverables((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  function validateDates(): boolean {
    if (deliveryDate >= deadlineDate) {
      setDateError('A data de entrega deve ser anterior ao prazo.');
      return false;
    }
    if (deliveryDate > projectDeliveryDate) {
      setDateError('A data de entrega não pode ser posterior à data de entrega do projeto.');
      return false;
    }
    setDateError('');
    return true;
  }

  function handleClose() {
    if (!isPending) onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !validateDates()) return;

    const pos = parseInt(position, 10);
    if (isNaN(pos) || pos < 1) {
      setDateError('Informe uma posição válida (número inteiro positivo).');
      return;
    }

    if (isEdit && stage) {
      updateMutation.mutate(
        {
          stageId: stage.id,
          payload: {
            name: name.trim(),
            description: description.trim(),
            delivery_date: deliveryDate,
            deadline_date: deadlineDate,
            position: pos,
            consultant_id: consultantId
          }
        },
        {
          onSuccess: () => {
            toast.success('Etapa atualizada!');
            onOpenChange(false);
          },
          onError: (err) => toast.error(toUserMessage(err))
        }
      );
      return;
    }

    createMutation.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        delivery_date: deliveryDate,
        deadline_date: deadlineDate,
        position: pos,
        consultant_id: consultantId,
        deliverables: deliverables
          .filter((d) => d.name.trim())
          .map((d) => ({ name: d.name.trim(), description: d.description.trim() }))
      },
      {
        onSuccess: () => {
          toast.success('Etapa criada com sucesso!');
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className='max-h-[90vh] w-[min(90vw,560px)] overflow-y-auto'
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          <div className='space-y-1.5'>
            <Label htmlFor='stage-name'>Nome *</Label>
            <Input
              id='stage-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex.: Diagnóstico Técnico'
              disabled={isPending}
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='stage-desc'>Descrição</Label>
            <Textarea
              id='stage-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Descreva a etapa'
              rows={2}
              className='resize-none'
              disabled={isPending}
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='stage-delivery'>Data de Entrega *</Label>
              <DateField
                id='stage-delivery'
                value={deliveryDate}
                onChange={(value) => {
                  setDeliveryDate(value);
                  setDateError('');
                }}
                disabled={isPending}
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='stage-deadline'>Prazo *</Label>
              <DateField
                id='stage-deadline'
                value={deadlineDate}
                onChange={(value) => {
                  setDeadlineDate(value);
                  setDateError('');
                }}
                disabled={isPending}
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='stage-position'>Posição *</Label>
              <Input
                id='stage-position'
                type='number'
                min={1}
                step={1}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className='space-y-1.5'>
              <Label>Consultor Responsável *</Label>
              <Select value={consultantId} onValueChange={setConsultantId} disabled={isPending}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Selecione' />
                </SelectTrigger>
                <SelectContent>
                  {consultants.map((consultant) => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {dateError && <p className='text-destructive text-sm'>{dateError}</p>}

          {!isEdit && (
            <div className='space-y-2'>
              <Label>Checklist de Entregáveis *</Label>
              <div className='space-y-2'>
                {deliverables.map((d) => (
                  <div key={d.id} className='flex items-start gap-2 rounded-md border p-2'>
                    <div className='flex-1 space-y-1.5'>
                      <Input
                        value={d.name}
                        onChange={(e) => updateDeliverable(d.id, 'name', e.target.value)}
                        placeholder='Nome do entregável'
                        disabled={isPending}
                      />
                      <Input
                        value={d.description}
                        onChange={(e) => updateDeliverable(d.id, 'description', e.target.value)}
                        placeholder='Descrição do entregável'
                        disabled={isPending}
                      />
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='shrink-0'
                      onClick={() => removeDeliverable(d.id)}
                      disabled={isPending || deliverables.length === 1}
                    >
                      <Icons.trash className='size-4' />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={addDeliverable}
                disabled={isPending}
              >
                <Icons.add className='mr-1.5 size-4' />
                Adicionar Entregável
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type='submit' disabled={!canSubmit}>
              {isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              {isEdit ? 'Salvar' : 'Criar Etapa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
