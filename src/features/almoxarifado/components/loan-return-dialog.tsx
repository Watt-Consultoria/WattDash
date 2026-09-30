'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { AlmoxarifadoRepository } from '@/repositories/almoxarifado.repository';
import { ApiError, toUserMessage } from '@/lib/api-client';
import { formatDueLabel, getLoanStatus } from '../lib/loan-status';
import { LoanStatusBadge } from './loan-status-badge';
import { ResponsiveModal, ResponsiveModalActions } from './responsive-modal';
import type { AlmoxarifadoLoan } from '@/types/almoxarifado';

interface LoanReturnDialogProps {
  /** Empréstimo a devolver; `null` fecha o diálogo. */
  loan: AlmoxarifadoLoan | null;
  materialName: string;
  onClose: () => void;
}

export function LoanReturnDialog({ loan, materialName, onClose }: LoanReturnDialogProps) {
  const qc = useQueryClient();
  const returnMutation = AlmoxarifadoRepository.useReturnLoan();
  const isPending = returnMutation.isPending;
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (loan) setObservacoes('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loan?.id]);

  function handleOpenChange(open: boolean) {
    if (!open && !isPending) onClose();
  }

  function handleConfirm() {
    if (!loan) return;
    const trimmed = observacoes.trim();
    returnMutation.mutate(
      { id: loan.id, payload: trimmed ? { observacoes: trimmed } : {} },
      {
        onSuccess: () => {
          toast.success('Devolução registrada');
          onClose();
        },
        onError: (err: Error) => {
          toast.error(toUserMessage(err));
          // Ex.: "Empréstimo já foi devolvido" — a lista local está defasada.
          if (err instanceof ApiError && err.status === 400) {
            AlmoxarifadoRepository.invalidateAll(qc);
            onClose();
          }
        }
      }
    );
  }

  return (
    <ResponsiveModal
      open={!!loan}
      onOpenChange={handleOpenChange}
      icon='returnItem'
      title='Registrar devolução'
      description='As unidades voltam para o estoque assim que você confirmar.'
    >
      {loan && (
        <div className='space-y-4'>
          <div className='bg-muted/50 flex items-start justify-between gap-3 rounded-lg border p-3'>
            <div className='min-w-0'>
              <p className='truncate font-medium'>{materialName}</p>
              <p className='text-muted-foreground text-sm'>
                {loan.quantidade} {loan.quantidade === 1 ? 'unidade' : 'unidades'} ·{' '}
                {formatDueLabel(loan)}
              </p>
            </div>
            <LoanStatusBadge status={getLoanStatus(loan)} className='shrink-0' />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='loan-return-notes'>
              Observações <span className='text-muted-foreground font-normal'>(opcional)</span>
            </Label>
            <Textarea
              id='loan-return-notes'
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder='Ex.: Devolvido em bom estado'
              rows={3}
              className='resize-none text-base md:text-sm'
            />
          </div>

          <ResponsiveModalActions>
            <Button variant='outline' disabled={isPending} onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={isPending} onClick={handleConfirm}>
              {isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              Confirmar devolução
            </Button>
          </ResponsiveModalActions>
        </div>
      )}
    </ResponsiveModal>
  );
}
