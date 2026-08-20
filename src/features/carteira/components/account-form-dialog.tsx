'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { WalletRepository } from '@/repositories/wallet.repository';
import { toUserMessage } from '@/lib/api-client';
import {
  ACCOUNT_TYPE_OPTIONS,
  formatBRL,
  formatBRLInput,
  parseBRLInput
} from '../lib/wallet-format';
import type { WalletAccount, WalletAccountType } from '@/types/api';

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: WalletAccount | null;
}

export function AccountFormDialog({ open, onOpenChange, account }: AccountFormDialogProps) {
  const createMutation = WalletRepository.useCreateAccount();
  const updateMutation = WalletRepository.useUpdateAccount();
  const isEditing = !!account;

  const [name, setName] = useState('');
  const [type, setType] = useState<WalletAccountType | ''>('');
  const [balanceCents, setBalanceCents] = useState(0);
  const [balanceDisplay, setBalanceDisplay] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? '');
    setType(account?.type ?? '');
    setBalanceCents(0);
    setBalanceDisplay('');
  }, [open, account]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const canSubmit = name.trim() && type && !isSubmitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !type) return;

    if (isEditing && account) {
      updateMutation.mutate(
        { id: account.id, payload: { name: name.trim(), type } },
        {
          onSuccess: () => {
            toast.success('Conta atualizada.');
            onOpenChange(false);
          },
          onError: (err) => toast.error(toUserMessage(err))
        }
      );
      return;
    }

    createMutation.mutate(
      { name: name.trim(), type, balance_cents: balanceCents },
      {
        onSuccess: () => {
          toast.success('Conta criada.');
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isSubmitting) onOpenChange(v);
      }}
    >
      <DialogContent className='w-[min(90vw,460px)]'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar conta' : 'Nova conta'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='acct-name'>Nome *</Label>
            <Input
              id='acct-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex.: Conta Corrente Watt'
            />
          </div>

          <div className='space-y-1.5'>
            <Label>Tipo *</Label>
            <Select value={type} onValueChange={(v) => setType(v as WalletAccountType)}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Selecione' />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEditing && account ? (
            <div className='rounded-lg border bg-muted/30 px-3 py-2.5 text-sm'>
              <p className='text-muted-foreground text-xs'>Saldo atual</p>
              <p className='mt-0.5 font-medium tabular-nums'>{formatBRL(account.balance_cents)}</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                O saldo é ajustado apenas através de transações.
              </p>
            </div>
          ) : (
            <div className='space-y-1.5'>
              <Label htmlFor='acct-balance'>Saldo inicial</Label>
              <div className='relative'>
                <span className='text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm'>
                  R$
                </span>
                <Input
                  id='acct-balance'
                  value={balanceDisplay}
                  onChange={(e) => {
                    const cents = parseBRLInput(e.target.value);
                    setBalanceCents(cents);
                    setBalanceDisplay(formatBRLInput(cents));
                  }}
                  placeholder='0,00'
                  className='pl-9'
                  inputMode='numeric'
                />
              </div>
            </div>
          )}

          <div className='flex justify-end gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={!canSubmit}>
              {isSubmitting && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              {isEditing ? 'Salvar' : 'Criar conta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
