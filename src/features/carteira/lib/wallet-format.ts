import type { Icons } from '@/components/icons';
import type { ReimbursementCategory, WalletAccountType } from '@/types/api';

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDateBR(iso: string): string {
  const date = iso.length <= 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function parseBRLInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  return parseInt(digits || '0', 10);
}

export function formatBRLInput(cents: number): string {
  if (cents === 0) return '';
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export const ACCOUNT_TYPE_LABEL: Record<WalletAccountType, string> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  credit_card: 'Cartão de crédito',
  investment: 'Investimento',
  cash: 'Dinheiro'
};

export const ACCOUNT_TYPE_ICON: Record<WalletAccountType, keyof typeof Icons> = {
  checking: 'bank',
  savings: 'piggyBank',
  credit_card: 'creditCard',
  investment: 'trendingUp',
  cash: 'cash'
};

export const ACCOUNT_TYPE_OPTIONS: { value: WalletAccountType; label: string }[] = (
  Object.keys(ACCOUNT_TYPE_LABEL) as WalletAccountType[]
).map((value) => ({ value, label: ACCOUNT_TYPE_LABEL[value] }));

export const WALLET_CATEGORY_LABEL: Record<ReimbursementCategory, string> = {
  ingresso: 'Ingresso',
  alimentação: 'Alimentação',
  transporte: 'Transporte',
  equipamento: 'Equipamento',
  outro: 'Outro'
};

export const WALLET_CATEGORY_OPTIONS: { value: ReimbursementCategory; label: string }[] = (
  Object.keys(WALLET_CATEGORY_LABEL) as ReimbursementCategory[]
).map((value) => ({ value, label: WALLET_CATEGORY_LABEL[value] }));

export const CATEGORY_CHART_COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#10b981', '#8b5cf6'];
