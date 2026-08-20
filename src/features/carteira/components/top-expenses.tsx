import { Icons } from '@/components/icons';
import { formatBRL, formatDateBR, WALLET_CATEGORY_LABEL } from '../lib/wallet-format';
import type { WalletTransaction } from '@/types/api';

interface TopExpensesProps {
  transactions: WalletTransaction[];
  hideValues: boolean;
}

export function TopExpenses({ transactions, hideValues }: TopExpensesProps) {
  if (transactions.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-2 py-10 text-center'>
        <Icons.trendingDown className='size-8 text-muted-foreground' />
        <p className='text-muted-foreground text-sm'>Nenhuma despesa registrada</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      {transactions.map((t, i) => (
        <div key={t.id} className='flex items-center gap-3 border-b py-2.5 last:border-b-0'>
          <span className='w-4 shrink-0 font-mono text-xs text-muted-foreground'>{i + 1}</span>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium leading-tight'>{t.description}</p>
            <p className='text-muted-foreground mt-0.5 truncate text-xs'>
              {WALLET_CATEGORY_LABEL[t.category] ?? t.category} · {formatDateBR(t.transaction_date)}
            </p>
          </div>
          <span className='shrink-0 text-sm font-semibold tabular-nums text-red-600 dark:text-red-400'>
            {hideValues ? '••••••' : formatBRL(t.amount_cents)}
          </span>
        </div>
      ))}
    </div>
  );
}
