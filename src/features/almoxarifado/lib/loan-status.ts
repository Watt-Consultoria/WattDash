import type { AlmoxarifadoLoan, LoanStatus } from '@/types/almoxarifado';

/** Prazo máximo de um empréstimo, em dias corridos a partir de hoje. */
export const MAX_LOAN_DAYS = 14;

export function getLoanStatus(loan: AlmoxarifadoLoan, now: Date = new Date()): LoanStatus {
  if (loan.devolvido_em !== null) return 'devolvido';
  return new Date(loan.previsao_devolucao) < now ? 'atrasado' : 'ativo';
}

const STATUS_ORDER: Record<LoanStatus, number> = {
  atrasado: 0,
  ativo: 1,
  devolvido: 2
};

/** Atrasados primeiro, depois ativos (previsão mais próxima primeiro), depois devolvidos (mais recentes primeiro). */
export function sortLoans(loans: AlmoxarifadoLoan[], now: Date = new Date()): AlmoxarifadoLoan[] {
  return loans.toSorted((a, b) => {
    const statusA = getLoanStatus(a, now);
    const statusB = getLoanStatus(b, now);
    if (statusA !== statusB) return STATUS_ORDER[statusA] - STATUS_ORDER[statusB];
    if (statusA === 'devolvido') {
      return (b.devolvido_em ?? '').localeCompare(a.devolvido_em ?? '');
    }
    return a.previsao_devolucao.localeCompare(b.previsao_devolucao);
  });
}

/** Unidades emprestadas no momento (não devolvidas) por material. */
export function countOutstandingByMaterial(loans: AlmoxarifadoLoan[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const loan of loans) {
    if (loan.devolvido_em !== null) continue;
    counts.set(loan.material_id, (counts.get(loan.material_id) ?? 0) + loan.quantidade);
  }
  return counts;
}

/** `yyyy-mm-dd` (data local) → ISO do fim do dia local, para não marcar atraso no próprio dia. */
export function endOfLocalDayISO(date: string): string {
  return new Date(`${date}T23:59:59`).toISOString();
}

export function todayLocalISODate(): string {
  return addDaysLocalISODate(0);
}

export function formatDateTimeBR(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

const DAY_MS = 86_400_000;

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Diferença em dias de calendário (fuso local) entre `iso` e `now`; negativo = passado. */
export function calendarDaysFrom(iso: string, now: Date = new Date()): number {
  return Math.round((startOfLocalDay(new Date(iso)) - startOfLocalDay(now)) / DAY_MS);
}

function pluralDays(count: number): string {
  return `${count} ${count === 1 ? 'dia' : 'dias'}`;
}

/** Prazo em linguagem natural: "Vence amanhã", "Atrasado há 3 dias", "Devolvido em 10/09/2026". */
export function formatDueLabel(loan: AlmoxarifadoLoan, now: Date = new Date()): string {
  if (loan.devolvido_em !== null) return `Devolvido em ${formatDateTimeBR(loan.devolvido_em)}`;

  const days = calendarDaysFrom(loan.previsao_devolucao, now);
  if (getLoanStatus(loan, now) === 'atrasado') {
    return days >= 0 ? 'Venceu hoje' : `Atrasado há ${pluralDays(-days)}`;
  }
  if (days <= 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  return `Vence em ${pluralDays(days)}`;
}

export function countByStatus(
  loans: AlmoxarifadoLoan[],
  now: Date = new Date()
): Record<LoanStatus, number> {
  const counts: Record<LoanStatus, number> = { ativo: 0, atrasado: 0, devolvido: 0 };
  for (const loan of loans) counts[getLoanStatus(loan, now)] += 1;
  return counts;
}

/** Data local `yyyy-mm-dd` daqui a `days` dias. */
export function addDaysLocalISODate(days: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
