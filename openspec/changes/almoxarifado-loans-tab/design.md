## Context

A página `/dashboard/projects` é um `ProjectsView` client-side em abas (`Projetos`, `Minhas Etapas`, `Feedback` condicional a `hasProjectDirectorAccess`); a navbar agrupa itens em `nav-config.ts`, com o grupo "Projetos" restrito a `allowedSectors: ['projetos']`. Os dados vêm de repositórios React Query em `src/repositories/*.repository.ts` (padrão `keys` + funções `apiGet/apiPost/apiPatch` + hooks `useX`), e as permissões ficam em helpers puros como `src/features/projects/lib/permissions.ts`, que espelham as policies do backend a partir de `UserProfile` (`role`, `sector`, `rank`; `ROLE_RANK`: consultor 0, gerente 1, diretor 2, assessor 3, presidente 4).

Backend (`wattapi/src/modules/almoxarifado`):

| Endpoint | Policy | Observação |
|---|---|---|
| `GET /almoxarifado/material` | autenticado | ordenado por `nome` |
| `POST /almoxarifado/material` | role ∈ gerente, diretor, assessor, presidente | |
| `PATCH /almoxarifado/material/{id}` | idem | parcial; 400 se vazio |
| `GET /almoxarifado/emprestimos` | autenticado | **retorna todos**, sem escopo por usuário, ordenado por `emprestado_em DESC` |
| `POST /almoxarifado/emprestimos` | autenticado | `user_id` = JWT `sub`; debita estoque em transação; 400 "Estoque insuficiente" |
| `PATCH /almoxarifado/emprestimos/{id}` | autenticado | **sem checagem de dono**; devolve estoque; 400 "Empréstimo já foi devolvido" |

O response de empréstimo traz só `material_id` e `user_id` (sem nomes) — o dashboard precisa fazer o join no cliente.

## Goals / Non-Goals

**Goals:**
- Página **Almoxarifado** própria (`/dashboard/almoxarifado`), listada no grupo "Projetos" da navbar, com abas Materiais / Meus Empréstimos / Todos os Empréstimos cobrindo catálogo, empréstimo, devolução e gestão de materiais.
- Regras de visibilidade por rank/role explícitas, centralizadas e testáveis em um único helper.
- Estoque sempre consistente na UI após qualquer mutação.

**Non-Goals:**
- Alterar o `wattapi` (escopo de backend fica como follow-up recomendado).
- Excluir materiais (não existe endpoint `DELETE`).
- Alterar `ProjectsView` ou mover o Almoxarifado para outro grupo da navbar.
- Vincular empréstimo a um projeto específico (API não suporta).

## Decisions

### D1. Página independente `/dashboard/almoxarifado` + feature module `src/features/almoxarifado`
O Almoxarifado é um domínio próprio da API e tem sub-visões suficientes para ser uma página, não uma aba aninhada em `ProjectsView` (evita abas dentro de abas e mistura de domínios). A rota tem `PageContainer` próprio e um item no grupo "Projetos" da navbar com `allowedSectors: ['projetos']` — mesma visibilidade da página Projetos. Alternativa descartada: aba dentro de `ProjectsView` (versão anterior desta proposta).

### D1.1. Abas da página com estado na URL
`AlmoxarifadoView` usa `Tabs` com `useQueryState('tab', parseAsStringLiteral([...]))` (mesmo padrão de `team-view.tsx`): `materiais` (padrão), `meus-emprestimos` e `todos-emprestimos`. A aba de gestão só é renderizada quando `canViewAllLoans`; se um consultor abrir `?tab=todos-emprestimos` a view cai para `materiais`. Os diálogos (empréstimo, devolução, material) ficam no nível da view, compartilhados entre abas. O rótulo "Todos os Empréstimos" exibe um badge com o número de atrasados.

### D2. Matriz de permissões (`getAlmoxarifadoCapabilities(profile)`)

| Capacidade | consultor | gerente / diretor / assessor / presidente |
|---|---|---|
| Ver catálogo de materiais | ✅ | ✅ |
| Solicitar empréstimo | ✅ | ✅ |
| Ver próprios empréstimos | ✅ | ✅ |
| Devolver próprio empréstimo | ✅ | ✅ |
| Criar/editar material (e estoque) | ❌ | ✅ |
| Ver todos os empréstimos + nome do responsável | ❌ | ✅ |
| Devolver empréstimo de terceiros | ❌ | ✅ |

"Gestão" = `role !== 'consultor'` (equivalente a `rank >= 1`), exatamente a lista da policy de material no backend. Usar a mesma regra para "ver todos" evita uma terceira categoria de acesso e bate com a policy que o backend já considera "gestão do almoxarifado". Alternativa considerada: restringir "ver todos" a rank ≥ 3 — descartada porque gerentes precisam cobrar devoluções da equipe.

`canReturnLoan(loan)` = `loan.devolvido_em === null && (isManager || loan.user_id === profile.id)`.

### D3. Filtro de visibilidade no cliente, via `select` do React Query
`useLoans()` busca a lista completa uma única vez (uma query key), e hooks derivados aplicam `select`: `useMyLoans()` filtra por `user_id === profile.id`; `useAllLoans()` é `enabled` apenas para gestão. Componentes de consultor **nunca** recebem a lista não filtrada. Alternativa: filtrar dentro do componente — descartada porque espalha a regra e facilita vazamento em refactors.

### D4. Invalidação cruzada
`useCreateLoan` e `useReturnLoan` invalidam `almoxarifadoKeys.loans()` **e** `almoxarifadoKeys.materials()`, pois o backend altera `quantidade_estoque`. `useCreate/UpdateMaterial` invalidam materiais e empréstimos (o nome do material é exibido no empréstimo).

### D5. Join de nomes no cliente
Mapas `Map<id, Material>` (sempre disponível) e `Map<id, UserResponse>` via `UserRepository.useSelectable()` (carregado **apenas** na visão de gestão). Fallback: "Material removido" / "Usuário desconhecido".

### D6. Status derivado
`getLoanStatus(loan, now)` → `'devolvido' | 'atrasado' | 'ativo'`, função pura em `lib/loan-status.ts`, reutilizada por badges, filtros e ordenação (atrasados primeiro na visão de gestão).

### D7. Formulários com `useAppForm` + Zod
- Empréstimo: `material_id` (apenas materiais com estoque > 0), `quantidade` int 1..estoque, `previsao_devolucao` data futura (enviada como ISO, fim do dia local), `observacoes` opcional (omitida se vazia — API exige `minLength: 1`).
- Prazo máximo de empréstimo: `MAX_LOAN_DAYS = 14` (`lib/loan-status.ts`). É aplicado em três camadas antes da submissão: refine no schema Zod (`buildLoanSchema(today, maxDate)`), validador `onChange` do campo e datas desabilitadas no calendário (`DateField` ganhou `minDate`/`maxDate` opcionais, retrocompatível). **A API não impõe esse limite** — follow-up recomendado no `wattapi`.
- Material: `nome`, `descricao` obrigatórios, `quantidade_estoque` int ≥ 0, `observacoes` opcional. Edição envia apenas campos alterados.
- Erros 400 do backend (estoque insuficiente, já devolvido) exibidos via toast com a mensagem da API.

### D8. UX mobile-first
- **Modais responsivos** (`responsive-modal.tsx`): bottom sheet arrastável (`Drawer`/vaul) abaixo de 768px e `Dialog` centralizado acima. Rodapé de ações fixo no sheet, respeitando `env(safe-area-inset-bottom)`.
- **Alvos de toque**: botões, chips, busca e stepper com 44px de altura no celular (`h-11`) e 36px no desktop (`md:h-9`). Inputs com fonte de 16px no celular para evitar o zoom automático do iOS.
- **Abas** em segmented control de largura total no celular. Rótulos curtos visíveis ("Meus", "Todos"), com o texto completo para leitor de tela via `sr-only`. A troca curto/completo usa container query (`@container/tabs`, completo a partir de 42rem da própria barra), não o viewport, porque a sidebar reduz a área útil. Rótulos nunca quebram linha e truncam com reticências como último recurso. Contadores: empréstimos em aberto do usuário (vermelho se houver atraso) e atrasados da equipe.
- **Banner de atraso** para o próprio usuário, com atalho para "Meus empréstimos".
- **Filtros em chips** com contagem, rolagem horizontal de borda a borda no celular. Busca por material ou pessoa na visão de gestão; filtro "Disponíveis" no catálogo.
- **Cards**: faixa lateral colorida por status, badge com ícone (cor nunca é o único sinal) e prazo em linguagem natural ("Vence amanhã", "Atrasado há 3 dias") ao lado da data absoluta. Indicador de estoque em três níveis (sem estoque / últimas unidades / disponível). No empréstimo atrasado, "Registrar devolução" vira a ação primária.
- **Formulários**: stepper −/+ para quantidades (limitado ao estoque) e atalhos de data (amanhã, 3 dias, 1 ou 2 semanas) além do calendário.
- **FAB** "Cadastrar material" para gestão no celular. No desktop, botão na barra de ferramentas.
- **Estados**: skeletons com o formato dos cards, estados vazios com ícone e ação ("Ver materiais", "Limpar filtros"), erro com `role='alert'` e contagem de resultados via `aria-live`.

## Risks / Trade-offs

- **[Backend sem escopo por usuário]** Consultores recebem no payload os empréstimos de todos; um usuário técnico pode inspecionar a rede ou chamar o `PATCH` direto → Mitigação: filtro centralizado no cliente (D3) + follow-up documentado para o `wattapi` (escopar `GET` por `user_id` quando `role === 'consultor'` e checar dono no `PATCH`).
- **[Editar estoque com empréstimos ativos]** `quantidade_estoque` representa o disponível, não o total; um gestor pode "zerar" sem perceber empréstimos em aberto → Mitigação: no diálogo de edição, mostrar "N unidades emprestadas no momento" e rotular o campo como "Disponível em estoque".
- **[Condição de corrida no estoque]** Estoque exibido pode estar defasado → o backend usa `FOR UPDATE`; a UI trata o 400 e revalida a lista de materiais.
- **[Fuso horário]** `previsao_devolucao` escolhida como data no fuso local → enviar como fim do dia local em ISO para não marcar "atrasado" no mesmo dia.
- **[`GET /users` para toda a equipe]** Carregar usuários só quando `canViewAllLoans` para não ampliar tráfego para consultores.

## Migration Plan

Mudança puramente aditiva no frontend; sem migração de dados. Rollback = remover a rota `src/app/dashboard/almoxarifado` e o item da navbar.

## Open Questions

- Diretores de outros setores (não `projetos`) não veem o grupo "Projetos" na navbar — se precisarem gerir o almoxarifado, basta ajustar `allowedSectors` do item. Assumido: não. Observação: a restrição por setor é só de navegação (não há guard de rota), como nas demais páginas.
- Confirmar com o time se gerentes devem ver **todos** os empréstimos ou apenas os da própria equipe (a API não tem noção de equipe; assumido: todos).
