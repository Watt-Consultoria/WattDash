## 1. Types & repository layer

- [x] 1.1 Em `src/types/selection-process.ts`, adicionar `SendCandidateEmailPayload` (`{ candidate_ids: string[]; subject: string; html: string; plain_text: string }`) e `SendCandidateEmailResult` (`{ successes: number; errors: number }`)
- [x] 1.2 Em `src/repositories/selection-process.repository.ts`, adicionar função `sendCandidateEmail(token, payload)` chamando `apiPost('/selection-process/send-email', token, payload)`
- [x] 1.3 Adicionar hook `useSendCandidateEmail()` (mutation, sem necessidade de invalidar cache de candidatos) e exportar em `SelectionProcessRepository`

## 2. Frame de e-mail (lib)

- [x] 2.1 Criar `src/features/selection-process/lib/build-candidate-email.ts` com função `buildCandidateEmailHtml({ subject, bodyText }: { subject: string; bodyText: string }): string` que: escapa HTML do `bodyText`, converte blocos separados por linha em branco em parágrafos `<p>`, e envolve tudo no frame de marca (mesma estrutura visual de `wattapi/src/common/email/ApplicationConfirmationEmail.ts`: container 600px, `border-radius: 8px`, sombra sutil, título com `subject`, acento âmbar `#f59e0b`, rodapé "Este é um email da Watt Consultoria")
- [x] 2.2 Adicionar função irmã `buildCandidateEmailPlainText({ subject, bodyText })` retornando o texto puro (sem HTML) equivalente, seguindo o padrão `join('\n')` dos templates existentes
- [x] 2.3 Adicionar util local de escape (`escapeHtml`) reutilizável pela função do item 2.1

## 3. `CandidateCard` — modo de seleção opcional (sem alterar a aba Candidatos)

- [x] 3.1 Em `candidate-card.tsx`, adicionar props opcionais `selectable?`, `selected?`, `onToggleSelect?` — quando `selectable` é `true`, renderizar checkbox no canto do card (implementado como `<button role="checkbox">` nativo, acessível por teclado, em vez do componente `Checkbox` do shadcn, para evitar aninhar botão dentro de botão e manter compatibilidade com o lint de acessibilidade do projeto); `onToggleSelect` chama `e.stopPropagation()` para não disparar `onOpen`
- [x] 3.2 Confirmar que `candidates-tab.tsx` continua chamando `CandidateCard` sem essas props (comportamento 100% inalterado) — não foi necessário editar esse arquivo

## 4. Nova aba "E-mail" — estrutura e navegação

- [x] 4.1 Criar `src/features/selection-process/components/email-tab.tsx`
- [x] 4.2 Em `psel-view.tsx`, adicionar `<TabsTrigger value='email'>E-mail</TabsTrigger>` e `<TabsContent value='email'><EmailTab /></TabsContent>`, renderizados condicionalmente apenas quando `rank >= 3` (via `useUserProfile()`, mesmo padrão de `CandidatesTab`), com fallback interno no `EmailTab` (retorna `null` se `rank < 3`)

## 5. `EmailTab` — seleção de candidatos

- [x] 5.1 Estado local: `selectedProcessId`, `selectedStageId` (mesmos filtros de `candidates-tab.tsx`) e `selectedIds: Set<string>`
- [x] 5.2 Reaproveitar `SelectionProcessRepository.useProcesses`, `useStages`, `useCandidates` (mesma lógica de filtro de `candidates-tab.tsx`, duplicada localmente — sem extrair hook compartilhado nesta mudança; `useAllStages` não foi necessário pois a aba "E-mail" não exibe nome de etapa nos cards)
- [x] 5.3 Renderizar lista/grid de candidatos usando `CandidateCard` com `selectable`, `selected`, `onToggleSelect`
- [x] 5.4 Handlers `selectAllVisible()` e `clearSelection()`; ao trocar filtro, `useEffect` remove de `selectedIds` os candidatos que saíram da lista filtrada (Requirement: "Alternar filtro ajusta a seleção")
- [x] 5.5 Estado vazio quando não há candidatos para o filtro selecionado, com envio desabilitado (naturalmente, via `selectedIds.size === 0`)

## 6. `EmailTab` — editor e preview

- [x] 6.1 Estado local `subject`, `bodyText`
- [x] 6.2 Layout responsivo: seletor de candidatos no topo (largura total); abaixo, `Tabs` "Editar"/"Prévia" abaixo do breakpoint `sm` (via `forceMount` + classes `hidden sm:block`), grid `sm:grid-cols-2` (editor à esquerda, prévia à direita) a partir de `sm`
- [x] 6.3 Painel de edição: input de assunto + `Textarea` de corpo (texto de ajuda indicando que o conteúdo é tratado como texto simples e formatado automaticamente em parágrafos)
- [x] 6.4 Painel de prévia: `iframe` com `srcDoc={buildCandidateEmailHtml({ subject, bodyText })}` e atributo `sandbox=""` (sem scripts), altura fixa de 420px, borda arredondada para simular o "frame" do e-mail

## 7. `EmailTab` — envio

- [x] 7.1 Barra de ação (sticky no rodapé em mobile via `sticky bottom-0`, inline em desktop) com contagem de selecionados e botão "Enviar e-mail (N)", desabilitado quando `selectedIds.size === 0`, `subject` vazio ou `bodyText` vazio
- [x] 7.2 Ao clicar "Enviar e-mail", abre `AlertDialog` de confirmação mostrando a quantidade de destinatários antes de disparar a mutation
- [x] 7.3 Ao confirmar: chama `useSendCandidateEmail().mutate({ candidate_ids: [...selectedIds], subject, html: buildCandidateEmailHtml(...), plain_text: buildCandidateEmailPlainText(...) })`
- [x] 7.4 `onSuccess`: se `errors === 0`, toast de sucesso com `successes` e `clearSelection()`; se `errors > 0`, toast de alerta com contagem de falhas, mantendo seleção e conteúdo intactos para nova tentativa
- [x] 7.5 `onError` (ex: `404` de candidato inexistente): `toast.error(toUserMessage(err))`, sem limpar seleção/conteúdo

## 8. Ícones e acessibilidade

- [x] 8.1 Adicionar ícone de e-mail (`IconMail` de `@tabler/icons-react`, mapeado como `Icons.mail`) em `src/components/icons.tsx`, usado no `TabsTrigger` "E-mail" e no botão de envio
- [x] 8.2 Alvos de toque: checkbox do card em `size-11` (44px), botões da barra de ações e do compositor em `h-8`/`h-11`/padrão do `Button`; assunto e corpo do e-mail em `h-11`/`min-h-64`
- [x] 8.3 `aria-label` nas checkboxes de seleção (`Selecionar {nome do candidato}`)

## 9. Validação manual

- [ ] 9.1 Testar seleção individual, "selecionar todos" e "limpar seleção" com e sem filtro de processo/etapa aplicado
- [ ] 9.2 Testar envio bem-sucedido (toast de sucesso, seleção limpa, conteúdo do editor permanece ou é limpo conforme decisão de UX final)
- [ ] 9.3 Testar cenário de erro (simular candidato removido / rede offline) e confirmar toast de erro sem crash
- [ ] 9.4 Testar responsividade em viewport mobile (≤ 480px): sem overflow horizontal, tabs Editar/Prévia funcionando, botão de envio acessível sem rolagem extra
- [ ] 9.5 Conferir que o preview do e-mail malha visualmente com os templates reais do backend (comparação lado a lado com um e-mail existente, ex: `applicationConfirmationEmail`)
- [ ] 9.6 Confirmar que rank < 3 não vê a aba "E-mail" e que a aba "Candidatos" permanece 100% inalterada (sem checkboxes, sem regressões visuais)
