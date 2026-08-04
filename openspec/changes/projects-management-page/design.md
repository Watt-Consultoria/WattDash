## Context

O domínio `/projects` da WattAPI (ver `Projects` em `../wattapi/API.md`) é um fluxo de cinco entidades: `projects` → `project_stages` (com checklist inline de `deliverables`) → `stage_submissions` (arquivos) → `stage_reviews`, mais uma revisão em nível de projeto (`project_reviews`, gate de diretoria) e um `project_feedback` pós-fechamento. Não existe frontend para nada disso hoje. O dashboard já tem duas referências diretas para exatamente esse formato de problema:

- **Reembolsos** (`src/features/reembolsos`): CRUD de entidade única + transição de status + fluxo de anexo "upload antes de submeter" (`AttachmentUpload` + `uploadAttachments` → Supabase Storage → passa `{path, name}[]` para a mutation de criação).
- **Processo Seletivo** (`src/features/selection-process`): fluxo multi-entidade, multi-role, em abas, com sub-recursos aninhados (etapas, candidatos, entrevistas) e seu próprio helper de upload (`upload-application-files.ts`).

Esta mudança compõe os dois padrões em vez de inventar um novo: reaproveita o `AttachmentUpload` como está, escreve um helper `uploadStageFiles` no molde de `uploadAttachments`, e estrutura a página como uma view em `Tabs` no espírito de `PselView`.

Controle de acesso: a visibilidade no nav usa o mecanismo client-side já existente `allowedSectors`/`minRank` (`src/hooks/use-nav.ts`), onde `rank >= 3` (assessor/presidente) já libera qualquer outra checagem. A autorização real é aplicada no backend pelas políticas `MANAGER_ACCESS` / `PROJECT_DIRECTOR_ACCESS` da API — o frontend só precisa esconder ações que o usuário atual não pode executar e tratar os `403` resultantes com uma UX adequada.

## Goals / Non-Goals

**Goals:**
- Uma única página de dashboard cobrindo todo o ciclo de vida do projeto: criação → execução em etapas → revisão de etapa → revisão de diretoria → fechamento → feedback.
- Reaproveitar a UX de upload já existente (drag/drop, status por arquivo, limites de tamanho/tipo) via o componente compartilhado `AttachmentUpload`.
- UI sensível a role: gerentes veem ações de criação/etapas/revisão nos projetos que criaram; consultores atribuídos veem uma fila de submissão; diretores de `projetos` veem uma fila de revisão/fechamento; qualquer usuário autenticado navega em modo leitura.
- Layout mobile-first e totalmente responsivo — todo dialog, tabela e formulário multi-etapa utilizável a partir de ~360px de largura, com alvos de toque adequados.

**Non-Goals:**
- Nenhuma mudança de API/backend — a `wattapi` já expõe todos os endpoints necessários.
- Sem suporte offline nem mutation otimista para o próprio passo de upload (uploads são pré-flight, igual a Reembolsos/PSEL).
- Sem atualização em tempo real (websocket) — invalidação de cache do React Query no sucesso da mutation é suficiente, consistente com todas as outras features do projeto.
- Nenhum editor genérico "editar qualquer campo" de projeto — `PATCH /projects/:id` só executa as duas transições de status documentadas, então a UI não pode se comportar como um editor de formulário livre.

## Decisions

**1. Layout do módulo espelha `selection-process`, não `reembolsos`.**
Projetos tem mais sub-entidades (etapas, entregáveis, submissões, revisões, feedback) do que a entidade única e plana de reembolsos, então precisa da estrutura em abas e multi-arquivo que `selection-process` já usa. Diretórios: `src/features/projects/components/*`, `src/features/projects/lib/upload-stage-files.ts`.
Alternativa considerada: achatar tudo em uma única view como Reembolsos — rejeitada, o grafo de entidades é profundo demais (um projeto tem N etapas, cada etapa tem N entregáveis, cada etapa tem N tentativas de submissão, cada submissão tem uma revisão) para uma lista de cards simples representar com clareza.

**2. Um único arquivo de repositório, agrupado por sub-recurso, seguindo a convenção de comentários-seção de `selection-process.repository.ts`.**
`src/repositories/projects.repository.ts` exporta `ProjectsRepository` com `keys` + um hook `use*` por endpoint, agrupados sob comentários `// ─── Projects ───`, `// ─── Stages ───`, `// ─── Submissions ───`, `// ─── Stage Reviews ───`, `// ─── Project Reviews ───`, `// ─── Feedback ───`. As query keys aninham por id de projeto/etapa para que a invalidação fique escopada (ex.: `stages(projectId)`, `submissions(projectId, stageId)`).

**3. Types em `src/types/projects.ts` dedicado, não em `src/types/api.ts`.**
`selection-process` já estabeleceu o precedente de um arquivo de types por feature (`src/types/selection-process.ts`) quando o domínio ultrapassa o `api.ts` compartilhado. Projetos tem 7 shapes (`Project`, `ProjectStage`, `Deliverable`, `StageSubmission`, `StageReview`, `ProjectReview`, `ProjectFeedback`) — o mesmo precedente se aplica.

**4. Novo bucket Supabase `project-stage-files`, com upload através de um wrapper fino no mesmo padrão de `uploadAttachments`.**
Formato de path: `stage-files/{consultantId}/{randomUUID}/{sanitizedName}` (espelha `receipts/{userId}/{uuid}/{name}` de Reembolsos). É exigido exatamente um arquivo por entregável do checklist da etapa — a UI de upload precisa associar cada arquivo selecionado a um `deliverable_id`, o que o `AttachmentUpload` não faz nativamente (ele é uma lista de arquivos plana). O dialog de submissão renderiza um slot de upload de arquivo único **por entregável** em vez de reaproveitar o dropzone multi-arquivo livre como está, para que o par `deliverable_id ↔ path` exigido por `POST .../submissions` seja inequívoco por construção, em vez de inferido pela ordem de upload.
Alternativa considerada: dropzone único + um seletor de entregável por arquivo enviado — rejeitada por ser mais sujeita a erro e menos amigável em mobile do que um slot claramente rotulado por entregável (checklists costumam ter de 1 a 4 itens).

**5. Transições de status são ações dedicadas, não um `<Select>` de status genérico.**
Como `PATCH /projects/:id` e `PATCH .../stages/:stageId` (via reviews) só suportam as transições documentadas, com payloads que carregam efeitos colaterais (`closing_notes`, `deliverable_ids`, `new_delivery_date`), cada transição ganha seu próprio botão + dialog (`SubmitForReviewDialog`, `ProjectReviewDialog`, `CloseProjectDialog`, `StageReviewDialog`) em vez de um dropdown genérico que sugeriria transições arbitrárias.

**6. RBAC exposto via um objeto `capabilities` calculado no client a partir de `rank` + `sector` + posse do recurso, não booleans espalhados pelo JSX.**
Um helper `getProjectCapabilities(profile, project)` (em `src/features/projects/lib/permissions.ts`) retorna `{ canCreateProject, canManageStages, canSubmitStage(stage), canReviewStage(stage), canReviewProject, canClose, canGiveFeedback(project) }`. Os componentes ramificam sobre essas flags em vez de re-derivar `rank >= 3 || (role === 'gerente' && created_by === me)` inline em cinco arquivos diferentes. Isso espelha a divisão `MANAGER_ACCESS` / `PROJECT_DIRECTOR_ACCESS` do servidor para manter os dois conceitualmente sincronizados, e centraliza toda decisão de "essa ação é permitida" em um único lugar auditável.

**7. Reaproveitar os repositórios `leads` e `portfolio` para os seletores de criação de projeto.**
Ambos já existem (`src/repositories/leads.repository.ts`, `src/repositories/portfolio.repository.ts`); o formulário de criação de projeto usa os hooks de listagem já expostos por eles para popular os selects `lead_id` / `project_type_id`, evitando lógica de fetch duplicada.

## Risks / Trade-offs

- **[Risk] Aninhamento profundo de entidades (projeto → etapa → entregável → submissão → revisão) tende a poluir a UI em telas pequenas.** → Mitigação: por padrão, uma view de detalhe por projeto acessada a partir de uma lista de cards (não uma página gigante com todas as etapas e submissões expandidas); cards de etapa colapsam para uma linha compacta de chips de status em mobile, expandindo para o checklist completo ao tocar — mesmo padrão de disclosure progressivo que o PSEL usa para candidatos → entrevistas → avaliações.
- **[Risk] UI de upload um-arquivo-por-entregável é uma interação nova, não coberta pela API atual (flat multi-arquivo) do `AttachmentUpload`.** → Mitigação: compor N instâncias independentes de uma variante single-file enxuta em vez de alterar o contrato do componente compartilhado, para não afetar Reembolsos/PSEL; se uma necessidade real de multi-slot se repetir, generalizar `AttachmentUpload` em uma mudança futura.
- **[Risk] Checagens de capability no client podem divergir das políticas `MANAGER_ACCESS`/`PROJECT_DIRECTOR_ACCESS` do servidor se as regras da API mudarem.** → Mitigação: centralizar em `getProjectCapabilities` (Decision 6) e tratar todo `403` como autoritativo — mutations sempre exibem `toUserMessage(err)` na falha em vez de assumir que a checagem client-side era suficiente.
- **[Risk] Projetos `finalizado` rejeitam qualquer novo `PATCH`, mas um cache client desatualizado ainda pode renderizar botões de ação habilitados depois que outro ator fecha o projeto.** → Mitigação: o helper de capability checa `project.status` diretamente (não só a role), e os handlers `onError` de 409 das mutations exibem um toast e invalidam a query do projeto para a UI se autocorrigir.

## Migration Plan

Sem migração de dados. Deploy é aditivo: nova rota, novo item de nav protegido pelos primitivos de RBAC já existentes, novo bucket Supabase (`project-stage-files`) criado com a mesma política de leitura-pública-off/escrita-service-role de `reimbursement-receipts`. Rollback é remover a rota e o item de nav — não há estado client persistido para reverter.

## Open Questions

- Ícone exato a usar no novo item de nav (`@/components/icons`) — escolher o mais próximo semanticamente (ex.: `briefcase`/`clipboard`) durante a implementação; não é relevante o bastante para bloquear a proposta.
- Se "Minhas Etapas" (fila do consultor) deve ser um item de nav próprio ou uma aba dentro da página Projetos — a proposta assume uma aba (consistente com o formato "uma página, várias abas" do PSEL), podendo ser revisitado se dados de uso mostrarem que consultores precisam de acesso mais rápido.
