import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { LoanStatus } from '@/types/almoxarifado';

export const LOAN_STATUS_CONFIG: Record<
  LoanStatus,
  { label: string; icon: keyof typeof Icons; className: string; accent: string }
> = {
  ativo: {
    label: 'Ativo',
    icon: 'clock',
    className:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    accent: 'bg-blue-500'
  },
  atrasado: {
    label: 'Atrasado',
    icon: 'alertCircle',
    className:
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    accent: 'bg-red-500'
  },
  devolvido: {
    label: 'Devolvido',
    icon: 'circleCheck',
    className:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    accent: 'bg-green-500'
  }
};

interface LoanStatusBadgeProps {
  status: LoanStatus;
  className?: string;
}

export function LoanStatusBadge({ status, className }: LoanStatusBadgeProps) {
  const { label, icon, className: tone } = LOAN_STATUS_CONFIG[status];
  const Icon = Icons[icon];
  return (
    <Badge variant='outline' className={cn('gap-1', tone, className)}>
      <Icon className='size-3' aria-hidden />
      {label}
    </Badge>
  );
}
