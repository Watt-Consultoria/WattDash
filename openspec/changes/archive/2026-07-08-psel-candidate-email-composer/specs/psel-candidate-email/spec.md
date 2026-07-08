## ADDED Requirements

### Requirement: Aba "E-mail" na página de Processo Seletivo
O sistema SHALL exibir uma aba "E-mail" na página `/psel`, ao lado das abas Processos, Candidaturas, Candidatos, Entrevistas e Avaliações, visível apenas para usuários com rank ≥ 3, contendo um compositor completo de e-mail personalizado para candidatos.

#### Scenario: Aba oculta para rank < 3
- **WHEN** um usuário com rank < 3 acessa a página `/psel`
- **THEN** a aba "E-mail" NÃO é exibida na lista de abas

#### Scenario: Aba visível para rank ≥ 3
- **WHEN** um usuário com rank ≥ 3 acessa a página `/psel`
- **THEN** a aba "E-mail" é exibida e, ao ser selecionada, exibe o seletor de candidatos, o editor e a prévia do e-mail

#### Scenario: Navegação não interfere na aba Candidatos
- **WHEN** o usuário alterna entre a aba "E-mail" e a aba "Candidatos"
- **THEN** o estado de seleção/filtro de uma aba não afeta o comportamento da outra (são independentes)

### Requirement: Seleção de candidatos na aba "E-mail"
A aba "E-mail" SHALL permitir que o usuário selecione múltiplos candidatos como destinatários, usando os mesmos filtros de processo e etapa disponíveis na aba "Candidatos", através de checkboxes por candidato, exibidos em cartões simplificados (sem foto).

#### Scenario: Cartão de destinatário simplificado
- **WHEN** a lista de candidatos é exibida na aba "E-mail"
- **THEN** cada cartão exibe apenas checkbox, nome, curso, período e etapa atual do candidato, sem exibir a foto (diferente dos cartões da aba "Candidatos")

#### Scenario: Selecionar candidatos individualmente
- **WHEN** o usuário marca a checkbox de um ou mais candidatos na lista da aba "E-mail"
- **THEN** cada candidato marcado é adicionado ao conjunto de destinatários e a contagem de selecionados é atualizada

#### Scenario: Selecionar todos os candidatos visíveis
- **WHEN** o usuário aciona "Selecionar todos" com um filtro de processo/etapa aplicado
- **THEN** todos os candidatos atualmente exibidos na lista (respeitando o filtro) são selecionados

#### Scenario: Limpar seleção
- **WHEN** o usuário aciona "Limpar seleção" ou o envio é concluído com sucesso
- **THEN** o conjunto de selecionados é esvaziado

#### Scenario: Alternar filtro ajusta a seleção
- **WHEN** o usuário troca o filtro de processo ou etapa enquanto há candidatos selecionados que não pertencem mais ao filtro resultante
- **THEN** a seleção é ajustada para conter apenas candidatos ainda visíveis no novo filtro

#### Scenario: Nenhum candidato disponível
- **WHEN** não há candidatos para o filtro selecionado na aba "E-mail"
- **THEN** um estado vazio é exibido e o compositor permanece com o envio desabilitado (nenhum destinatário)

### Requirement: Compositor de e-mail personalizado
A aba "E-mail" SHALL permitir compor um e-mail (assunto + corpo em texto livre) e enviá-lo aos candidatos selecionados através de `POST /selection-process/send-email`.

#### Scenario: Campos obrigatórios do compositor
- **WHEN** a aba "E-mail" está aberta
- **THEN** ela exibe um campo de assunto e um campo de corpo (texto livre), ambos obrigatórios para habilitar o envio

#### Scenario: Envio desabilitado sem destinatários ou conteúdo
- **WHEN** não há candidatos selecionados, ou o assunto está vazio, ou o corpo está vazio
- **THEN** o botão de enviar permanece desabilitado

#### Scenario: Confirmação antes do envio em massa
- **WHEN** o usuário clica em "Enviar e-mail" com destinatários, assunto e corpo preenchidos
- **THEN** um diálogo de confirmação é exibido informando a quantidade de candidatos que receberão o e-mail antes do envio efetivo

#### Scenario: Envio bem-sucedido
- **WHEN** o usuário confirma o envio e a API retorna `{ successes: N, errors: 0 }`
- **THEN** um toast de sucesso é exibido informando que N e-mails foram enviados, e a seleção de candidatos é limpa

#### Scenario: Envio com falhas parciais
- **WHEN** a API retorna `{ successes: N, errors: M }` com `M > 0`
- **THEN** um toast de alerta é exibido informando quantos envios falharam, sem apagar a seleção nem o conteúdo, permitindo nova tentativa

#### Scenario: Erro de candidato inexistente
- **WHEN** a API retorna `404` porque algum `candidate_id` selecionado não existe mais
- **THEN** um toast de erro amigável é exibido e nenhum e-mail é enviado (conforme comportamento da API, que valida todos os IDs antes de enviar)

### Requirement: Frame visual consistente com a identidade Watt
O corpo do e-mail enviado SHALL ser renderizado dentro de um frame HTML com a mesma identidade visual dos templates transacionais existentes (`wattapi/src/common/email`): container centralizado de até 600px, cantos arredondados, sombra sutil, tipografia Arial, cor de destaque âmbar, e rodapé indicando que é uma comunicação da Watt Consultoria.

#### Scenario: HTML final usa o frame de marca
- **WHEN** o usuário digita um assunto e um corpo de texto no compositor
- **THEN** o `html` enviado à API envolve o conteúdo digitado no frame de marca padrão (container branco, cantos arredondados, acento âmbar, rodapé)

#### Scenario: Texto plano gerado a partir do conteúdo do usuário
- **WHEN** o e-mail é enviado
- **THEN** o campo `plain_text` enviado à API corresponde ao texto puro digitado pelo usuário, sem marcação HTML

#### Scenario: Tags HTML no corpo são renderizadas
- **WHEN** o corpo do e-mail contém tags HTML (ex: `<b>`, `<a href="">`, `<br>`)
- **THEN** essas tags SHALL ser preservadas sem escapar no HTML final e renderizadas como marcação pelo cliente de e-mail (o assunto continua sendo escapado)

#### Scenario: Quebras de parágrafo automáticas
- **WHEN** o usuário separa o corpo do e-mail em blocos com linha em branco entre eles
- **THEN** cada bloco vira um parágrafo (`<p>`) distinto no HTML final, preservando a formatação de leitura

### Requirement: Preview ao vivo do e-mail
A aba "E-mail" SHALL exibir uma prévia visual do e-mail (assunto + corpo dentro do frame de marca) atualizada em tempo real conforme o usuário edita o conteúdo.

#### Scenario: Preview reflete o conteúdo digitado
- **WHEN** o usuário digita ou edita o assunto ou o corpo do e-mail
- **THEN** a área de prévia é atualizada para refletir o HTML final que seria enviado

#### Scenario: Preview isolado do restante da interface
- **WHEN** a prévia é renderizada
- **THEN** os estilos inline do e-mail SHALL ficar isolados (não vazam para o restante do dashboard) e nenhum script embutido é executado

### Requirement: Layout responsivo da aba "E-mail"
A aba "E-mail" SHALL ser totalmente utilizável em telas de smartphone, sem overflow horizontal, com alvos de toque de no mínimo 44px e alternância clara entre edição e prévia.

#### Scenario: Layout em tela larga
- **WHEN** a aba "E-mail" é exibida em uma viewport ≥ breakpoint `sm` (640px)
- **THEN** o editor de texto e a prévia são exibidos lado a lado, abaixo do seletor de candidatos

#### Scenario: Layout em tela estreita
- **WHEN** a aba "E-mail" é exibida em uma viewport < 640px
- **THEN** o seletor de candidatos, o editor e a prévia são exibidos empilhados verticalmente, com editor e prévia alternáveis por abas internas ("Editar" / "Prévia"), cada uma ocupando a largura total sem scroll horizontal

#### Scenario: Ação de envio sempre acessível em mobile
- **WHEN** a aba "E-mail" é exibida em um dispositivo móvel com candidatos selecionados
- **THEN** o botão "Enviar e-mail" permanece acessível (barra fixa) sem exigir rolagem até o topo da aba
