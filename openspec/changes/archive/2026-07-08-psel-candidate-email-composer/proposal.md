## Why

Hoje, a única forma de contatar candidatos do processo seletivo pelo dashboard é através de e-mails automáticos disparados por mudanças de status (aprovação, eliminação, avanço de etapa) ou pelo envio de links de agendamento/Meet. Não existe uma forma de enviar uma comunicação avulsa e personalizada (ex: aviso de mudança de data, lembrete, comunicado geral) para um ou mais candidatos direto da aba "Candidatos". A API já expõe `POST /selection-process/send-email` para isso, mas o dashboard não a consome.

## What Changes

- Adicionar uma nova aba "E-mail" na página `/psel` (ao lado de Processos, Candidaturas, Candidatos, Entrevistas, Avaliações), visível apenas para rank ≥ 3, em vez de um modal/sheet acionado a partir da aba "Candidatos" — um compositor completo (seleção + edição + preview) cabe melhor como página própria do que espremido em um overlay, especialmente em mobile.
- A aba "E-mail" contém: (1) um seletor de candidatos com os mesmos filtros de processo/etapa da aba "Candidatos" e checkboxes de seleção múltipla ("selecionar todos os visíveis"/"limpar seleção"); (2) um editor de assunto + corpo em texto livre; (3) uma prévia ao vivo do e-mail renderizado dentro de um frame HTML no estilo visual da marca Watt (mesma linguagem visual dos templates em `wattapi/src/common/email`: card branco centralizado, cantos arredondados, sombra sutil, acento âmbar `#f59e0b`, fonte Arial, rodapé com aviso de e-mail automático).
- Ao enviar, o dashboard monta o HTML final (conteúdo do usuário injetado no frame) e o texto plano correspondente, e chama `POST /selection-process/send-email` com `candidate_ids`, `subject`, `html` e `plain_text`.
- Exibir o resultado do envio (`successes`/`errors`) via toast, com destaque caso haja falhas parciais.
- Layout totalmente responsivo (mobile-first): seletor de candidatos, editor e preview empilhados verticalmente em telas estreitas, com alternância "Editar"/"Prévia" para evitar dois painéis lado a lado competindo por espaço; em telas largas, editor e preview lado a lado abaixo do seletor de candidatos.

## Capabilities

### New Capabilities

- `psel-candidate-email`: nova aba "E-mail" em `/psel` com seleção de candidatos, compositor de e-mail personalizado e envio via `POST /selection-process/send-email`, com preview de frame estilizado e suporte completo a mobile.

### Modified Capabilities

<!-- Nenhuma capability existente muda de comportamento — a aba "Candidatos" e seus cards permanecem inalterados. -->

## Impact

- **Frontend**: `src/features/selection-process/components/psel-view.tsx` (novo item de navegação por aba), novo componente de aba `email-tab.tsx` (seletor de candidatos + editor + preview + envio), possível reaproveitamento (não modificação) de `candidate-card.tsx` em modo de leitura/seleção dentro da nova aba.
- **Repository layer**: `src/repositories/selection-process.repository.ts` — nova mutation `useSendCandidateEmail`; `src/types/selection-process.ts` — novos tipos `SendCandidateEmailPayload`/`SendCandidateEmailResult`.
- **API**: consome `POST /selection-process/send-email` (rank ≥ 3, já existente na WattAPI, nenhuma mudança de backend necessária).
- **Sem novas dependências**: editor implementado com textarea + preview em iframe/HTML sandbox, sem biblioteca de rich-text externa.
