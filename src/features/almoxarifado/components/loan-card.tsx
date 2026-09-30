import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { LOAN_STATUS_CONFIG, LoanStatusBadge } from './loan-status-badge';
import { formatDateTimeBR, formatDueLabel, getLoanStatus } from '../lib/loan-status';
import type { AlmoxarifadoLoan } from '@/types/almoxarifado';

interface LoanCardProps {
  loan: AlmoxarifadoLoan;
  materialName: string;
  /** Exibido apenas na visão de gestão. */
  borrowerName?: string;
  canReturn: boolean;
  onReturn: (loan: AlmoxarifadoLoan) => void;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function unitsLabel(quantity: number): string {
  return `${quantity} ${quantity === 1 ? 'unidade' : 'unidades'}`;
}

export function LoanCard({ loan, materialName, borrowerName, canReturn, onReturn }: LoanCardProps) {
  const status = getLoanStatus(loan);
  const isOverdue = status === 'atrasado';
  const isReturned = status === 'devolvido';

  return (
    <Card className='relative gap-0 overflow-hidden py-0'>
      <span
        aria-hidden
        className={cn('absolute inset-y-0 left-0 w-1', LOAN_STATUS_CONFIG[status].accent)}
      />
      <CardContent className='flex flex-col gap-3 p-4 pl-5 md:flex-row md:items-center md:gap-6'>
        <div className='min-w-0 flex-1 space-y-2'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h3 className='truncate leading-tight font-medium'>{materialName}</h3>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                {unitsLabel(loan.quantidade)} · retirado em{' '}
                <time dateTime={loan.emprestado_em}>{formatDateTimeBR(loan.emprestado_em)}</time>
              </p>
            </div>
            <LoanStatusBadge status={status} className='shrink-0' />
          </div>

          <p
            className={cn(
              'flex flex-wrap items-center gap-x-1.5 text-sm font-medium',
              isOverdue && 'text-destructive',
              isReturned && 'text-muted-foreground font-normal'
            )}
          >
            {formatDueLabel(loan)}
            {!isReturned && (
              <span className='text-muted-foreground font-normal'>
                · até{' '}
                <time dateTime={loan.previsao_devolucao}>
                  {formatDateTimeBR(loan.previsao_devolucao)}
                </time>
              </span>
            )}
          </p>

          {borrowerName && (
            <div className='flex min-w-0 items-center gap-2 text-sm'>
              <Avatar className='size-6'>
                <AvatarFallback className='text-[10px] font-medium'>
                  {getInitials(borrowerName)}
                </AvatarFallback>
              </Avatar>
              <span className='truncate'>{borrowerName}</span>
            </div>
          )}

          {loan.observacoes && (
            <p className='text-muted-foreground line-clamp-2 text-xs'>“{loan.observacoes}”</p>
          )}
        </div>

        {canReturn && (
          <Button
            variant={isOverdue ? 'default' : 'outline'}
            className='h-11 w-full shrink-0 md:h-9 md:w-auto'
            onClick={() => onReturn(loan)}
          >
            <Icons.returnItem className='mr-1.5 size-4' />
            Registrar devolução
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
