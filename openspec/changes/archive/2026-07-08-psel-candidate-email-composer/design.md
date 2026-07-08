## Context

A página `/psel` (`src/features/selection-process/components/psel-view.tsx`) organiza suas seções em abas (`Tabs` do shadcn): Processos, Candidaturas, Candidatos, Entrevistas, Avaliações. A aba "Candidatos" (`candidates-tab.tsx` + `candidate-card.tsx`) já lista candidatos em grid de cards com ações individuais (Avançar/Eliminar) restritas a rank ≥ 3 — este componente **não será modificado**; o novo fluxo de e-mail vive em sua própria aba, evitando sobrecarregar a tela de gestão do funil com um modo de seleção paralelo.

A API `POST /selection-process/send-email` (rank ≥ 3) já existe e aceita `candidate_ids[]`, `subject`, `html`, `plain_text`, retornando `{ successes, errors }`. Os templates de e-mail do backend (`wattapi/src/common/email/*.ts`) seguem um padrão visual consistente: card branco 600px centralizado, `border-radius: 8px`, sombra leve, fonte Arial, título em `#1a1a1a`, texto em `#333`/`#444`, callouts em `#fffbeb`/`#f59e0b` (âmbar, cor da marca Watt), rodapé cinza claro com aviso de "e-mail automático" separado por borda superior.

Uma primeira proposta usava um botão na aba "Candidatos" que abria um sheet/dialog com o compositor. Essa abordagem foi descartada: seleção de candidatos + editor + preview lado a lado não cabem confortavelmente em um overlay, especialmente em mobile, onde um sheet full-screen sobre outro contexto de tela (a própria aba Candidatos) cria uma navegação em camadas desnecessária. Uma aba própria dá ao fluxo o espaço de uma página inteira e mantém a navegação plana (mesmo nível das demais abas de `/psel`).

Este projeto usa o padrão "repository" (`src/repositories/<feature>.repository.ts` + `src/types/<feature>.ts`) para toda a camada de dados do processo seletivo — não o padrão `api/service.ts`+`api/queries.ts` mencionado em CLAUDE.md, que é aspiracional/genérico do template base. A implementação deve seguir o padrão já em uso no diretório `selection-process`.

Não há biblioteca de rich-text no projeto (sem Tiptap/Slate/etc.), e a API espera HTML pronto — o dashboard é responsável por montar o HTML final.

## Goals / Non-Goals

**Goals:**
- Nova aba "E-mail" em `/psel`, isolada da aba "Candidatos" (que permanece sem alterações), com seleção múltipla de candidatos própria.
- Compositor de e-mail simples (assunto + corpo em texto), com preview ao vivo do e-mail já dentro do frame visual da marca.
- Envio via `POST /selection-process/send-email`, com feedback claro de sucesso/erro parcial.
- Experiência mobile-first: seções empilhadas verticalmente, alternância editar/preview sem exigir scroll horizontal, alvos de toque ≥ 44px.

**Non-Goals:**
- Não implementar um editor WYSIWYG rico (negrito, listas, imagens arbitrárias) — apenas texto livre com quebras de parágrafo automáticas, mantendo consistência com os templates existentes que também são majoritariamente texto simples com poucos elementos de destaque.
- Não implementar templates salvos/reutilizáveis nem histórico de e-mails enviados — fora do escopo desta mudança.
- Não alterar a API (`wattapi`) — o endpoint já existe e atende ao caso de uso.

## Decisions

**1. Nova aba de nível superior "E-mail" em `psel-view.tsx`, não um botão + sheet a partir de "Candidatos".**
`PselView` já usa `Tabs`/`TabsList`/`TabsContent` para organizar seções irmãs (Processos, Candidaturas, Candidatos, Entrevistas, Avaliações); adicionar `email-tab.tsx` como mais um `TabsTrigger`/`TabsContent` é consistente com o padrão existente e dá ao fluxo (seleção + editor + preview) o espaço de uma página inteira, sem competir por área de tela com um overlay. Alternativa descartada: sheet/dialog acionado da aba "Candidatos" — rejeitada por ser apertado demais em mobile para três blocos de conteúdo (seleção, editor, preview) e por acoplar duas responsabilidades (gestão do funil e envio de comunicações) na mesma tela.

**2. Seletor de candidatos própio da aba "E-mail", reaproveitando `CandidateCard` em modo de seleção — sem alterar `candidates-tab.tsx`.**
`CandidateCard` ganha uma prop opcional `selectable`/`selected`/`onToggleSelect` (tudo opcional, sem efeito quando omitido), permitindo reuso dentro de `email-tab.tsx` sem tocar no comportamento nem no spec da aba "Candidatos". Os mesmos filtros de processo/etapa de `candidates-tab.tsx` são replicados localmente na nova aba (mesmo hook `useCandidates`), já que são independentes por natureza (o usuário pode estar filtrando o funil em uma aba e compondo um e-mail para outro grupo na outra).

**3. Editor: textarea de texto simples → parágrafos, não HTML bruto.**
O usuário digita texto puro; cada linha em branco vira uma quebra de parágrafo (`<p>`) no HTML final, replicando a lógica editorial dos templates existentes (`join('\n')` para o `text`, `<p style="margin: 0 0 16px;">` para o `html`). Evita expor o usuário a HTML/XSS por injeção de tags arbitrárias e mantém o resultado visualmente consistente com os demais e-mails da Watt. Alternativa descartada: permitir HTML bruto no textarea — rejeitada por risco de quebra visual e de segurança (o backend não sanitiza `html` antes de enviar).

**4. Frame de e-mail: função pura `buildCandidateEmailHtml({ subject, bodyText })` reaproveitando o layout dos templates do backend.**
Uma função utilitária no frontend (`src/features/selection-process/lib/build-candidate-email.ts`) gera o HTML final combinando o frame fixo (estrutura idêntica à usada em `ApplicationConfirmationEmail.ts`/`InterviewBookingLinkEmail.ts`: container 600px, `border-radius: 8px`, sombra, acento `#f59e0b`, rodapé com aviso de e-mail automático) com o conteúdo do usuário escapado (`escapeHtml`) e convertido em parágrafos. O `plain_text` é o texto puro do usuário. Isso evita duplicar lógica de template no backend e mantém o preview 1:1 com o que será enviado.

**5. Preview renderizado em `iframe srcDoc` (sandboxed), não `dangerouslySetInnerHTML` direto na árvore React.**
Evita que os estilos inline do e-mail (`font-family`, resets) vazem para o resto do dashboard e evita colisão de CSS. `iframe` com `sandbox` (sem `allow-scripts`) é seguro mesmo que o usuário digite algo inesperado, pois o conteúdo é só HTML estático gerado por nós (sem scripts).

**6. Seleção múltipla: estado local no `EmailTab` (`Set<string>` de IDs), não Zustand global.**
Escopo do estado é local à aba/sessão de visualização — não precisa persistir nem ser compartilhado entre componentes distantes. Segue o padrão já usado no diretório (state local com `useState`/`useMemo`).

**7. Layout da aba: seletor de candidatos no topo (largura total), editor + preview abaixo em `grid sm:grid-cols-2` a partir do breakpoint `sm`, alternância via `Tabs` "Editar"/"Prévia" abaixo dele.**
Como a aba já ocupa a página inteira (sem restrição de overlay), o seletor de candidatos pode ficar em uma faixa colapsável no topo (mostrando contagem de selecionados) e o par editor/preview abaixo se beneficia da largura total em desktop. Em mobile, uma única coluna com tabs evita overflow horizontal e scroll simultâneo de dois painéis. Barra de ação de envio ("Enviar e-mail (N)") fica sticky no rodapé da aba em mobile para permanecer alcançável por toque sem exigir voltar ao topo.

## Risks / Trade-offs

- [Risco] Usuário cola texto com HTML/caracteres especiais esperando que "funcione como HTML" → Mitigação: o texto é sempre escapado (`escapeHtml`) antes de virar parágrafos; o preview deixa isso explícito em tempo real, e um texto de ajuda no editor informa que o conteúdo é tratado como texto simples.
- [Risco] Envio em massa para muitos candidatos sem confirmação → Mitigação: `AlertDialog` de confirmação antes do envio mostrando quantidade de destinatários; botão de envio desabilitado durante `isPending`.
- [Risco] `404` da API quando algum `candidate_id` selecionado não existe mais (ex: removido entre a seleção e o envio) → Mitigação: tratar erro via `toUserMessage`/toast existente, sem crash; usuário pode tentar novamente após atualizar a lista.
- [Trade-off] Preview via `iframe srcDoc` tem custo de re-render leve a cada tecla — aceitável dado o volume de texto de um e-mail (não é um editor de documentos grandes); pode-se debasear se necessário no futuro.

## Migration Plan

Mudança aditiva, sem migração de dados. Deploy padrão do dashboard (Next.js) após merge; nenhuma mudança de backend necessária. Rollback trivial: reverter o commit/PR do dashboard, já que nenhum estado persistido é criado.

## Open Questions

Nenhuma pendência bloqueante identificada; assunções documentadas nas Decisions acima.
