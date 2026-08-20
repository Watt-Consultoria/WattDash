'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ACCOUNT_TYPE_ICON, ACCOUNT_TYPE_LABEL, formatBRL } from '../lib/wallet-format';
import type { WalletAccount } from '@/types/api';

interface AccountCardProps {
  account: WalletAccount;
  hideValues: boolean;
  canEdit: boolean;
  onEdit: (account: WalletAccount) => void;
}

export function AccountCard({ account, hideValues, canEdit, onEdit }: AccountCardProps) {
  const AccountIcon = Icons[ACCOUNT_TYPE_ICON[account.type]];
  const isNegative = account.balance_cents < 0;

  return (
    <div className='group relative rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md'>
      <div className='flex items-center gap-2.5'>
        <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted'>
          <AccountIcon className='size-4 text-foreground/80' />
        </span>
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium leading-tight'>{account.name}</p>
          <p className='text-muted-foreground text-xs'>{ACCOUNT_TYPE_LABEL[account.type]}</p>
        </div>
      </div>

      <p
        className={`mt-3 text-lg font-semibold tabular-nums ${
          isNegative ? 'text-red-600 dark:text-red-400' : ''
        }`}
      >
        {hideValues ? '••••••' : formatBRL(account.balance_cents)}
      </p>

      {canEdit && (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='absolute right-2 top-2 size-7 opacity-0 transition-opacity group-hover:opacity-100'
          onClick={() => onEdit(account)}
        >
          <Icons.edit className='size-3.5' />
          <span className='sr-only'>Editar conta</span>
        </Button>
      )}
    </div>
  );
}
