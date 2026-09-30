import type { UserProfile } from '@/types/user-profile';
import type { AlmoxarifadoLoan } from '@/types/almoxarifado';

export interface AlmoxarifadoCapabilities {
  /** Qualquer usuário autenticado pode pegar material emprestado. */
  canRequestLoan: boolean;
  /** Gestão: cadastrar/editar materiais e ajustar estoque. */
  canManageMaterials: boolean;
  /** Gestão: ver empréstimos de todos os usuários (consultor vê apenas os próprios). */
  canViewAllLoans: boolean;
  /** Responsável pelo empréstimo ou gestão, com o empréstimo ainda não devolvido. */
  canReturnLoan: (loan: AlmoxarifadoLoan) => boolean;
}

/**
 * Espelha a policy de `POST/PATCH /almoxarifado/material`:
 * `gerente`, `diretor`, `assessor`, `presidente` (todos exceto `consultor`).
 */
export function hasAlmoxarifadoManagerAccess(profile: UserProfile | null): boolean {
  return !!profile && profile.role !== 'consultor';
}

/**
 * O backend não escopa `GET`/`PATCH /almoxarifado/emprestimos` por usuário —
 * estas capacidades são a fonte da verdade de "quem vê o quê" no dashboard.
 */
export function getAlmoxarifadoCapabilities(profile: UserProfile | null): AlmoxarifadoCapabilities {
  const isManager = hasAlmoxarifadoManagerAccess(profile);

  return {
    canRequestLoan: !!profile,
    canManageMaterials: isManager,
    canViewAllLoans: isManager,
    canReturnLoan: (loan) =>
      !!profile && loan.devolvido_em === null && (isManager || loan.user_id === profile.id)
  };
}
