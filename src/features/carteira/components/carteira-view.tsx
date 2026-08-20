'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { WalletRepository } from '@/repositories/wallet.repository';
import { AccountCard } from './account-card';
import { AccountFormDialog } from './account-form-dialog';
import { TransactionFormDialog } from './transaction-form-dialog';
import { TransactionRow } from './transaction-row';
import { ExpenseCategoryChart } from './expense-category-chart';
import { TopExpenses } from './top-expenses';
import { formatBRL } from '../lib/wallet-format';
import type { ReimbursementCategory, WalletAccount } from '@/types/api';

const RECENT_COUNT = 8;
const TOP_EXPENSES_COUNT = 5;

function currentMonthPrefix(): string {
  return new Date().toISOString().slice(0, 7);
}

export function CarteiraView() {
  const { rank } = useUserProfile();
  const canManage = rank > 3;

  const { data: accounts = [], isLoading: accountsLoading } = WalletRepository.useAccounts();
  const { data: transactions = [], isLoading: txLoading } = WalletRepository.useTransactions();
  const isLoading = accountsLoading || txLoading;

  const [hideValues, setHideValues] = useState(false);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<WalletAccount | null>(null);

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const month = currentMonthPrefix();
  const monthTx = useMemo(
    () => transactions.filter((t) => t.transaction_date.startsWith(month)),
    [transactions, month]
  );

  const totalBalance = useMemo(
    () => accounts.reduce((acc, a) => acc + a.balance_cents, 0),
    [accounts]
  );

  const { monthIncome, monthExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of monthTx) {
      if (t.type === 'income') income += t.amount_cents;
      else expense += t.amount_cents;
    }
    return { monthIncome: income, monthExpense: expense };
  }, [monthTx]);

  const recentTransactions = useMemo(() => {
    return transactions
      .toSorted(
        (a, b) =>
          b.transaction_date.localeCompare(a.transaction_date) ||
          b.created_at.localeCompare(a.created_at)
      )
      .slice(0, RECENT_COUNT);
  }, [transactions]);

  const monthExpenseByCategory = useMemo(() => {
    const acc = new Map<ReimbursementCategory, number>();
    for (const t of monthTx) {
      if (t.type !== 'expense') continue;
      acc.set(t.category, (acc.get(t.category) ?? 0) + t.amount_cents);
    }
    return Array.from(acc.entries())
      .map(([category, total]) => ({ category, total }))
      .toSorted((a, b) => b.total - a.total);
  }, [monthTx]);

  const topExpenses = useMemo(() => {
    return monthTx
      .filter((t) => t.type === 'expense')
      .toSorted((a, b) => b.amount_cents - a.amount_cents)
      .slice(0, TOP_EXPENSES_COUNT);
  }, [monthTx]);

  function openEditAccount(account: WalletAccount) {
    setEditingAccount(account);
    setAccountDialogOpen(true);
  }

  function openNewAccount() {
    setEditingAccount(null);
    setAccountDialogOpen(true);
  }

  const summaryCards = [
    {
      key: 'total',
      label: 'Saldo total',
      value: totalBalance,
      icon: 'wallet' as const,
      iconClass: 'text-muted-foreground',
      valueClass: '',
      hint: `${accounts.length} ${accounts.length === 1 ? 'conta ativa' : 'contas ativas'}`
    },
    {
      key: 'income',
      label: 'Receitas do mês',
      value: monthIncome,
      icon: 'trendingUp' as const,
      iconClass: 'text-emerald-500',
      valueClass: 'text-emerald-600 dark:text-emerald-400',
      hint: 'Transações confirmadas'
    },
    {
      key: 'expense',
      label: 'Despesas do mês',
      value: monthExpense,
      icon: 'trendingDown' as const,
      iconClass: 'text-red-500',
      valueClass: 'text-red-600 dark:text-red-400',
      hint: 'Transações confirmadas'
    },
    {
      key: 'net',
      label: 'Saldo do mês',
      value: monthIncome - monthExpense,
      icon: 'exchange' as const,
      iconClass: 'text-muted-foreground',
      valueClass:
        monthIncome - monthExpense >= 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400',
      hint: 'receitas − despesas'
    }
  ];

  return (
    <div className='space-y-5'>
      {/* Header actions */}
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <Button variant='outline' size='sm' onClick={() => setHideValues((v) => !v)}>
          {hideValues ? (
            <Icons.eye className='mr-1.5 size-4' />
          ) : (
            <Icons.eyeOff className='mr-1.5 size-4' />
          )}
          {hideValues ? 'Mostrar valores' : 'Ocultar valores'}
        </Button>
        {canManage && (
          <>
            <Button variant='outline' size='sm' onClick={openNewAccount}>
              <Icons.add className='mr-1.5 size-4' />
              Nova conta
            </Button>
            <Button
              size='sm'
              onClick={() => setTxDialogOpen(true)}
              disabled={accounts.length === 0}
            >
              <Icons.add className='mr-1.5 size-4' />
              Nova transação
            </Button>
          </>
        )}
      </div>

      {/* Summary cards */}
      <div className='grid gap-3 grid-cols-2 lg:grid-cols-4'>
        {summaryCards.map(({ key, label, value, icon, iconClass, valueClass, hint }) => {
          const Icon = Icons[icon];
          return (
            <Card key={key}>
              <CardContent className='p-4 sm:p-5'>
                {isLoading ? (
                  <>
                    <Skeleton className='h-4 w-24 rounded' />
                    <Skeleton className='mt-3 h-7 w-32 rounded' />
                  </>
                ) : (
                  <>
                    <div className='flex items-center justify-between'>
                      <p className='text-muted-foreground text-xs sm:text-sm'>{label}</p>
                      <Icon className={`size-4 shrink-0 ${iconClass}`} />
                    </div>
                    <p
                      className={`mt-2 text-xl sm:text-2xl font-bold tracking-tight tabular-nums ${valueClass}`}
                    >
                      {hideValues ? '••••••' : formatBRL(value)}
                    </p>
                    <p className='text-muted-foreground mt-1 text-[11px] sm:text-xs'>{hint}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className='grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start'>
        {/* Left column */}
        <div className='min-w-0 space-y-4'>
          <Card>
            <CardHeader className='flex-row items-center justify-between pb-3'>
              <CardTitle className='text-base font-semibold'>Contas</CardTitle>
              {!isLoading && (
                <span className='text-muted-foreground text-xs'>
                  {accounts.length} {accounts.length === 1 ? 'conta' : 'contas'}
                </span>
              )}
            </CardHeader>
            <CardContent className='pt-0'>
              {isLoading ? (
                <div className='grid gap-3 grid-cols-1 sm:grid-cols-2'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-24 w-full rounded-xl' />
                  ))}
                </div>
              ) : accounts.length === 0 ? (
                <div className='flex flex-col items-center justify-center gap-3 py-10 text-center'>
                  <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
                    <Icons.wallet className='text-muted-foreground size-6' />
                  </div>
                  <div>
                    <p className='text-sm font-medium'>Nenhuma conta cadastrada</p>
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                      {canManage
                        ? 'Crie a primeira conta para começar a registrar transações.'
                        : 'Aguarde a criação de contas pela presidência.'}
                    </p>
                  </div>
                  {canManage && (
                    <Button variant='outline' size='sm' onClick={openNewAccount}>
                      <Icons.add className='mr-1.5 size-4' />
                      Nova conta
                    </Button>
                  )}
                </div>
              ) : (
                <div className='grid gap-3 grid-cols-1 sm:grid-cols-2'>
                  {accounts.map((a) => (
                    <AccountCard
                      key={a.id}
                      account={a}
                      hideValues={hideValues}
                      canEdit={canManage}
                      onEdit={openEditAccount}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex-row items-center justify-between pb-1'>
              <CardTitle className='text-base font-semibold'>Transações recentes</CardTitle>
              {!isLoading && recentTransactions.length > 0 && (
                <span className='text-muted-foreground text-xs'>
                  últimas {recentTransactions.length}
                </span>
              )}
            </CardHeader>
            <CardContent className='pt-0'>
              {isLoading ? (
                <div className='space-y-3'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className='h-12 w-full rounded-lg' />
                  ))}
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className='flex flex-col items-center justify-center gap-2 py-10 text-center'>
                  <Icons.receipt className='size-8 text-muted-foreground' />
                  <p className='text-muted-foreground text-sm'>Nenhuma transação registrada</p>
                </div>
              ) : (
                <div>
                  {recentTransactions.map((t) => (
                    <TransactionRow
                      key={t.id}
                      transaction={t}
                      accountName={accountMap.get(t.account_id)?.name ?? 'Conta removida'}
                      hideValues={hideValues}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className='min-w-0 space-y-4'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base font-semibold'>Despesas por categoria</CardTitle>
              <p className='text-muted-foreground text-xs'>Mês atual</p>
            </CardHeader>
            <CardContent className='pt-0'>
              {isLoading ? (
                <Skeleton className='h-[220px] w-full rounded-lg' />
              ) : (
                <ExpenseCategoryChart data={monthExpenseByCategory} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-1'>
              <CardTitle className='text-base font-semibold'>Maiores despesas</CardTitle>
              <p className='text-muted-foreground text-xs'>Mês atual</p>
            </CardHeader>
            <CardContent className='pt-0'>
              {isLoading ? (
                <div className='space-y-3'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className='h-10 w-full rounded-lg' />
                  ))}
                </div>
              ) : (
                <TopExpenses transactions={topExpenses} hideValues={hideValues} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {canManage && (
        <>
          <TransactionFormDialog
            open={txDialogOpen}
            onOpenChange={setTxDialogOpen}
            accounts={accounts}
          />
          <AccountFormDialog
            open={accountDialogOpen}
            onOpenChange={setAccountDialogOpen}
            account={editingAccount}
          />
        </>
      )}
    </div>
  );
}
