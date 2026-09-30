'use client';

import { useCallback, useMemo, useState } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { AlmoxarifadoRepository } from '@/repositories/almoxarifado.repository';
import { cn } from '@/lib/utils';
import { getAlmoxarifadoCapabilities } from '../lib/permissions';
import { countByStatus, countOutstandingByMaterial } from '../lib/loan-status';
import { MaterialsCatalog } from './materials-catalog';
import { MyLoansSection } from './my-loans-section';
import { AllLoansSection } from './all-loans-section';
import { LoanRequestDialog } from './loan-request-dialog';
import { LoanReturnDialog } from './loan-return-dialog';
import { MaterialFormDialog } from './material-form-dialog';
import { OverdueBanner } from './overdue-banner';
import type { AlmoxarifadoLoan, AlmoxarifadoMaterial } from '@/types/almoxarifado';

const UNKNOWN_MATERIAL = 'Material removido';

const TABS = ['materiais', 'meus-emprestimos', 'todos-emprestimos'] as const;
type TabValue = (typeof TABS)[number];

type MaterialDialogState = { open: false } | { open: true; material: AlmoxarifadoMaterial | null };

// Largura decidida pelo espaço da própria barra (container query), não pelo viewport:
// com a sidebar aberta a área de conteúdo pode ser estreita mesmo em telas largas.
const TRIGGER_CLASS = 'h-full min-w-0 gap-1.5 px-2 text-sm whitespace-nowrap @2xl/tabs:px-3';

/** Rótulo curto em barras estreitas; completo quando há espaço. Leitores de tela sempre leem o completo. */
function TabLabel({ short, rest }: { short: string; rest: string }) {
  return (
    <span className='min-w-0 truncate'>
      {short}
      <span className='sr-only @2xl/tabs:not-sr-only @2xl/tabs:whitespace-nowrap'>{rest}</span>
    </span>
  );
}

function CountPill({ count, isAlert }: { count: number; isAlert?: boolean }) {
  if (count === 0) return null;
  return (
    <span
      className={cn(
        'min-w-5 shrink-0 rounded-full px-1.5 text-center text-[11px] leading-5 font-semibold tabular-nums',
        isAlert ? 'bg-red-500 text-white' : 'bg-muted-foreground/15'
      )}
    >
      {count}
    </span>
  );
}

export function AlmoxarifadoView() {
  const { profile } = useUserProfile();
  const capabilities = getAlmoxarifadoCapabilities(profile);

  const [tabParam, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(TABS).withDefault('materiais')
  );
  // Consultores não podem cair na aba de gestão, nem via URL.
  const tab: TabValue =
    tabParam === 'todos-emprestimos' && !capabilities.canViewAllLoans ? 'materiais' : tabParam;

  const materialsQuery = AlmoxarifadoRepository.useMaterials();
  const materials = useMemo(() => materialsQuery.data ?? [], [materialsQuery.data]);
  const { data: myLoans = [] } = AlmoxarifadoRepository.useMyLoans();
  // Habilitado só para gestão; usado no contador de atrasos e nas unidades emprestadas ao editar estoque.
  const { data: allLoans = [] } = AlmoxarifadoRepository.useAllLoans();

  const [loanDialog, setLoanDialog] = useState<{ open: boolean; materialId: string | null }>({
    open: false,
    materialId: null
  });
  const [returningLoan, setReturningLoan] = useState<AlmoxarifadoLoan | null>(null);
  const [materialDialog, setMaterialDialog] = useState<MaterialDialogState>({ open: false });

  const materialNameById = useMemo(
    () => new Map(materials.map((material) => [material.id, material.nome])),
    [materials]
  );
  const getMaterialName = useCallback(
    (materialId: string) => materialNameById.get(materialId) ?? UNKNOWN_MATERIAL,
    [materialNameById]
  );
  const outstandingByMaterial = useMemo(() => countOutstandingByMaterial(allLoans), [allLoans]);
  const myCounts = useMemo(() => countByStatus(myLoans), [myLoans]);
  const allOverdue = useMemo(() => countByStatus(allLoans).atrasado, [allLoans]);

  const goTo = (next: TabValue) => void setTab(next);
  const editingMaterial = materialDialog.open ? materialDialog.material : null;

  return (
    <div className='space-y-4'>
      {tab !== 'meus-emprestimos' && myCounts.atrasado > 0 && (
        <OverdueBanner count={myCounts.atrasado} onView={() => goTo('meus-emprestimos')} />
      )}

      <Tabs value={tab} onValueChange={(v) => goTo(v as TabValue)} className='gap-4'>
        <div className='@container/tabs'>
          <TabsList
            className={cn(
              'grid h-11 w-full @3xl/tabs:inline-grid @3xl/tabs:h-9 @3xl/tabs:w-fit',
              capabilities.canViewAllLoans ? 'grid-cols-3' : 'grid-cols-2'
            )}
          >
            <TabsTrigger value='materiais' className={TRIGGER_CLASS}>
              <span className='min-w-0 truncate'>Materiais</span>
            </TabsTrigger>
            <TabsTrigger value='meus-emprestimos' className={TRIGGER_CLASS}>
              <TabLabel short='Meus' rest=' empréstimos' />
              <CountPill
                count={myCounts.ativo + myCounts.atrasado}
                isAlert={myCounts.atrasado > 0}
              />
            </TabsTrigger>
            {capabilities.canViewAllLoans && (
              <TabsTrigger value='todos-emprestimos' className={TRIGGER_CLASS}>
                <TabLabel short='Todos' rest=' os empréstimos' />
                <CountPill count={allOverdue} isAlert />
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value='materiais'>
          <MaterialsCatalog
            materials={materials}
            isLoading={materialsQuery.isLoading}
            error={materialsQuery.error}
            onRetry={() => void materialsQuery.refetch()}
            canManage={capabilities.canManageMaterials}
            onRequestLoan={(materialId) => setLoanDialog({ open: true, materialId })}
            onCreate={() => setMaterialDialog({ open: true, material: null })}
            onEdit={(material) => setMaterialDialog({ open: true, material })}
          />
        </TabsContent>

        <TabsContent value='meus-emprestimos'>
          <MyLoansSection
            getMaterialName={getMaterialName}
            canReturnLoan={capabilities.canReturnLoan}
            onReturn={setReturningLoan}
            onBrowseMaterials={() => goTo('materiais')}
          />
        </TabsContent>

        {capabilities.canViewAllLoans && (
          <TabsContent value='todos-emprestimos'>
            <AllLoansSection
              getMaterialName={getMaterialName}
              canReturnLoan={capabilities.canReturnLoan}
              onReturn={setReturningLoan}
            />
          </TabsContent>
        )}
      </Tabs>

      {capabilities.canRequestLoan && (
        <LoanRequestDialog
          open={loanDialog.open}
          onOpenChange={(open) => setLoanDialog((prev) => ({ ...prev, open }))}
          materials={materials}
          initialMaterialId={loanDialog.materialId}
        />
      )}

      <LoanReturnDialog
        loan={returningLoan}
        materialName={returningLoan ? getMaterialName(returningLoan.material_id) : ''}
        onClose={() => setReturningLoan(null)}
      />

      {capabilities.canManageMaterials && (
        <MaterialFormDialog
          open={materialDialog.open}
          onOpenChange={(open) => {
            if (!open) setMaterialDialog({ open: false });
          }}
          material={editingMaterial}
          outstandingQuantity={
            editingMaterial ? (outstandingByMaterial.get(editingMaterial.id) ?? 0) : 0
          }
        />
      )}
    </div>
  );
}
