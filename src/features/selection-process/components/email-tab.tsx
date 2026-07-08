'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { toUserMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  buildCandidateEmailHtml,
  buildCandidateEmailPlainText
} from '../lib/build-candidate-email';
import type { Candidate } from '@/types/selection-process';

interface EmailRecipientCardProps {
  candidate: Candidate;
  stageName?: string;
  selected: boolean;
  onToggle: () => void;
}

function EmailRecipientCard({ candidate, stageName, selected, onToggle }: EmailRecipientCardProps) {
  return (
    <button
      type='button'
      role='checkbox'
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        'flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors hover:border-primary/40',
        selected && 'border-primary bg-primary/5 ring-1 ring-primary/30'
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-lg border shadow-xs transition-colors',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
        )}
      >
        {selected && <Icons.check className='size-3' />}
      </span>
      <div className='min-w-0'>
        <p className='truncate text-sm font-medium leading-tight'>{candidate.name}</p>
        <p className='truncate text-xs text-muted-foreground mt-0.5'>
          {candidate.course} · {candidate.period}º período
        </p>
        {stageName && <p className='truncate text-xs text-muted-foreground mt-0.5'>{stageName}</p>}
      </div>
    </button>
  );
}

export function EmailTab() {
  const { rank } = useUserProfile();
  const canSendEmail = rank >= 3;

  const [selectedProcessId, setSelectedProcessId] = useState<string | undefined>(undefined);
  const [selectedStageId, setSelectedStageId] = useState<string | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: processes } = SelectionProcessRepository.useProcesses();
  const { data: filterStages } = SelectionProcessRepository.useStages(selectedProcessId ?? '');
  const { data: allStages } = SelectionProcessRepository.useAllStages();
  const { data: candidates, isLoading } = SelectionProcessRepository.useCandidates(
    selectedProcessId,
    selectedStageId
  );
  const sendMutation = SelectionProcessRepository.useSendCandidateEmail();

  const sortedFilterStages = (filterStages ?? []).toSorted((a, b) => a.position - b.position);

  const stageNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const stage of allStages ?? []) map.set(stage.id, stage.name);
    return map;
  }, [allStages]);

  // Keep the selection in sync with whatever the current filter shows
  useEffect(() => {
    if (!candidates) return;
    const visibleIds = new Set(candidates.map((c) => c.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [candidates]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set((candidates ?? []).map((c) => c.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleProcessChange(value: string) {
    setSelectedProcessId(value === '__all__' ? undefined : value);
    setSelectedStageId(undefined);
  }

  const html = useMemo(() => buildCandidateEmailHtml({ subject, bodyText }), [subject, bodyText]);

  const canSend = selectedIds.size > 0 && subject.trim().length > 0 && bodyText.trim().length > 0;

  function handleSend() {
    sendMutation.mutate(
      {
        candidate_ids: [...selectedIds],
        subject: subject.trim(),
        html,
        plain_text: buildCandidateEmailPlainText({ subject, bodyText })
      },
      {
        onSuccess: (result) => {
          setConfirmOpen(false);
          if (result.errors === 0) {
            toast.success(
              `${result.successes} e-mail${result.successes !== 1 ? 's' : ''} enviado${
                result.successes !== 1 ? 's' : ''
              } com sucesso!`
            );
            clearSelection();
          } else {
            toast.warning(
              `${result.successes} enviado(s), ${result.errors} falharam. Você pode tentar novamente.`
            );
          }
        },
        onError: (err) => {
          setConfirmOpen(false);
          toast.error(toUserMessage(err));
        }
      }
    );
  }

  if (!canSendEmail) return null;

  return (
    <div className='space-y-4 pb-20 sm:pb-4'>
      {/* Candidate selector */}
      <div className='space-y-3 rounded-xl border p-3 sm:p-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-sm font-semibold'>Destinatários</h3>
          <p className='text-xs text-muted-foreground'>
            {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Select value={selectedProcessId ?? '__all__'} onValueChange={handleProcessChange}>
            <SelectTrigger className='h-8 w-auto min-w-48 text-sm'>
              <SelectValue placeholder='Todos os processos' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='__all__'>Todos os processos</SelectItem>
              {(processes ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedStageId ?? '__all__'}
            onValueChange={(v) => setSelectedStageId(v === '__all__' ? undefined : v)}
            disabled={!selectedProcessId}
          >
            <SelectTrigger className='h-8 w-auto min-w-40 text-sm'>
              <SelectValue placeholder='Todas as etapas' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='__all__'>Todas as etapas</SelectItem>
              {sortedFilterStages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  Etapa {s.position} — {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className='ml-auto flex gap-2'>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='h-8 text-xs'
              disabled={!candidates || candidates.length === 0}
              onClick={selectAllVisible}
            >
              Selecionar todos
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='h-8 text-xs'
              disabled={selectedIds.size === 0}
              onClick={clearSelection}
            >
              Limpar seleção
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className='grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className='h-16 w-full rounded-lg' />
            ))}
          </div>
        ) : !candidates || candidates.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center'>
            <Icons.usersGroup className='size-5 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>
              Nenhum candidato disponível para o filtro selecionado.
            </p>
          </div>
        ) : (
          <div className='max-h-[420px] overflow-y-auto rounded-lg'>
            <div className='grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-0.5'>
              {candidates.map((c) => (
                <EmailRecipientCard
                  key={c.id}
                  candidate={c}
                  stageName={c.current_stage_id ? stageNameById.get(c.current_stage_id) : undefined}
                  selected={selectedIds.has(c.id)}
                  onToggle={() => toggleSelect(c.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <Tabs value={mobileView} onValueChange={(v) => setMobileView(v as 'edit' | 'preview')}>
        <TabsList className='sm:hidden'>
          <TabsTrigger value='edit'>Editar</TabsTrigger>
          <TabsTrigger value='preview'>Prévia</TabsTrigger>
        </TabsList>

        <div className='grid gap-4 sm:grid-cols-2'>
          <TabsContent
            value='edit'
            forceMount
            className={cn(mobileView !== 'edit' && 'hidden sm:block')}
          >
            <div className='space-y-3 rounded-xl border p-3 sm:p-4'>
              <div className='space-y-1.5'>
                <Label htmlFor='email-subject'>Assunto</Label>
                <Input
                  id='email-subject'
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder='Ex: Atualização do processo seletivo'
                  className='h-11'
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='email-body'>Mensagem</Label>
                <Textarea
                  id='email-body'
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder='Escreva sua mensagem aqui. Separe parágrafos com uma linha em branco. Tags HTML são permitidas, ex: <b>negrito</b>, <a href="https://exemplo.com">link</a>.'
                  className='min-h-64 font-mono text-sm'
                />
                <p className='text-xs text-muted-foreground'>
                  Cada bloco separado por linha em branco vira um parágrafo no e-mail. Tags HTML
                  (ex: <code>&lt;b&gt;</code>, <code>&lt;a&gt;</code>, <code>&lt;br&gt;</code>) são
                  permitidas e renderizadas no e-mail.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value='preview'
            forceMount
            className={cn(mobileView !== 'preview' && 'hidden sm:block')}
          >
            <div className='space-y-1.5'>
              <Label>Prévia</Label>
              <div className='overflow-hidden rounded-xl border bg-muted/30'>
                <iframe
                  title='Prévia do e-mail'
                  srcDoc={html}
                  sandbox=''
                  className='h-[420px] w-full bg-white'
                />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Send action bar */}
      <div className='sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:static sm:mx-0 sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none'>
        <p className='text-sm text-muted-foreground sm:hidden'>
          {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
        </p>
        <Button
          type='button'
          className='h-11'
          disabled={!canSend || sendMutation.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          <Icons.mail className='mr-2 size-4' />
          Enviar e-mail{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envio</AlertDialogTitle>
            <AlertDialogDescription>
              Este e-mail será enviado para {selectedIds.size} candidato
              {selectedIds.size !== 1 ? 's' : ''}. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={sendMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              {sendMutation.isPending ? (
                <>
                  <Icons.spinner className='mr-2 size-4 animate-spin' />
                  Enviando…
                </>
              ) : (
                'Enviar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
