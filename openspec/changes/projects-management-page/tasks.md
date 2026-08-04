## 1. Types & Repository

- [x] 1.1 Criar `src/types/projects.ts` com `Project`, `ProjectStatus`, `Deliverable`, `ProjectStage`, `StageStatus`, `StageSubmission`, `SubmittedFile`, `StageReview`, `ProjectReview`, `ProjectFeedback` e os payloads (`CreateProjectPayload`, `CreateStagePayload`, `UpdateStagePayload`, `CreateSubmissionPayload`, `CreateStageReviewPayload`, `CreateProjectReviewPayload`, `CreateFeedbackPayload`), espelhando os shapes do tópico `Projects` em `wattapi/API.md`.
- [x] 1.2 Criar `src/repositories/projects.repository.ts` com `projectsKeys` (aninhadas por `projectId`/`stageId`) e as funções `apiGet/apiPost/apiPatch/apiPut` para: `GET/POST /projects`, `GET /projects/:id`, `PATCH /projects/:id`.
- [x] 1.3 Adicionar ao repositório: `POST/GET/PATCH /projects/:id/stages(/:stageId)`.
- [x] 1.4 Adicionar ao repositório: `POST/GET /projects/:id/stages/:stageId/submissions(/:submissionId)`.
- [x] 1.5 Adicionar ao repositório: `POST/GET /projects/:id/stages/:stageId/reviews`.
- [x] 1.6 Adicionar ao repositório: `PATCH/GET /projects/:id/reviews`.
- [x] 1.7 Adicionar ao repositório: `POST/GET /projects/:id/feedback`.
- [x] 1.8 Exportar `ProjectsRepository` agregando todos os hooks `use*`, com invalidação de cache correta (criação/edição de etapa invalida `stages(projectId)`; submissão invalida `submissions(projectId,stageId)` e a etapa; revisões invalidam etapa/projeto conforme o caso).

## 2. Storage & Upload Helper

- [ ] 2.1 Confirmar/criar o bucket Supabase `project-stage-files` com a mesma política de acesso de `reimbursement-receipts` (write autenticado, leitura via signed URL apenas).
- [x] 2.2 Criar `src/features/projects/lib/upload-stage-files.ts` com `uploadStageFile(file, consultantId, supabase)` retornando `{ path, name }`, path `stage-files/${consultantId}/${uuid}/${sanitizedName}`, reaproveitando a lógica de sanitização de `uploadAttachments`.

## 3. Permissions Helper

- [x] 3.1 Criar `src/features/projects/lib/permissions.ts` com `getProjectCapabilities(profile, project)` retornando `{ canCreateProject, canManageStages, canSubmitStage(stage), canReviewStage(stage), canReviewProject, canClose, canGiveFeedback(project), canViewFeedback }`, implementando as regras de `MANAGER_ACCESS`/`PROJECT_DIRECTOR_ACCESS` descritas na API.

## 4. Navigation

- [x] 4.1 Adicionar item "Projetos" em `src/config/nav-config.ts` com `url: '/dashboard/projects'`, `allowedSectors: ['projetos']`, `minRank: 0`, ícone apropriado de `@/components/icons`.

## 5. Feature — Lista e Detalhe de Projetos

- [x] 5.1 Criar `src/features/projects/components/projects-view.tsx` com `Tabs` (Projetos / Minhas Etapas / Feedback quando aplicável), no molde de `PselView`.
- [x] 5.2 Criar `src/features/projects/components/project-list.tsx`: cards de projeto com status badge, filtros por status/lead/consultor, estado vazio, responsivo (coluna única < 640px).
- [x] 5.3 Criar `src/features/projects/components/project-status-badge.tsx` cobrindo os 4 status.
- [x] 5.4 Criar `src/features/projects/components/project-detail.tsx`: cabeçalho do projeto (nome, descrição, lead, tipo, datas), botões de transição de status conforme `getProjectCapabilities`, lista de etapas (`stages-section`).
- [x] 5.5 Criar `src/features/projects/components/project-form-dialog.tsx`: criação com seletores de lead (`LeadsRepository`) e portfólio (`PortfolioRepository`), nome, descrição, data de entrega; validação client-side dos campos obrigatórios.
- [x] 5.6 Criar dialogs de transição de projeto: `submit-for-review-dialog.tsx` (confirmação simples, desabilitada se houver etapa não `concluida`), `project-review-dialog.tsx` (aprovar/reprovar com `notes`), `close-project-dialog.tsx` (`closing_notes` obrigatório).
- [x] 5.7 Criar `src/features/projects/components/project-reviews-history.tsx` listando rodadas de `GET /projects/:id/reviews`.

## 6. Feature — Etapas do Projeto

- [x] 6.1 Criar `src/features/projects/components/stages-section.tsx`: lista de etapas ordenada por posição, card colapsado em mobile (nome + status chip) expandindo para checklist completo.
- [x] 6.2 Criar `src/features/projects/components/stage-status-badge.tsx` cobrindo `pendente`/`em_revisao`/`concluida`.
- [x] 6.3 Criar `src/features/projects/components/project-stage-form-dialog.tsx`: nome, descrição, datas, posição, consultor (seletor de `UsersRepository`), checklist repetível de entregáveis (adicionar/remover linhas com `name`+`description`), validações de data client-side.
- [x] 6.4 Criar `src/features/projects/components/my-stages-tab.tsx`: fila do consultor autenticado agregando etapas onde ele é `consultant_id` entre os projetos visíveis, priorizando `pendente`/`em_revisao`.

## 7. Feature — Submissão de Etapa

- [x] 7.1 Criar `src/features/projects/components/deliverable-upload-slot.tsx`: variante single-file de `AttachmentUpload` para um entregável específico (rótulo do entregável, status, remoção, erro inline).
- [x] 7.2 Criar `src/features/projects/components/stage-submission-dialog.tsx`: renderiza um `deliverable-upload-slot` por item do checklist, notas opcionais, faz upload via `uploadStageFile` antes de `POST .../submissions`, desabilita envio enquanto houver slot vazio/uploading/erro.
- [x] 7.3 Criar `src/features/projects/components/submissions-history.tsx`: lista de tentativas (`GET .../submissions`) ordenada por `attempt` desc, com detalhe (`GET .../submissions/:submissionId`) exibindo `signed_url` de cada arquivo.

## 8. Feature — Revisão de Etapa e Feedback

- [x] 8.1 Criar `src/features/projects/components/stage-review-dialog.tsx`: aprovar (`notes` opcional) ou reprovar (`notes`, `new_delivery_date`, `deliverable_ids` — seleção múltipla do checklist, mínimo 1), chamando `POST .../reviews`.
- [x] 8.2 Criar `src/features/projects/components/project-feedback-form.tsx`: formulário de feedback pós-fechamento para consultor elegível (`canGiveFeedback`), tratando `409` como "já enviado".
- [x] 8.3 Criar `src/features/projects/components/project-feedback-list.tsx`: visão consolidada de feedback para gerente/diretor (`canViewFeedback`), oculta (sem chamar a API) para os demais.

## 9. Page Route

- [x] 9.1 Criar `src/app/dashboard/projects/page.tsx` usando `PageContainer` (`pageTitle`, `pageDescription`) renderizando `ProjectsView`, seguindo o padrão de `src/app/dashboard/psel/page.tsx`.

## 10. Polish, Responsividade & Verificação

- [ ] 10.1 Revisar todos os dialogs em viewport 320–375px (dev tools) garantindo largura máx. 90vw, sem overflow horizontal, alvos de toque ≥ 40px.
- [ ] 10.2 Adicionar estados de loading (`Suspense`/skeleton) e erro consistentes com o restante do dashboard em cada query nova.
- [x] 10.3 Rodar `tsc --noEmit` e o lint do projeto sobre os arquivos novos/alterados e corrigir erros.
- [ ] 10.4 Testar manualmente os quatro papéis relevantes (consultor, gerente, diretor de projetos, superusuário) contra o fluxo completo: criar projeto → criar etapa → submeter entregáveis → revisar etapa → enviar projeto para revisão → revisão de diretoria → fechar → feedback.
