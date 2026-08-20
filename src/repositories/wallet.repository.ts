import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import type {
  WalletAccount,
  WalletTransaction,
  CreateWalletAccountPayload,
  UpdateWalletAccountPayload,
  CreateWalletTransactionPayload
} from '@/types/api';

export const walletKeys = {
  all: () => ['wallet'] as const,
  accounts: () => ['wallet', 'accounts'] as const,
  transactions: (accountId?: string) => ['wallet', 'transactions', accountId ?? 'all'] as const
};

async function getAccounts(token: string): Promise<WalletAccount[]> {
  return apiGet<WalletAccount[]>('/wallet/accounts', token);
}

async function createAccount(
  token: string,
  payload: CreateWalletAccountPayload
): Promise<WalletAccount> {
  return apiPost<WalletAccount>('/wallet/accounts', token, payload);
}

async function updateAccount(
  token: string,
  id: string,
  payload: UpdateWalletAccountPayload
): Promise<WalletAccount> {
  return apiPatch<WalletAccount>(`/wallet/accounts/${id}`, token, payload);
}

async function getTransactions(token: string, accountId?: string): Promise<WalletTransaction[]> {
  const query = accountId ? `?account_id=${accountId}` : '';
  return apiGet<WalletTransaction[]>(`/wallet/transactions${query}`, token);
}

async function createTransaction(
  token: string,
  payload: CreateWalletTransactionPayload
): Promise<WalletTransaction> {
  return apiPost<WalletTransaction>('/wallet/transactions', token, payload);
}

function useAccounts() {
  const token = useAccessToken();
  return useQuery({
    queryKey: walletKeys.accounts(),
    queryFn: () => getAccounts(token),
    enabled: !!token
  });
}

function useCreateAccount() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWalletAccountPayload) => createAccount(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: walletKeys.accounts() });
    }
  });
}

function useUpdateAccount() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWalletAccountPayload }) =>
      updateAccount(token, id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: walletKeys.accounts() });
    }
  });
}

function useTransactions(accountId?: string) {
  const token = useAccessToken();
  return useQuery({
    queryKey: walletKeys.transactions(accountId),
    queryFn: () => getTransactions(token, accountId),
    enabled: !!token
  });
}

function useCreateTransaction() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWalletTransactionPayload) => createTransaction(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: walletKeys.all() });
    }
  });
}

export const WalletRepository = {
  keys: walletKeys,
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useTransactions,
  useCreateTransaction
};
