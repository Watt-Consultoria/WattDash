'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { UserRepository } from '@/repositories/users.repository';
import { formatDateTime } from '../lib/format';
import { FEEDBACK_KEYS, RATING_QUESTIONS, getDifficultyLabel } from '../lib/feedback-questions';

interface ProjectFeedbackListProps {
  projectId: string;
  /** `getProjectCapabilities(...).canViewFeedback` — o hook só chama a API quando `true`. */
  canView: boolean;
}

export function ProjectFeedbackList({ projectId, canView }: ProjectFeedbackListProps) {
  const { data: feedback, isLoading } = ProjectsRepository.useFeedback(projectId, canView);
  const { data: users = [] } = UserRepository.useSelectable();

  if (!canView) {
    return (
      <p className='text-muted-foreground text-sm'>
        Você não tem acesso à visão consolidada de feedback deste projeto.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className='space-y-2'>
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
      </div>
    );
  }

  if (!feedback || feedback.length === 0) {
    return <p className='text-muted-foreground text-sm'>Nenhum feedback recebido ainda.</p>;
  }

  const consultorName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  return (
    <ul className='space-y-2'>
      {feedback.map((item) => {
        const difficulty = item.answers[FEEDBACK_KEYS.difficulty]
          ? String(item.answers[FEEDBACK_KEYS.difficulty])
          : null;
        const difficultyOther = item.answers[FEEDBACK_KEYS.difficultyOther]
          ? String(item.answers[FEEDBACK_KEYS.difficultyOther])
          : null;
        const observations = item.answers[FEEDBACK_KEYS.observations]
          ? String(item.answers[FEEDBACK_KEYS.observations])
          : null;

        return (
          <li key={item.id} className='space-y-3 rounded-lg border p-3 text-sm'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <span className='flex items-center gap-1.5 font-medium'>
                <Icons.user className='text-muted-foreground size-3.5' />
                {consultorName(item.consultor_id)}
              </span>
              <span className='text-muted-foreground text-xs'>
                {formatDateTime(item.submitted_at)}
              </span>
            </div>

            {difficulty && (
              <div>
                <p className='text-muted-foreground text-xs'>Maior fonte de dificuldade</p>
                <p className='font-medium'>{getDifficultyLabel(difficulty)}</p>
                {difficultyOther && (
                  <p className='text-muted-foreground mt-0.5'>&ldquo;{difficultyOther}&rdquo;</p>
                )}
              </div>
            )}

            <div className='grid grid-cols-1 gap-1.5 sm:grid-cols-2'>
              {RATING_QUESTIONS.map((question) => {
                const rating = item.answers[question.key];
                if (typeof rating !== 'number') return null;

                return (
                  <div
                    key={question.key}
                    className='flex items-center justify-between gap-2 text-xs'
                  >
                    <span className='text-muted-foreground'>{question.label}</span>
                    <Badge variant='outline'>{rating}/5</Badge>
                  </div>
                );
              })}
            </div>

            {observations && (
              <div>
                <p className='text-muted-foreground text-xs'>Observações</p>
                <p className='text-muted-foreground mt-0.5'>&ldquo;{observations}&rdquo;</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
