## ADDED Requirements

### Requirement: Página Almoxarifado independente
O sistema SHALL disponibilizar a página "Almoxarifado" em `/dashboard/almoxarifado`, independente da página Projetos, e SHALL listá-la como item do grupo "Projetos" da navbar, com a mesma visibilidade do item Projetos (setor `projetos` + superusuários), sem restrição adicional de rank. A página SHALL ser organizada nas abas "Materiais", "Meus Empréstimos" e "Todos os Empréstimos", com a aba ativa refletida na URL (`?tab=`).

#### Scenario: Consultor do setor projetos abre a página
- **WHEN** um usuário `consultor` com `sector: 'projetos'` clica em "Almoxarifado" no grupo "Projetos" da navbar
- **THEN** o sistema SHALL abrir `/dashboard/almoxarifado` com a aba "Materiais" selecionada
- **AND** SHALL exibir apenas as abas "Materiais" e "Meus Empréstimos"

#### Scenario: Gestor abre a página
- **WHEN** um usuário com role `gerente`, `diretor`, `assessor` ou `presidente` abre a página "Almoxarifado"
- **THEN** o sistema SHALL exibir também a aba "Todos os Empréstimos", com o número de empréstimos atrasados no rótulo quando houver, e as ações de gestão de materiais

#### Scenario: Consultor tenta abrir a aba de gestão pela URL
- **WHEN** um `consultor` acessa `/dashboard/almoxarifado?tab=todos-emprestimos`
- **THEN** o sistema SHALL exibir a aba "Materiais" e SHALL NOT renderizar a lista de todos os empréstimos

#### Scenario: Página Projetos não é alterada
- **WHEN** qualquer usuário acessa `/dashboard/projects`
- **THEN** as abas existentes SHALL permanecer as mesmas, sem uma aba "Almoxarifado"

### Requirement: Catálogo de materiais
O sistema SHALL listar os materiais de `GET /almoxarifado/material` com nome, descrição, observações e quantidade disponível em estoque, permitindo busca por nome/descrição.

#### Scenario: Material sem estoque
- **WHEN** um material tem `quantidade_estoque` igual a 0
- **THEN** o sistema SHALL exibir um badge "Sem estoque" e SHALL desabilitar a ação de solicitar empréstimo para esse material

#### Scenario: Catálogo vazio
- **WHEN** a API retorna uma lista vazia
- **THEN** o sistema SHALL exibir um estado vazio; para gestores SHALL incluir a ação "Cadastrar material"

### Requirement: Gestão de materiais restrita à gestão
O sistema SHALL permitir criar (`POST /almoxarifado/material`) e editar (`PATCH /almoxarifado/material/{id}`) materiais apenas para usuários com role `gerente`, `diretor`, `assessor` ou `presidente`, espelhando a policy do backend.

#### Scenario: Consultor não vê ações de gestão
- **WHEN** um `consultor` visualiza o catálogo
- **THEN** os botões "Cadastrar material" e "Editar" SHALL NOT ser renderizados

#### Scenario: Gestor cadastra material
- **WHEN** um gestor preenche nome, descrição e quantidade em estoque (inteiro ≥ 0) e confirma
- **THEN** o sistema SHALL enviar `POST /almoxarifado/material`, omitindo `observacoes` quando vazio, e SHALL atualizar o catálogo

#### Scenario: Gestor edita estoque com empréstimos ativos
- **WHEN** um gestor abre a edição de um material que possui empréstimos não devolvidos
- **THEN** o diálogo SHALL informar quantas unidades estão emprestadas no momento
- **AND** ao salvar SHALL enviar apenas os campos alterados via `PATCH`

### Requirement: Solicitar empréstimo
O sistema SHALL permitir que qualquer usuário com acesso à aba solicite um empréstimo via `POST /almoxarifado/emprestimos`, informando material, quantidade, previsão de devolução e observações opcionais. O empréstimo SHALL ser registrado em nome do usuário logado.

#### Scenario: Quantidade limitada ao estoque
- **WHEN** o usuário seleciona um material com 3 unidades disponíveis
- **THEN** o campo quantidade SHALL aceitar apenas inteiros de 1 a 3

#### Scenario: Previsão de devolução no passado
- **WHEN** o usuário informa uma data de devolução anterior a hoje
- **THEN** o formulário SHALL exibir erro de validação e SHALL NOT enviar a requisição

#### Scenario: Prazo máximo de 2 semanas
- **WHEN** o usuário tenta informar uma previsão de devolução posterior a hoje + 14 dias
- **THEN** o calendário SHALL desabilitar essas datas, o formulário SHALL exibir o erro "O prazo máximo de empréstimo é de 2 semanas" e SHALL NOT enviar a requisição
- **AND** o campo SHALL informar a data limite ("Prazo máximo de 2 semanas (até dd/mm/aaaa)")

#### Scenario: Estoque insuficiente no backend
- **WHEN** a API responde 400 "Estoque insuficiente para o empréstimo"
- **THEN** o sistema SHALL exibir a mensagem em um toast e SHALL revalidar o catálogo de materiais

#### Scenario: Empréstimo criado
- **WHEN** a API responde 201
- **THEN** o sistema SHALL revalidar empréstimos e materiais, fazendo o estoque exibido diminuir pela quantidade emprestada

### Requirement: Visibilidade de empréstimos por rank
O sistema SHALL exibir a um `consultor` somente os empréstimos cujo `user_id` é o seu próprio id. Usuários de gestão (`gerente`, `diretor`, `assessor`, `presidente`) SHALL ver todos os empréstimos com o nome do responsável. A filtragem SHALL ser centralizada no repositório/helper de permissões, e nenhum componente destinado a consultores SHALL receber a lista não filtrada.

#### Scenario: Consultor vê apenas os próprios empréstimos
- **WHEN** `GET /almoxarifado/emprestimos` retorna empréstimos de vários usuários e o usuário logado é `consultor`
- **THEN** o sistema SHALL exibir apenas os empréstimos com `user_id` igual ao id do usuário logado
- **AND** a aba "Todos os Empréstimos" SHALL NOT ser renderizada

#### Scenario: Gestor vê todos com nome do responsável
- **WHEN** um gestor abre a aba "Todos os Empréstimos"
- **THEN** o sistema SHALL listar todos os empréstimos, exibindo o nome do material e o nome do responsável (resolvidos no cliente)
- **AND** SHALL permitir filtrar por status `ativo`, `atrasado` e `devolvido`, ordenando atrasados primeiro

#### Scenario: Responsável não encontrado
- **WHEN** o `user_id` de um empréstimo não existe na lista de usuários
- **THEN** o sistema SHALL exibir "Usuário desconhecido" em vez de quebrar a renderização

### Requirement: Status do empréstimo
O sistema SHALL derivar o status de cada empréstimo: `devolvido` quando `devolvido_em` não é nulo; `atrasado` quando não devolvido e `previsao_devolucao` é anterior ao momento atual; caso contrário `ativo`. Cada status SHALL ter um badge visual distinto.

#### Scenario: Empréstimo atrasado
- **WHEN** um empréstimo tem `devolvido_em: null` e `previsao_devolucao` no passado
- **THEN** o sistema SHALL exibir o badge "Atrasado" em destaque destrutivo

### Requirement: Registrar devolução
O sistema SHALL permitir registrar a devolução via `PATCH /almoxarifado/emprestimos/{id}` com observações opcionais. A ação SHALL estar disponível apenas para empréstimos não devolvidos, e somente para o próprio responsável ou para usuários de gestão.

#### Scenario: Consultor devolve o próprio empréstimo
- **WHEN** um `consultor` clica em "Registrar devolução" em um empréstimo seu ainda ativo e confirma
- **THEN** o sistema SHALL enviar o `PATCH`, revalidar empréstimos e materiais e exibir o empréstimo como `devolvido`

#### Scenario: Gestor devolve empréstimo de terceiro
- **WHEN** um gestor registra a devolução de um empréstimo de outro usuário
- **THEN** o sistema SHALL permitir a ação e o estoque do material SHALL aumentar pela quantidade devolvida

#### Scenario: Empréstimo já devolvido
- **WHEN** um empréstimo já possui `devolvido_em`
- **THEN** a ação "Registrar devolução" SHALL NOT ser exibida
- **AND** se a API responder 400 "Empréstimo já foi devolvido" o sistema SHALL exibir a mensagem em toast e revalidar a lista

### Requirement: Estados de carregamento, erro e responsividade
Cada aba SHALL exibir skeletons durante o carregamento, uma mensagem de erro com ação de tentar novamente em falha de rede, e SHALL ser utilizável em telas de celular (cards empilhados em vez de tabela larga, diálogos em tela cheia/sheet).

#### Scenario: Modais no celular
- **WHEN** o usuário abre "Pegar emprestado", "Registrar devolução" ou o formulário de material em uma tela menor que 768px
- **THEN** o conteúdo SHALL abrir como bottom sheet, com as ações fixas no rodapé e alvos de toque de no mínimo 44px

#### Scenario: Prazo em linguagem natural
- **WHEN** um empréstimo não devolvido vence no dia seguinte
- **THEN** o card SHALL exibir "Vence amanhã" junto da data absoluta; se já estiver vencido há 3 dias, SHALL exibir "Atrasado há 3 dias" em destaque

#### Scenario: Usuário com empréstimo atrasado
- **WHEN** o usuário logado possui ao menos um empréstimo próprio atrasado e está fora da aba "Meus Empréstimos"
- **THEN** o sistema SHALL exibir um banner de alerta com atalho para essa aba

#### Scenario: Falha ao carregar empréstimos
- **WHEN** `GET /almoxarifado/emprestimos` falha
- **THEN** o sistema SHALL exibir uma mensagem de erro com botão "Tentar novamente" sem afetar o catálogo de materiais
