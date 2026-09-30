'use client';

import { useCallback, useMemo } from 'react';
import { AlmoxarifadoRepository } from '@/repositories/almoxarifado.repository';
import { UserRepository } from '@/repositories/users.repository';
import { LoansPanel } from './loans-panel';
import type { AlmoxarifadoLoan } from '@/types/almoxarifado';

const UNKNOWN_USER = 'Usuário desconhecido';

interface AllLoansSectionProps {
  getMaterialName: (materialId: string) => string;
  canReturnLoan: (loan: AlmoxarifadoLoan) => boolean;
  onReturn: (loan: AlmoxarifadoLoan) => void;
}

/** Visão de gestão — renderizar somente quando `canViewAllLoans`. */
export function AllLoansSection({
  getMaterialName,
  canReturnLoan,
  onReturn
}: AllLoansSectionProps) {
  const { data = [], isLoading, error, refetch } = AlmoxarifadoRepository.useAllLoans();
  const { data: users = [] } = UserRepository.useSelectable();

  const userNameById = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users]);
  const getBorrowerName = useCallback(
    (userId: string) => userNameById.get(userId) ?? UNKNOWN_USER,
    [userNameById]
  );

  return (
    <LoansPanel
      loans={data}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refetch()}
      getMaterialName={getMaterialName}
      getBorrowerName={getBorrowerName}
      canReturnLoan={canReturnLoan}
      onReturn={onReturn}
      empty={{
        title: 'Nenhum empréstimo registrado',
        description: 'Os empréstimos da equipe aparecerão aqui assim que forem registrados.'
      }}
    />
  );
}
