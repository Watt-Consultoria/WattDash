'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { ReembolsosRepository } from '@/repositories/reembolsos.repository';
import { WalletRepository } from '@/repositories/wallet.repository';
import { toUserMessage } from '@/lib/api-client';
import type { Reimbursement } from '@/types/api';

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseBRLInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  return parseInt(digits || '0', 10);
}

function formatBRLInput(cents: number): string {
  if (cents === 0) return '';
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

interface StatusUpdateDialogProps {
  reimbursement: Reimbursement | null;
  action: 'approved' | 'rejected' | null;
  onClose: () => void;
}

export function StatusUpdateDialog({ reimbursement, action, onClose }: StatusUpdateDialogProps) {
  const updateMutation = ReembolsosRepository.useUpdateStatus();
  const { data: accounts = [], isLoading: accountsLoading } = WalletRepository.useAccounts();

  const isOpen = !!reimbursement && !!action;
  const isApprove = action === 'approved';

  const [accountId, setAccountId] = useState('');
  const [isPartial, setIsPartial] = useState(false);
  const [paidCents, setPaidCents] = useState(0);
  const [paidDisplay, setPaidDisplay] = useState('');
  const [partialReason, setPartialReason] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setAccountId(accounts[0]?.id ?? '');
    setIsPartial(false);
    setPaidCents(reimbursement?.amount_cents ?? 0);
    setPaidDisplay(formatBRLInput(reimbursement?.amount_cents ?? 0));
    setPartialReason('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reimbursement?.id]);

  const amountCents = reimbursement?.amount_cents ?? 0;
  const isPaidValid = !isPartial || (paidCents > 0 && paidCents <= amountCents);
  const canConfirm = isApprove
    ? !!accountId && isPaidValid && (!isPartial || partialReason.trim().length > 0)
    : true;

  function handleConfirm() {
    if (!reimbursement || !action || !canConfirm) return;

    if (!isApprove) {
      updateMutation.mutate(
        { id: reimbursement.id, payload: { status: 'rejected' } },
        {
          onSuccess: () => {
            toast.success('Reembolso recusado.');
            onClose();
          },
          onError: (err) => toast.error(toUserMessage(err))
        }
      );
      return;
    }

    updateMutation.mutate(
      {
        id: reimbursement.id,
        payload: {
          status: 'approved',
          account_id: accountId,
          ...(isPartial && { paid_amount_cents: paidCents, partial_reason: partialReason.trim() })
        }
      },
      {
        onSuccess: () => {
          toast.success(isPartial ? 'Reembolso aprovado parcialmente.' : 'Reembolso aprovado.');
          onClose();
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  if (!reimbursement || !action) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v && !updateMutation.isPending) onClose();
      }}
    >
      <DialogContent className='max-h-[90vh] w-[min(90vw,480px)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isApprove ? 'Aprovar reembolso' : 'Recusar reembolso'}</DialogTitle>
          <DialogDescription asChild>
            <div className='space-y-2 text-sm'>
              <p>
                {isApprove
                  ? 'Você está prestes a aprovar a seguinte solicitação de reembolso:'
                  : 'Você está prestes a recusar a seguinte solicitação de reembolso:'}
              </p>
              <div className='rounded-md border bg-muted/40 px-3 py-2'>
                <p className='break-words font-medium text-foreground'>{reimbursement.title}</p>
                <p className='text-muted-foreground'>{formatBRL(reimbursement.amount_cents)}</p>
              </div>
              {isApprove && reimbursement.pix_key && (
                <div className='rounded-md border bg-muted/40 px-3 py-2'>
                  <p className='text-xs text-muted-foreground'>Chave PIX para pagamento</p>
                  <p className='break-all font-medium text-foreground'>{reimbursement.pix_key}</p>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {isApprove && (
          <div className='space-y-4 pt-1'>
            <div className='space-y-1.5'>
              <Label>Conta que paga o reembolso *</Label>
              <Select value={accountId} onValueChange={setAccountId} disabled={accountsLoading}>
                <SelectTrigger className='w-full'>
                  <SelectValue
                    placeholder={accountsLoading ? 'Carregando...' : 'Selecione a conta'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!accountsLoading && accounts.length === 0 && (
                <p className='text-xs text-destructive'>
                  Nenhuma conta wallet cadastrada. Crie uma conta em Carteira Watt antes de aprovar.
                </p>
              )}
            </div>

            <div className='flex items-center justify-between rounded-lg border px-3 py-2.5'>
              <div>
                <p className='text-sm font-medium'>Aprovação parcial</p>
                <p className='text-muted-foreground text-xs'>
                  Pagar um valor menor que o solicitado
                </p>
              </div>
              <Switch checked={isPartial} onCheckedChange={setIsPartial} />
            </div>

            {isPartial && (
              <div className='space-y-4 rounded-lg border bg-muted/20 p-3'>
                <div className='space-y-1.5'>
                  <Label htmlFor='paid-amount'>Valor pago *</Label>
                  <div className='relative'>
                    <span className='text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm'>
                      R$
                    </span>
                    <Input
                      id='paid-amount'
                      value={paidDisplay}
                      onChange={(e) => {
                        const cents = parseBRLInput(e.target.value);
                        setPaidCents(cents);
                        setPaidDisplay(formatBRLInput(cents));
                      }}
                      inputMode='numeric'
                      placeholder='0,00'
                      className='pl-9'
                    />
                  </div>
                  {!isPaidValid && (
                    <p className='text-xs text-destructive'>
                      O valor pago deve ser maior que zero e no máximo {formatBRL(amountCents)}.
                    </p>
                  )}
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='partial-reason'>Justificativa *</Label>
                  <Textarea
                    id='partial-reason'
                    value={partialReason}
                    onChange={(e) => setPartialReason(e.target.value)}
                    placeholder='Ex.: Nota fiscal cobria apenas parte do valor solicitado'
                    rows={2}
                    className='resize-none'
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className='gap-2 sm:gap-2'>
          <Button variant='outline' disabled={updateMutation.isPending} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={updateMutation.isPending || !canConfirm}
            className={
              isApprove
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            }
          >
            {updateMutation.isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
            {isApprove
              ? isPartial
                ? 'Confirmar aprovação parcial'
                : 'Confirmar aprovação'
              : 'Confirmar recusa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
