## 1. Tipos e repositório

- [x] 1.1 Criar `src/types/almoxarifado.ts` com `AlmoxarifadoMaterial`, `CreateMaterialPayload`, `UpdateMaterialPayload`, `AlmoxarifadoLoan`, `CreateLoanPayload`, `ReturnLoanPayload` espelhando os DTOs do `openapi.json`
- [x] 1.2 Criar `src/repositories/almoxarifado.repository.ts` com `almoxarifadoKeys` (`all`, `materials`, `loans`) e funções `apiGet/apiPost/apiPatch` para os 6 endpoints
- [x] 1.3 Implementar hooks `useMaterials`, `useCreateMaterial`, `useUpdateMaterial` (invalidam materiais e empréstimos)
- [x] 1.4 Implementar `useLoans` (query base), `useMyLoans` (via `select` filtrando `user_id === profile.id`) e `useAllLoans` (`enabled` só para gestão)
- [x] 1.5 Implementar `useCreateLoan` e `useReturnLoan` invalidando `loans` **e** `materials`
- [x] 1.6 Exportar `AlmoxarifadoRepository` em `src/repositories/index.ts`

## 2. Regras de domínio

- [x] 2.1 Criar `src/features/almoxarifado/lib/permissions.ts` com `hasAlmoxarifadoManagerAccess(profile)` (role ≠ `consultor`) e `getAlmoxarifadoCapabilities(profile)` → `canManageMaterials`, `canViewAllLoans`, `canRequestLoan`, `canReturnLoan(loan)` conforme a matriz D2 do design
- [x] 2.2 Criar `src/features/almoxarifado/lib/loan-status.ts` com `getLoanStatus(loan, now)` (`ativo`/`atrasado`/`devolvido`) e comparador que ordena atrasados primeiro
- [x] 2.3 Criar schemas Zod de empréstimo (quantidade 1..estoque, data futura convertida para ISO fim do dia local, observações opcionais omitidas se vazias) e de material (nome/descrição obrigatórios, estoque int ≥ 0)

## 3. Componentes

- [x] 3.1 `loan-status-badge.tsx` com variantes para `ativo`, `atrasado` (destrutivo) e `devolvido`
- [x] 3.2 `materials-catalog.tsx`: busca, cards responsivos com estoque, badge "Sem estoque", botão "Pegar emprestado", ações de gestão condicionadas a `canManageMaterials`, skeleton/vazio/erro
- [x] 3.3 `material-form-dialog.tsx` (criar/editar) com `useAppForm`; na edição mostrar unidades emprestadas no momento e enviar só campos alterados
- [x] 3.4 `loan-request-dialog.tsx` com seleção de material (apenas com estoque > 0), quantidade limitada, data de previsão e observações; toast com mensagem da API em 400
- [x] 3.5 `loan-return-dialog.tsx` com observações opcionais e confirmação; toast em 400 "já devolvido" + revalidação
- [x] 3.6 `my-loans-section.tsx` consumindo **apenas** `useMyLoans` (conteúdo da aba "Meus Empréstimos")
- [x] 3.7 `all-loans-section.tsx` (renderizado só se `canViewAllLoans`) usando `useAllLoans` + `UserRepository.useSelectable` para nomes, filtro por status, fallback "Usuário desconhecido"/"Material removido"
- [x] 3.8 `almoxarifado-view.tsx` com `Tabs` (Materiais / Meus Empréstimos / Todos os Empréstimos) e `?tab=` via `nuqs`; aba de gestão só com `canViewAllLoans` (fallback para `materiais` via URL); badge de atrasados no rótulo; diálogos compartilhados no nível da view

## 4. Página e navegação

- [x] 4.1 Adicionar ícone de caixa/pacote em `src/components/icons.tsx` (se não existir)
- [x] 4.2 Criar `src/app/dashboard/almoxarifado/page.tsx` com `PageContainer` (título/descrição) renderizando `AlmoxarifadoView`
- [x] 4.3 Adicionar item "Almoxarifado" (`/dashboard/almoxarifado`, ícone `package`, `allowedSectors: ['projetos']`) no grupo "Projetos" de `src/config/nav-config.ts`
- [x] 4.4 Adicionar breadcrumb de `/dashboard/almoxarifado` em `src/hooks/use-breadcrumbs.tsx`
- [x] 4.5 Garantir que `ProjectsView` não tenha aba de Almoxarifado

## 5. Refino de UX mobile-first

- [x] 5.1 `responsive-modal.tsx` (Drawer no celular / Dialog no desktop) e migração dos 3 diálogos
- [x] 5.2 Abas em segmented control com contadores e banner de atraso (`overdue-banner.tsx`)
- [x] 5.3 `filter-chips.tsx`, `search-input.tsx` e `loans-panel.tsx` (filtro por status com contagem e busca na gestão)
- [x] 5.4 `loan-card.tsx` com faixa de status, prazo relativo (`formatDueLabel`) e avatar do responsável
- [x] 5.5 `material-card.tsx` com indicador de estoque, filtro "Disponíveis" e FAB de cadastro no celular
- [x] 5.6 `quantity-stepper.tsx` e atalhos de data no formulário de empréstimo
- [x] 5.7 Skeletons no formato dos cards e estados vazios com ação
- [x] 5.8 Limitar a previsão de devolução a 14 dias (`MAX_LOAN_DAYS`): schema Zod, validador do campo, `minDate`/`maxDate` no `DateField` e texto com a data limite

## 6. Verificação

- [x] 6.1 Rodar `bun lint`, `bun format:check` e `tsc --noEmit` sem erros
- [ ] 6.2 Validar manualmente como `consultor`: vê o item na navbar, catálogo, só os próprios empréstimos, sem ações de gestão, sem aba "Todos os Empréstimos" (nem via `?tab=`); consegue pegar e devolver o próprio empréstimo; estoque atualiza
- [ ] 6.3 Validar manualmente como `gerente`/`presidente`: cadastra/edita material, vê todos os empréstimos com nomes, filtra atrasados, devolve empréstimo de terceiro
- [ ] 6.4 Validar em viewport mobile (≈375px) e estados de erro/vazio
- [ ] 6.5 Registrar follow-up no `wattapi`: escopar `GET /almoxarifado/emprestimos` por usuário para consultores e checar dono em `PATCH /almoxarifado/emprestimos/{id}`; validar `previsao_devolucao <= emprestado_em + 14 dias` em `POST /almoxarifado/emprestimos`
