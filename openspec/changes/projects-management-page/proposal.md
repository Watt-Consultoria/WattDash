## Why

A WattAPI já expõe todo o domínio `/projects` (criação, execução em etapas, revisão em dois níveis, fechamento com feedback — ver tópico `Projects` em `wattapi/API.md`), mas o dashboard não possui nenhuma interface para ele. Gerentes não têm como criar um projeto, atribuir etapas com checklist de entregáveis a consultores ou avançar um projeto pelo seu ciclo de revisão; diretores do setor `projetos` não têm como revisar ou fechar um projeto; consultores não têm como submeter entregáveis ou responder o feedback pós-fechamento. Esta mudança adiciona essa página, reaproveitando o mesmo modelo de anexação de arquivos já validado em Reembolsos e Processo Seletivo, com o mesmo padrão de UI/UX e responsividade extrema em dispositivos móveis.

## What Changes

- Nova página **Projetos** em `/dashboard/projects`, visível para qualquer usuário com `sector: 'projetos'` e para superusuários (`assessor`/`presidente`), reaproveitando o mecanismo `allowedSectors` de nav já usado por Leads/Portfólio.
- Novo repositório `src/repositories/projects.repository.ts` (React Query) cobrindo todos os endpoints de `Projects`: CRUD e transições de status de projeto, CRUD de etapas, submissões de etapa, revisões de etapa, revisões de projeto (diretoria) e feedback.
- Novo módulo `src/features/projects` com view em abas (no mesmo espírito de `PselView`): **Projetos** (lista + detalhe com trilha de etapas), **Minhas Etapas** (fila do consultor atribuído) e, para diretor/superusuário, uma fila de revisão de projetos.
- Formulário de criação de projeto (`gerente`/superusuário): seletores de lead e item de portfólio, nome, descrição, data de entrega.
- Formulário de criação/edição de etapa com checklist repetível de entregáveis (nome + descrição por item), atribuição de consultor, datas de entrega/prazo.
- Fluxo de submissão de etapa para o consultor atribuído: um arquivo por entregável, enviado ao bucket `project-stage-files` reaproveitando o componente `AttachmentUpload` e um helper de upload no mesmo molde de `uploadAttachments`, além de notas opcionais.
- Fluxo de revisão de etapa para o gerente do projeto: aprovar (→ `concluida`) ou reprovar com seleção de entregáveis para reenvio, nova data de entrega e notas.
- Transição de submissão para revisão do projeto (`em_andamento` → `em_revisao`, bloqueada até todas as etapas estarem `concluida`), revisão de diretoria (`em_revisao` → `revisado`/`em_andamento`) e fechamento (`revisado` → `finalizado`, exige `closing_notes`).
- Formulário de feedback pós-fechamento para consultores que atuaram no projeto, e uma visão consolidada de feedback para o gerente/diretor.
- Badges de status, linha do tempo e estados vazio/carregando/erro no mesmo padrão visual do restante do dashboard, construídos mobile-first com suporte total a toque e responsividade até telas de celular pequenas.

## Capabilities

### New Capabilities
- `projects-management`: Lista/detalhe de projetos, criação, ciclo de status `em_andamento → em_revisao → revisado → finalizado` (submissão, revisão de diretoria, fechamento) e controle de acesso à própria página por role/setor.
- `project-stages`: CRUD de etapas dentro de um projeto (checklist de entregáveis, atribuição de consultor, datas) e a fila "minhas etapas" do consultor.
- `project-stage-submissions`: Submissão de arquivo por entregável pelo consultor (upload para `project-stage-files`) e revisão de etapa (aprovar/reprovar com rework) pelo gerente, incluindo o feedback pós-fechamento.

### Modified Capabilities
(nenhuma — nenhum requisito de spec existente muda)

## Impact

- **Código novo**: `src/app/dashboard/projects/page.tsx`, `src/features/projects/**`, `src/repositories/projects.repository.ts`, `src/types/projects.ts`.
- **Código modificado**: `src/config/nav-config.ts` (novo item de nav, `allowedSectors: ['projetos']`), `src/components/icons.tsx` (novo ícone, se necessário).
- **API**: consome `wattapi` `/projects`, `/projects/:id/stages`, `/projects/:id/stages/:stageId/submissions`, `/projects/:id/stages/:stageId/reviews`, `/projects/:id/reviews`, `/projects/:id/feedback` — sem alterações de backend.
- **Storage**: nova dependência de bucket Supabase `project-stage-files` (upload feito pelo frontend, no mesmo molde de `reimbursement-receipts`/`selection-process-files`).
- **Dependências**: reaproveita os repositórios/queries existentes de `leads` e `portfolio` para os seletores de criação de projeto; nenhuma nova dependência npm esperada.
