## ADDED Requirements

### Requirement: Listagem de etapas de um projeto
O sistema SHALL exibir as etapas de um projeto obtidas via `GET /projects/:id/stages`, ordenadas por `position`, cada uma mostrando nome, status (`pendente`/`em_revisao`/`concluida`), consultor responsável, datas de entrega/prazo e progresso do checklist de entregáveis. O sistema SHALL suportar filtro por `consultant_id` e `status`.

#### Scenario: Etapas exibidas em ordem de posição
- **WHEN** um usuário abre o detalhe de um projeto
- **THEN** o sistema exibe as etapas ordenadas por `position` ascendente, cada uma com seu status e consultor

#### Scenario: Detalhe expandido de uma etapa
- **WHEN** o usuário toca/clica em um card de etapa colapsado
- **THEN** o sistema expande o card exibindo o checklist completo de entregáveis (`deliverables`) daquela etapa

### Requirement: Criação de etapa com checklist de entregáveis
O sistema SHALL permitir que o gerente responsável pelo projeto (ou superusuário) crie uma etapa em um projeto `em_andamento` via `POST /projects/:id/stages`, informando nome, descrição, data de entrega, prazo, posição, consultor responsável e uma lista de um ou mais entregáveis (`name` + `description` cada). O sistema SHALL validar no client que `delivery_date` é anterior a `deadline_date`, que `delivery_date` não é posterior à `delivery_date` do projeto, e que existe ao menos um entregável antes de habilitar a submissão.

#### Scenario: Criação bem-sucedida
- **WHEN** o gerente preenche nome, datas válidas, consultor e ao menos um entregável e confirma
- **THEN** o sistema chama `POST /projects/:id/stages`, exibe toast de sucesso, fecha o formulário e invalida a lista de etapas do projeto

#### Scenario: Adição e remoção de itens do checklist
- **WHEN** o usuário clica em "Adicionar entregável" ou remove um item existente no formulário
- **THEN** o sistema atualiza a lista de entregáveis do formulário sem perder os valores já preenchidos nos demais itens

#### Scenario: Checklist vazio bloqueia submissão
- **WHEN** o formulário não possui nenhum entregável preenchido
- **THEN** o botão de submissão permanece desabilitado

#### Scenario: Data de entrega inválida
- **WHEN** a data de entrega informada é igual ou posterior ao prazo (`deadline_date`), ou posterior à data de entrega do projeto
- **THEN** o sistema exibe um erro inline no campo de data e não submete o formulário

#### Scenario: Ação de criação indisponível fora de `em_andamento`
- **WHEN** o projeto não está com `status: 'em_andamento'`
- **THEN** o botão "Nova Etapa" não é exibido

### Requirement: Edição de campos escalares de uma etapa pendente
O sistema SHALL permitir que o gerente responsável pelo projeto edite nome, descrição, datas, posição e consultor de uma etapa `pendente` via `PUT /projects/:id/stages/:stageId` (payload parcial), sem alterar o checklist de entregáveis nesta ação.

#### Scenario: Edição bem-sucedida
- **WHEN** o gerente altera o consultor responsável de uma etapa `pendente` e confirma
- **THEN** o sistema chama `PATCH /projects/:id/stages/:stageId`, exibe toast de sucesso e invalida a etapa e a lista de etapas

#### Scenario: Edição bloqueada fora de `pendente`
- **WHEN** a etapa está `em_revisao` ou `concluida`
- **THEN** a ação de editar campos escalares não é exibida para essa etapa

### Requirement: Fila "Minhas Etapas" do consultor
O sistema SHALL exibir, para o usuário autenticado, uma fila com as etapas em que ele é `consultant_id`, obtida via `GET /projects/:id/stages?consultant_id=<meuId>` agregado entre os projetos visíveis, priorizando etapas `pendente` (aguardando submissão) e `em_revisao` (rejeitadas aguardando reenvio) no topo.

#### Scenario: Consultor visualiza suas etapas atribuídas
- **WHEN** um consultor com etapas atribuídas acessa a aba "Minhas Etapas"
- **THEN** o sistema exibe as etapas atribuídas a ele, com nome do projeto, prazo e status

#### Scenario: Nenhuma etapa atribuída
- **WHEN** o consultor autenticado não possui nenhuma etapa atribuída
- **THEN** o sistema exibe um estado vazio informativo

### Requirement: Responsividade das etapas do projeto
O sistema SHALL colapsar cards de etapa para uma linha compacta (nome + chip de status) em viewports menores que 640px, expandindo para o checklist completo apenas sob interação do usuário, para evitar poluição visual em telas pequenas.

#### Scenario: Colapso em mobile
- **WHEN** a viewport é menor que 640px e um projeto tem 3 ou mais etapas
- **THEN** todos os cards de etapa iniciam colapsados, exibindo apenas nome e status até serem tocados
