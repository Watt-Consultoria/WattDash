'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { WalletRepository } from '@/repositories/wallet.repository';
import { toUserMessage } from '@/lib/api-client';
import { WALLET_CATEGORY_OPTIONS, formatBRLInput, parseBRLInput } from '../lib/wallet-format';
import type { ReimbursementCategory, WalletAccount, WalletTransactionType } from '@/types/api';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: WalletAccount[];
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  accounts
}: TransactionFormDialogProps) {
  const createMutation = WalletRepository.useCreateTransaction();

  const [type, setType] = useState<WalletTransactionType>('expense');
  const [amountCents, setAmountCents] = useState(0);
  const [amountDisplay, setAmountDisplay] = useState('');
  const [date, setDate] = useState(today());
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState<ReimbursementCategory | ''>('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    setType('expense');
    setAmountCents(0);
    setAmountDisplay('');
    setDate(today());
    setAccountId(accounts[0]?.id ?? '');
    setCategory('');
    setDescription('');
  }, [open, accounts]);

  const isSubmitting = createMutation.isPending;
  const canSubmit =
    amountCents > 0 && !!date && !!accountId && !!category && description.trim() && !isSubmitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !category) return;

    createMutation.mutate(
      {
        account_id: accountId,
        type,
        amount_cents: amountCents,
        category,
        description: description.trim(),
        transaction_date: date
      },
      {
        onSuccess: () => {
          toast.success('Transação criada.');
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
      <DialogContent className='max-h-[90vh] w-[min(90vw,560px)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Nova transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
          <div className='grid grid-cols-2 gap-2'>
            <button
              type='button'
              onClick={() => setType('income')}
              className={cn(
                'flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors',
                type === 'income'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              <Icons.trendingUp className='size-4' />
              Receita
            </button>
            <button
              type='button'
              onClick={() => setType('expense')}
              className={cn(
                'flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors',
                type === 'expense'
                  ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              <Icons.trendingDown className='size-4' />
              Despesa
            </button>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='tx-amount'>Valor *</Label>
              <div className='relative'>
                <span className='text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm'>
                  R$
                </span>
                <Input
                  id='tx-amount'
                  value={amountDisplay}
                  onChange={(e) => {
                    const cents = parseBRLInput(e.target.value);
                    setAmountCents(cents);
                    setAmountDisplay(formatBRLInput(cents));
                  }}
                  placeholder='0,00'
                  className='pl-9'
                  inputMode='numeric'
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='tx-date'>Data *</Label>
              <Input
                id='tx-date'
                type='date'
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label>Conta *</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Selecione' />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label>Categoria *</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ReimbursementCategory)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Selecione' />
                </SelectTrigger>
                <SelectContent>
                  {WALLET_CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='tx-desc'>Descrição *</Label>
            <Textarea
              id='tx-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Ex.: Compra de material de escritório'
              rows={2}
              className='resize-none'
            />
          </div>

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
              Criar transação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
