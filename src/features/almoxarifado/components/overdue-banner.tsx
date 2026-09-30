import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

interface OverdueBannerProps {
  count: number;
  onView: () => void;
}

/** Alerta persistente para o próprio usuário quando há empréstimos dele em atraso. */
export function OverdueBanner({ count, onView }: OverdueBannerProps) {
  const label =
    count === 1 ? 'Você tem 1 empréstimo atrasado' : `Você tem ${count} empréstimos atrasados`;

  return (
    <div
      role='status'
      className='flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
    >
      <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50'>
        <Icons.alertCircle className='size-5 text-red-600 dark:text-red-400' aria-hidden />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-medium'>{label}</p>
        <p className='text-xs opacity-80'>Devolva o quanto antes para liberar o material.</p>
      </div>
      <Button
        size='sm'
        variant='outline'
        className='h-9 shrink-0 border-red-300 bg-transparent hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/40'
        onClick={onView}
      >
        Ver
      </Button>
    </div>
  );
}
