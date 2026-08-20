import { Icons } from '@/components/icons';
import { formatBRL, formatDateBR, WALLET_CATEGORY_LABEL } from '../lib/wallet-format';
import type { WalletTransaction } from '@/types/api';

const CATEGORY_ICON: Record<string, keyof typeof Icons> = {
  ingresso: 'calendar',
  alimentação: 'pizza',
  transporte: 'arrowRight',
  equipamento: 'billing',
  outro: 'receipt'
};

interface TransactionRowProps {
  transaction: WalletTransaction;
  accountName: string;
  hideValues: boolean;
}

export function TransactionRow({ transaction, accountName, hideValues }: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const CategoryIcon = Icons[CATEGORY_ICON[transaction.category] ?? 'receipt'];

  return (
    <div className='flex items-center gap-3 border-b py-3 last:border-b-0'>
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
          isIncome
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}
      >
        <CategoryIcon className='size-4' />
      </span>

      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium leading-tight'>{transaction.description}</p>
        <p className='text-muted-foreground mt-0.5 truncate text-xs'>
          {WALLET_CATEGORY_LABEL[transaction.category] ?? transaction.category} · {accountName} ·{' '}
          {formatDateBR(transaction.transaction_date)}
        </p>
      </div>

      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        }`}
      >
        {hideValues ? '••••••' : `${isIncome ? '+' : '−'} ${formatBRL(transaction.amount_cents)}`}
      </span>
    </div>
  );
}
