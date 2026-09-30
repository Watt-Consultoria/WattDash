'use client';

import { AlmoxarifadoRepository } from '@/repositories/almoxarifado.repository';
import { LoansPanel } from './loans-panel';
import type { AlmoxarifadoLoan } from '@/types/almoxarifado';

interface MyLoansSectionProps {
  getMaterialName: (materialId: string) => string;
  canReturnLoan: (loan: AlmoxarifadoLoan) => boolean;
  onReturn: (loan: AlmoxarifadoLoan) => void;
  onBrowseMaterials: () => void;
}

/** Consome apenas `useMyLoans` — nunca recebe empréstimos de outros usuários. */
export function MyLoansSection({
  getMaterialName,
  canReturnLoan,
  onReturn,
  onBrowseMaterials
}: MyLoansSectionProps) {
  const { data = [], isLoading, error, refetch } = AlmoxarifadoRepository.useMyLoans();

  return (
    <LoansPanel
      loans={data}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refetch()}
      getMaterialName={getMaterialName}
      canReturnLoan={canReturnLoan}
      onReturn={onReturn}
      empty={{
        title: 'Você ainda não pegou nada emprestado',
        description: 'Escolha um material no catálogo para registrar seu primeiro empréstimo.',
        action: { label: 'Ver materiais', onClick: onBrowseMaterials }
      }}
    />
  );
}
