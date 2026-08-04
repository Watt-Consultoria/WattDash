## ADDED Requirements

### Requirement: Acesso à página de Projetos é restrito por setor e rank
O sistema SHALL exibir o item de navegação "Projetos" (`/dashboard/projects`) apenas para usuários autenticados cujo `sector` seja `projetos` ou cujo `rank` seja ≥ 3 (`assessor`/`presidente`), reaproveitando o mecanismo `allowedSectors` já usado por Leads/Portfólio. O sistema SHALL aplicar a mesma regra para acesso direto à rota (renderização condicional de ações), sabendo que a autorização definitiva é sempre imposta pela API.

#### Scenario: Usuário do setor projetos vê o item de navegação
- **WHEN** um usuário autenticado com `sector: 'projetos'` carrega o dashboard
- **THEN** o item "Projetos" aparece na navegação lateral

#### Scenario: Superusuário vê o item de navegação independente do setor
- **WHEN** um usuário autenticado com `rank >= 3` (assessor ou presidente) de qualquer setor carrega o dashboard
- **THEN** o item "Projetos" aparece na navegação lateral

#### Scenario: Usuário de outro setor e rank baixo não vê o item
- **WHEN** um usuário autenticado com `sector: 'comercial'` e `rank < 3` carrega o dashboard
- **THEN** o item "Projetos" não aparece na navegação lateral

### Requirement: Listagem de projetos com filtros
O sistema SHALL exibir uma lista de projetos obtida via `GET /projects`, com filtros combináveis por `status`, `lead_id` e `consultant_id` (para o próprio usuário, quando consultor), cada card mostrando nome, status, data de entrega e lead/portfólio associados.

#### Scenario: Lista com projetos
- **WHEN** um usuário com acesso à página carrega a aba "Projetos"
- **THEN** o sistema exibe cards com nome, badge de status (`em_andamento`/`em_revisao`/`revisado`/`finalizado`), data de entrega e o nome do lead

#### Scenario: Lista vazia
- **WHEN** nenhum projeto existe ou nenhum projeto corresponde aos filtros aplicados
- **THEN** o sistema exibe um estado vazio com orientação apropriada ao role do usuário (CTA de criação para gerente/superusuário, mensagem informativa para os demais)

#### Scenario: Filtro por status
- **WHEN** o usuário seleciona um status no filtro
- **THEN** o sistema chama `GET /projects?status=<status>` e atualiza a lista exibida

### Requirement: Criação de projeto por gerente ou superusuário
O sistema SHALL permitir que usuários com `role: 'gerente'` ou `rank >= 3` criem um novo projeto preenchendo lead (`lead_id`), item de portfólio (`project_type_id`), nome, descrição opcional e data de entrega, chamando `POST /projects`. O sistema SHALL ocultar a ação de criação para demais roles.

#### Scenario: Criação bem-sucedida
- **WHEN** um gerente preenche lead, tipo de projeto, nome e data de entrega e confirma
- **THEN** o sistema chama `POST /projects`, exibe toast de sucesso, fecha o formulário e invalida a lista de projetos

#### Scenario: Campos obrigatórios ausentes
- **WHEN** o usuário tenta submeter sem lead, tipo de projeto, nome ou data de entrega preenchidos
- **THEN** o botão de submissão permanece desabilitado e o sistema não chama a API

#### Scenario: Ação de criação oculta para consultor
- **WHEN** um usuário com `role: 'consultor'` e `rank < 3` acessa a página
- **THEN** o botão "Novo Projeto" não é exibido

### Requirement: Submissão de projeto para revisão pelo gerente
O sistema SHALL permitir que o gerente criador do projeto (ou superusuário) submeta o projeto para revisão via `PATCH /projects/:id` com `{ status: 'em_revisao' }`, exibindo a ação apenas quando o projeto está `em_andamento` e desabilitando-a quando existem etapas não `concluida` ou o projeto não possui etapas.

#### Scenario: Submissão habilitada com todas as etapas concluídas
- **WHEN** o projeto está `em_andamento`, possui ao menos uma etapa e todas as etapas têm `status: 'concluida'`
- **THEN** o botão "Enviar para Revisão" fica habilitado para o gerente do projeto

#### Scenario: Submissão bloqueada com etapas pendentes
- **WHEN** o projeto possui ao menos uma etapa com `status` diferente de `concluida`
- **THEN** o botão "Enviar para Revisão" fica desabilitado com uma explicação do motivo

#### Scenario: Conflito de transição
- **WHEN** a API retorna `409` ao tentar submeter para revisão
- **THEN** o sistema exibe um toast com a mensagem retornada e invalida a query do projeto

### Requirement: Revisão de diretoria do projeto
O sistema SHALL permitir que um usuário `diretor` do setor `projetos` (ou superusuário) aprove ou reprove um projeto `em_revisao` via `PATCH /projects/:id/reviews`, exigindo `notes` obrigatório. Aprovação move o projeto para `revisado`; reprovação retorna para `em_andamento`. O sistema SHALL exibir o histórico de rodadas de revisão via `GET /projects/:id/reviews`.

#### Scenario: Aprovação de projeto em revisão
- **WHEN** um diretor de `projetos` aprova um projeto `em_revisao` preenchendo notas
- **THEN** o sistema chama `PATCH /projects/:id/reviews` com `{ approved: true, notes }`, exibe toast de sucesso e invalida projeto e histórico de revisões

#### Scenario: Reprovação de projeto em revisão
- **WHEN** um diretor de `projetos` reprova um projeto `em_revisao` preenchendo notas
- **THEN** o sistema chama `PATCH /projects/:id/reviews` com `{ approved: false, notes }` e o projeto volta a exibir status `em_andamento` após invalidação

#### Scenario: Ação oculta para quem não é diretor de projetos
- **WHEN** um usuário não é `diretor` do setor `projetos` nem superusuário
- **THEN** a ação de revisão de diretoria não é exibida, mesmo se o projeto estiver `em_revisao`

### Requirement: Fechamento do projeto pelo diretor
O sistema SHALL permitir que um diretor de `projetos` (ou superusuário) feche um projeto `revisado` via `PATCH /projects/:id` com `{ status: 'finalizado', closing_notes }`, exigindo `closing_notes` não vazio. Após `finalizado`, o sistema SHALL desabilitar todas as ações de edição/transição no projeto e em suas etapas.

#### Scenario: Fechamento bem-sucedido
- **WHEN** um diretor de `projetos` preenche notas de fechamento para um projeto `revisado` e confirma
- **THEN** o sistema chama `PATCH /projects/:id` com `status: 'finalizado'` e `closing_notes`, exibe toast de sucesso e invalida o projeto

#### Scenario: Notas de fechamento obrigatórias
- **WHEN** o usuário tenta confirmar o fechamento sem preencher `closing_notes`
- **THEN** o botão de confirmação permanece desabilitado

#### Scenario: Projeto finalizado é somente leitura
- **WHEN** um projeto tem `status: 'finalizado'`
- **THEN** o sistema não exibe nenhum botão de criação/edição de etapa, submissão, revisão ou transição de status para esse projeto

### Requirement: Responsividade da página de Projetos
O sistema SHALL renderizar a página de Projetos corretamente em dispositivos com largura mínima de 320px: lista de projetos em coluna única, dialogs com no máximo 90vw, e navegação em abas com scroll horizontal quando necessário.

#### Scenario: Layout mobile
- **WHEN** a viewport é menor que 640px (breakpoint `sm`)
- **THEN** os cards de projeto ocupam largura total, os dialogs de criação/transição usam até 90vw de largura, e os controles de filtro colapsam em um menu compacto
