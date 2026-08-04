'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { ApiError, toUserMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { DIFFICULTY_OPTIONS, FEEDBACK_KEYS, RATING_QUESTIONS } from '../lib/feedback-questions';

const TOTAL_REQUIRED = 1 + RATING_QUESTIONS.length;

interface QuestionProps {
  number: number;
  children: React.ReactNode;
}

function Question({ number, children }: QuestionProps) {
  return (
    <div className='flex gap-3'>
      <span className='mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium'>
        {number}
      </span>
      <div className='min-w-0 flex-1 space-y-2.5'>{children}</div>
    </div>
  );
}

interface RatingRowProps {
  number: number;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

function RatingRow({ number, label, value, onChange, disabled }: RatingRowProps) {
  return (
    <Question number={number}>
      <Label className='text-sm font-normal'>{label}</Label>
      <ToggleGroup
        type='single'
        variant='outline'
        value={value}
        onValueChange={(v) => v && onChange(v)}
        disabled={disabled}
        className='inline-flex'
      >
        {['1', '2', '3', '4', '5'].map((n) => (
          <ToggleGroupItem key={n} value={n} className='size-9 p-0'>
            {n}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Question>
  );
}

interface ProjectFeedbackFormProps {
  projectId: string;
  /** `plain` omite o `Card`/cabeçalho — para quando o container já fornece esse chrome. */
  variant?: 'card' | 'plain';
}

export function ProjectFeedbackForm({ projectId, variant = 'card' }: ProjectFeedbackFormProps) {
  const createMutation = ProjectsRepository.useCreateFeedback(projectId);

  const [difficulty, setDifficulty] = useState('');
  const [difficultyOther, setDifficultyOther] = useState('');
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [observations, setObservations] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isPending = createMutation.isPending;
  const hasDifficulty = !!difficulty && (difficulty !== 'outro' || !!difficultyOther.trim());
  const answeredRatings = RATING_QUESTIONS.filter((q) => ratings[q.key]).length;
  const answeredCount = (hasDifficulty ? 1 : 0) + answeredRatings;
  const progress = Math.round((answeredCount / TOTAL_REQUIRED) * 100);
  const canSubmit = hasDifficulty && answeredRatings === RATING_QUESTIONS.length && !isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const answers: Record<string, unknown> = {
      [FEEDBACK_KEYS.difficulty]: difficulty,
      ...(difficulty === 'outro' && { [FEEDBACK_KEYS.difficultyOther]: difficultyOther.trim() }),
      ...Object.fromEntries(RATING_QUESTIONS.map((q) => [q.key, Number(ratings[q.key])])),
      ...(observations.trim() && { [FEEDBACK_KEYS.observations]: observations.trim() })
    };

    createMutation.mutate(
      { answers },
      {
        onSuccess: () => {
          toast.success('Feedback enviado. Obrigado!');
          setSubmitted(true);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            setAlreadySubmitted(true);
          } else {
            toast.error(toUserMessage(err));
          }
        }
      }
    );
  }

  if (alreadySubmitted || submitted) {
    return (
      <div className='flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground'>
        <Icons.circleCheck className='size-4 shrink-0 text-green-500' />
        Você já enviou seu feedback para este projeto. Obrigado pela contribuição!
      </div>
    );
  }

  const form = (
    <form onSubmit={handleSubmit} className='space-y-5'>
      <div className='space-y-1.5'>
        <div className='flex items-center justify-between text-xs'>
          <span className='text-muted-foreground'>Progresso</span>
          <span className='text-muted-foreground'>
            {answeredCount}/{TOTAL_REQUIRED} obrigatórias
          </span>
        </div>
        <Progress value={progress} className='h-1.5' />
      </div>

      <Question number={1}>
        <Label className='text-sm'>
          Na sua opinião, qual a maior fonte de dificuldade de seu grupo na realização do projeto? *
        </Label>
        <RadioGroup value={difficulty} onValueChange={setDifficulty} disabled={isPending}>
          {DIFFICULTY_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={cn(
                'flex items-start gap-2 rounded-lg border p-2.5 transition-colors',
                difficulty === option.value && 'border-primary bg-primary/5'
              )}
            >
              <RadioGroupItem
                id={`difficulty-${option.value}`}
                value={option.value}
                className='mt-0.5'
              />
              <Label
                htmlFor={`difficulty-${option.value}`}
                className='cursor-pointer text-sm font-normal'
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {difficulty === 'outro' && (
          <Textarea
            value={difficultyOther}
            onChange={(e) => setDifficultyOther(e.target.value)}
            placeholder='Descreva a dificuldade'
            rows={2}
            className='resize-none'
            disabled={isPending}
          />
        )}
      </Question>

      <Separator />

      <div className='space-y-4'>
        <p className='text-muted-foreground text-xs'>
          Avalie de <span className='font-medium'>1 (muito baixo)</span> a{' '}
          <span className='font-medium'>5 (muito alto)</span>:
        </p>
        {RATING_QUESTIONS.map((question, index) => (
          <RatingRow
            key={question.key}
            number={index + 2}
            label={question.label}
            value={ratings[question.key] ?? ''}
            onChange={(value) => setRatings((prev) => ({ ...prev, [question.key]: value }))}
            disabled={isPending}
          />
        ))}
      </div>

      <Separator />

      <Question number={RATING_QUESTIONS.length + 2}>
        <Label htmlFor='feedback-observacoes' className='text-sm'>
          Existe alguma observação sobre o projeto?{' '}
          <span className='text-muted-foreground font-normal'>
            Ex.: prazo de entrega, colegas de equipe, liderança do setor etc. (opcional)
          </span>
        </Label>
        <Textarea
          id='feedback-observacoes'
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder='Compartilhe mais detalhes (opcional)'
          rows={3}
          className='resize-none'
          disabled={isPending}
        />
      </Question>

      <Button type='submit' disabled={!canSubmit} className='w-full sm:w-auto'>
        {isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
        Enviar Feedback
      </Button>
    </form>
  );

  if (variant === 'plain') return form;

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <span className='bg-primary/10 flex size-8 items-center justify-center rounded-full'>
            <Icons.chat className='text-primary size-4' />
          </span>
          Deixe seu feedback
        </CardTitle>
        <CardDescription>Conte como foi sua experiência atuando neste projeto.</CardDescription>
      </CardHeader>

      <CardContent>{form}</CardContent>
    </Card>
  );
}
