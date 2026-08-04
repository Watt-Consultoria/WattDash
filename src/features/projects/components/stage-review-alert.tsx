'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { UserRepository } from '@/repositories/users.repository';
import { formatDate, formatDateTime } from '../lib/format';
import { resolveReworkNames } from '../lib/stage-review';
import type { Deliverable, StageReview } from '@/types/projects';

interface StageReviewAlertProps {
  review: StageReview;
  deliverables: Deliverable[];
  /** Exibido apenas para revisões reprovadas — normalmente "Reenviar Entrega". */
  onResubmit?: () => void;
}

export function StageReviewAlert({ review, deliverables, onResubmit }: StageReviewAlertProps) {
  const { data: users = [] } = UserRepository.useSelectable();
  const reviewerName = users.find((u) => u.id === review.reviewed_by)?.name ?? 'Revisor';

  if (review.approved) {
    return (
      <Alert className='border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'>
        <Icons.circleCheck className='size-4 text-green-600 dark:text-green-400' />
        <AlertTitle className='text-green-800 dark:text-green-300'>
          Entrega aprovada por {reviewerName}
        </AlertTitle>
        <AlertDescription className='text-green-700 dark:text-green-400/90'>
          <p>{formatDateTime(review.reviewed_at)}</p>
          {review.notes && <p className='text-foreground/80'>{review.notes}</p>}
        </AlertDescription>
      </Alert>
    );
  }

  const reworkNames = resolveReworkNames(review, deliverables);

  return (
    <Alert className='border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30'>
      <Icons.warning className='size-4 text-orange-600 dark:text-orange-400' />
      <AlertTitle className='text-orange-800 dark:text-orange-300'>
        Entrega reprovada por {reviewerName} — reenvio necessário
      </AlertTitle>
      <AlertDescription className='text-orange-700 dark:text-orange-400/90'>
        <p className='text-foreground/80'>{review.notes}</p>

        <div className='mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs'>
          <span>Revisado em {formatDateTime(review.reviewed_at)}</span>
          {review.new_delivery_date && (
            <span className='font-medium'>
              Novo prazo de entrega: {formatDate(review.new_delivery_date)}
            </span>
          )}
        </div>

        {reworkNames.length > 0 && (
          <ul className='mt-1.5 flex flex-wrap gap-1.5'>
            {reworkNames.map((name) => (
              <li
                key={name}
                className='rounded-full border border-orange-300 bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-800 dark:border-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
              >
                {name}
              </li>
            ))}
          </ul>
        )}

        {onResubmit && (
          <Button size='sm' className='mt-2' onClick={onResubmit}>
            <Icons.upload className='mr-1.5 size-3.5' />
            Reenviar Entrega
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
