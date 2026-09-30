## Why

A WattAPI passou a expor o domínio **Almoxarifado** (`/almoxarifado/material` e `/almoxarifado/emprestimos`), com controle de estoque transacional e notificação diária de empréstimos em atraso (`internal.service.ts → notifyOverdueAlmoxarifadoLoans`). Porém o dashboard não tem interface para isso: consultores não conseguem pegar um material emprestado nem registrar a devolução, e a gestão não consegue cadastrar materiais, ajustar estoque ou acompanhar quem está com o quê. Como o uso de materiais está atrelado à execução dos projetos, o Almoxarifado ganha uma **página própria e independente** (`/dashboard/almoxarifado`), listada no grupo **Projetos** da navbar, ao lado da página Projetos.

Um ponto crítico: o backend **não** aplica escopo por usuário nos empréstimos — `GET /almoxarifado/emprestimos` devolve todos os empréstimos para qualquer usuário autenticado e `PATCH /almoxarifado/emprestimos/{id}` permite que qualquer autenticado devolva qualquer empréstimo. A regra de "quem vê o quê" precisa, portanto, ser definida e aplicada no dashboard (com endurecimento no backend recomendado como follow-up).

## What Changes

- Nova página **Almoxarifado** em `/dashboard/almoxarifado` (`src/app/dashboard/almoxarifado/page.tsx`), independente de `ProjectsView`. Novo item no grupo "Projetos" da navbar (`nav-config.ts`) com a mesma visibilidade do item Projetos (`allowedSectors: ['projetos']` + superusuários) e breadcrumb próprio.
- Novo repositório `src/repositories/almoxarifado.repository.ts` (React Query) cobrindo os 6 endpoints: listar/criar/editar material, listar/criar/devolver empréstimo. Mutações de empréstimo invalidam também a lista de materiais (o estoque muda).
- Novos tipos em `src/types/almoxarifado.ts` espelhando os DTOs da API.
- Novo helper de permissões `src/features/almoxarifado/lib/permissions.ts` com as capacidades por rank/role:
  - **Todos** (inclusive `consultor`): veem o catálogo de materiais com estoque disponível, solicitam empréstimo, veem **apenas os próprios** empréstimos e registram a devolução **dos próprios** empréstimos.
  - **Gestão** (`gerente`, `diretor`, `assessor`, `presidente` — espelha a policy de `POST/PATCH /almoxarifado/material`): cadastram e editam materiais (incluindo ajuste de estoque), veem **todos** os empréstimos com o nome do responsável e registram devolução de qualquer empréstimo.
- A página é organizada em **abas** (estado na URL via `nuqs`, `?tab=`): **Materiais** (cards, busca, badge de estoque, ações de gestão), **Meus Empréstimos** e, apenas para gestão, **Todos os Empréstimos** (filtro ativos/devolvidos/atrasados, contador de atrasos no rótulo da aba).
- Diálogos: solicitar empréstimo (material, quantidade limitada ao estoque, previsão de devolução, observações), registrar devolução (observações opcionais), criar/editar material.
- Status derivado no cliente: `ativo`, `atrasado` (`devolvido_em == null` e `previsao_devolucao < agora`), `devolvido`, com badges no padrão visual existente. Mobile-first.

## Capabilities

### New Capabilities
- `almoxarifado-loans`: Catálogo de materiais, solicitação e devolução de empréstimos, gestão de materiais/estoque e as regras de visibilidade por rank/role na página Almoxarifado.

### Modified Capabilities
(nenhuma — a página Projetos não é alterada; o Almoxarifado apenas compartilha o grupo "Projetos" da navbar)

## Impact

- **Código novo**: `src/app/dashboard/almoxarifado/page.tsx`, `src/repositories/almoxarifado.repository.ts`, `src/types/almoxarifado.ts`, `src/features/almoxarifado/**`.
- **Código alterado**: `src/config/nav-config.ts` (item Almoxarifado no grupo Projetos), `src/hooks/use-breadcrumbs.tsx` (breadcrumb), `src/repositories/index.ts` (export), `src/components/icons.tsx` (ícones `package`/`returnItem`). `ProjectsView` **não** é alterado.
- **APIs consumidas**: `GET/POST /almoxarifado/material`, `PATCH /almoxarifado/material/{id}`, `GET/POST /almoxarifado/emprestimos`, `PATCH /almoxarifado/emprestimos/{id}`, além de `GET /users` (via `UserRepository.useSelectable`) para resolver `user_id` → nome na visão de gestão.
- **Segurança**: o filtro "apenas os próprios empréstimos" é aplicado no cliente; o payload completo continua trafegando para consultores. Recomenda-se follow-up no `wattapi` para escopar `GET` e `PATCH /almoxarifado/emprestimos` por usuário.
