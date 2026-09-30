'use client';

import { useMemo, useState } from 'react';
import { toUserMessage } from '@/lib/api-client';
import { FilterChip, FilterChipGroup } from './filter-chips';
import { LoanCard } from './loan-card';
import { SearchInput } from './search-input';
import { EmptyState, LoansSkeleton, SectionError } from './section-state';
import { countByStatus, getLoanStatus, sortLoans } from '../lib/loan-status';
import type { AlmoxarifadoLoan, LoanStatus } from '@/types/almoxarifado';

type StatusFilter = LoanStatus | 'todos';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'atrasado', label: 'Atrasados' },
  { value: 'ativo', label: 'Em aberto' },
  { value: 'devolvido', label: 'Devolvidos' }
];

const FILTERED_EMPTY_TITLE: Record<LoanStatus, string> = {
  atrasado: 'Nenhum empréstimo atrasado',
  ativo: 'Nenhum empréstimo em aberto',
  devolvido: 'Nenhum empréstimo devolvido'
};

interface LoansPanelProps {
  loans: AlmoxarifadoLoan[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  getMaterialName: (materialId: string) => string;
  /** Quando informado, exibe o responsável e habilita a busca por nome. */
  getBorrowerName?: (userId: string) => string;
  canReturnLoan: (loan: AlmoxarifadoLoan) => boolean;
  onReturn: (loan: AlmoxarifadoLoan) => void;
  empty: { title: string; description?: string; action?: { label: string; onClick: () => void } };
}

/** Lista de empréstimos com chips de status (com contagem), busca opcional e estados vazios. */
export function LoansPanel({
  loans,
  isLoading,
  error,
  onRetry,
  getMaterialName,
  getBorrowerName,
  canReturnLoan,
  onReturn,
  empty
}: LoansPanelProps) {
  const [filter, setFilter] = useState<StatusFilter>('todos');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => countByStatus(loans), [loans]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortLoans(loans).filter((loan) => {
      if (filter !== 'todos' && getLoanStatus(loan) !== filter) return false;
      if (!q) return true;
      const haystack = [getMaterialName(loan.material_id), getBorrowerName?.(loan.user_id) ?? '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [loans, filter, query, getMaterialName, getBorrowerName]);

  if (isLoading) return <LoansSkeleton />;
  if (error) return <SectionError message={toUserMessage(error)} onRetry={onRetry} />;
  if (loans.length === 0) return <EmptyState icon='package' {...empty} />;

  const countFor = (value: StatusFilter) => (value === 'todos' ? loans.length : counts[value]);

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <FilterChipGroup label='Filtrar por status'>
          {FILTERS.map(({ value, label }) => (
            <FilterChip
              key={value}
              selected={filter === value}
              onClick={() => setFilter(value)}
              count={countFor(value)}
              isAlert={value === 'atrasado'}
            >
              {label}
            </FilterChip>
          ))}
        </FilterChipGroup>
        {getBorrowerName && (
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder='Buscar por material ou pessoa'
            className='md:w-72'
          />
        )}
      </div>

      <p className='sr-only' aria-live='polite'>
        {visible.length} empréstimo(s) exibido(s)
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon='search'
          title={
            query.trim()
              ? `Nada encontrado para “${query.trim()}”`
              : FILTERED_EMPTY_TITLE[filter as LoanStatus]
          }
          action={{
            label: 'Limpar filtros',
            onClick: () => {
              setFilter('todos');
              setQuery('');
            }
          }}
        />
      ) : (
        <ul className='space-y-3'>
          {visible.map((loan) => (
            <li key={loan.id}>
              <LoanCard
                loan={loan}
                materialName={getMaterialName(loan.material_id)}
                borrowerName={getBorrowerName?.(loan.user_id)}
                canReturn={canReturnLoan(loan)}
                onReturn={onReturn}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
