## ADDED Requirements

### Requirement: Submissão de entregáveis pelo consultor atribuído
O sistema SHALL permitir que o consultor atribuído a uma etapa `pendente` submeta seus entregáveis via `POST /projects/:id/stages/:stageId/submissions`, exigindo exatamente um arquivo por item do checklist da etapa. Antes de chamar a API, o sistema SHALL fazer upload de cada arquivo ao bucket Supabase `project-stage-files` com path `stage-files/${consultantId}/${uuid}/${filename}`, reaproveitando o componente `AttachmentUpload` em uma instância por entregável (não um dropzone único multi-arquivo), garantindo que cada arquivo enviado esteja inequivocamente associado ao seu `deliverable_id`.

#### Scenario: Submissão completa bem-sucedida
- **WHEN** o consultor atribuído anexa um arquivo para cada entregável do checklist, opcionalmente preenche notas, e confirma
- **THEN** o sistema faz upload de cada arquivo, chama `POST .../submissions` com `files: [{ deliverable_id, path, name }]` para todos os entregáveis, exibe toast de sucesso e invalida a etapa e suas submissões

#### Scenario: Entregável sem arquivo bloqueia envio
- **WHEN** ao menos um entregável do checklist não possui arquivo anexado
- **THEN** o botão "Enviar Entrega" permanece desabilitado, indicando quais entregáveis estão pendentes de anexo

#### Scenario: Upload em progresso bloqueia envio
- **WHEN** um ou mais arquivos ainda estão em estado `uploading`
- **THEN** o botão "Enviar Entrega" permanece desabilitado

#### Scenario: Falha no upload de um entregável
- **WHEN** o upload do arquivo de um entregável específico falha
- **THEN** o sistema exibe o erro inline apenas naquele slot, sem afetar os demais entregáveis já enviados com sucesso

#### Scenario: Ação restrita ao consultor atribuído
- **WHEN** um usuário diferente do `consultant_id` da etapa acessa a etapa
- **THEN** o formulário de submissão não é exibido para esse usuário

#### Scenario: Reenvio após reprovação destaca apenas os entregáveis marcados para rework
- **WHEN** a etapa retorna a `pendente` após uma revisão com `approved: false` e uma lista de `rework_deliverable_ids`
- **THEN** o sistema pré-marca visualmente os entregáveis que precisam ser reenviados, mas ainda exige arquivo para todos os entregáveis do checklist na nova tentativa (`attempt`), conforme contrato da API

### Requirement: Histórico de submissões de uma etapa
O sistema SHALL exibir as tentativas de submissão de uma etapa via `GET /projects/:id/stages/:stageId/submissions`, ordenadas por `attempt` decrescente, e permitir abrir o detalhe de uma tentativa (`GET .../submissions/:submissionId`) para obter URLs assinadas dos arquivos.

#### Scenario: Lista de tentativas
- **WHEN** uma etapa possui mais de uma tentativa de submissão
- **THEN** o sistema exibe todas as tentativas com número (`attempt`), data e status de revisão, da mais recente para a mais antiga

#### Scenario: Download de arquivo de uma submissão
- **WHEN** o usuário abre o detalhe de uma tentativa de submissão
- **THEN** o sistema busca `GET .../submissions/:submissionId`, exibe a `signed_url` de cada arquivo e permite abri-la em nova aba

### Requirement: Revisão de submissão pelo gerente do projeto
O sistema SHALL permitir que o gerente responsável pelo projeto aprove ou reprove a submissão mais recente de uma etapa `em_revisao` via `POST /projects/:id/stages/:stageId/reviews`. Na aprovação, apenas `notes` opcional é exigido. Na reprovação, o sistema SHALL exigir `notes`, `new_delivery_date` (anterior ao `deadline_date` da etapa) e a seleção de ao menos um entregável (`deliverable_ids`) a ser reenviado.

#### Scenario: Aprovação da submissão
- **WHEN** o gerente aprova a submissão atual de uma etapa `em_revisao`
- **THEN** o sistema chama `POST .../reviews` com `{ approved: true, notes }`, exibe toast de sucesso e invalida a etapa (agora `concluida`) e suas revisões

#### Scenario: Reprovação com rework
- **WHEN** o gerente reprova a submissão selecionando ao menos um entregável, uma nova data de entrega e notas
- **THEN** o sistema chama `POST .../reviews` com `{ approved: false, notes, new_delivery_date, deliverable_ids }`, exibe toast de sucesso e invalida a etapa (agora `pendente`)

#### Scenario: Reprovação sem seleção de entregáveis é bloqueada
- **WHEN** o gerente tenta reprovar sem selecionar nenhum entregável para rework
- **THEN** o botão de confirmação permanece desabilitado

#### Scenario: Submissão já revisada não pode ser revisada novamente
- **WHEN** a API retorna `409` porque a submissão atual já foi revisada
- **THEN** o sistema exibe um toast com a mensagem retornada e invalida a etapa para refletir o estado atual

### Requirement: Feedback pós-fechamento do consultor
O sistema SHALL permitir que um consultor que foi atribuído a alguma etapa de um projeto `finalizado` submeta feedback via `POST /projects/:id/feedback` com um objeto `answers` não vazio, uma única vez por projeto.

#### Scenario: Envio de feedback
- **WHEN** um consultor elegível preenche o formulário de feedback de um projeto `finalizado` e confirma
- **THEN** o sistema chama `POST /projects/:id/feedback`, exibe toast de sucesso e desabilita o formulário para reenvio

#### Scenario: Feedback já enviado
- **WHEN** a API retorna `409` porque o consultor já enviou feedback para este projeto
- **THEN** o sistema exibe uma mensagem indicando que o feedback já foi registrado e oculta o formulário

### Requirement: Visualização de feedback pelo gerente ou diretor
O sistema SHALL exibir a lista de feedback de um projeto via `GET /projects/:id/feedback` apenas para o gerente responsável pelo projeto ou para diretor/superusuário de `projetos`; demais usuários (incluindo consultores que enviaram feedback) SHALL receber a informação de que não têm acesso a essa visão, sem chamar o endpoint.

#### Scenario: Gerente visualiza feedback consolidado
- **WHEN** o gerente do projeto abre a aba de feedback de um projeto `finalizado`
- **THEN** o sistema chama `GET /projects/:id/feedback` e exibe as respostas de cada consultor

#### Scenario: Consultor não visualiza feedback consolidado
- **WHEN** um consultor (mesmo tendo enviado seu próprio feedback) tenta acessar a aba de feedback consolidado
- **THEN** o sistema não exibe a aba/ação, evitando a chamada que resultaria em `403`

### Requirement: Responsividade do fluxo de submissão e revisão
O sistema SHALL renderizar os slots de upload por entregável em coluna única em viewports menores que 640px, com área de toque mínima adequada para anexar/remover arquivos, e os dialogs de revisão ocupando no máximo 90vw.

#### Scenario: Slots de upload em mobile
- **WHEN** a viewport é menor que 640px e a etapa possui múltiplos entregáveis
- **THEN** os slots de upload de cada entregável são empilhados verticalmente, cada um com rótulo do entregável visível acima do dropzone
