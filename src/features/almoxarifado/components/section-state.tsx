import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export function LoansSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className='space-y-3' aria-busy='true' aria-label='Carregando empréstimos'>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className='space-y-3 rounded-xl border p-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-3 w-1/3' />
            </div>
            <Skeleton className='h-5 w-16 rounded-full' />
          </div>
          <Skeleton className='h-4 w-1/2' />
        </div>
      ))}
    </div>
  );
}

export function MaterialsSkeleton() {
  return (
    <div
      className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'
      aria-busy='true'
      aria-label='Carregando materiais'
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className='space-y-3 rounded-xl border p-4'>
          <div className='flex items-center gap-3'>
            <Skeleton className='size-10 rounded-lg' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-3 w-1/3' />
            </div>
          </div>
          <Skeleton className='h-3 w-full' />
          <Skeleton className='h-3 w-4/5' />
          <Skeleton className='h-11 w-full rounded-md md:h-9' />
        </div>
      ))}
    </div>
  );
}

export function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role='alert'
      className='border-destructive/30 bg-destructive/5 flex flex-col items-center gap-3 rounded-xl border p-6 text-center'
    >
      <span className='bg-destructive/10 flex size-10 items-center justify-center rounded-full'>
        <Icons.alertCircle className='text-destructive size-5' />
      </span>
      <p className='text-destructive text-sm'>{message}</p>
      <Button variant='outline' className='h-11 md:h-9' onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}

interface EmptyStateProps {
  icon: keyof typeof Icons;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const Icon = Icons[icon];
  return (
    <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center'>
      <span className='bg-muted mb-1 flex size-12 items-center justify-center rounded-full'>
        <Icon className='text-muted-foreground size-6' />
      </span>
      <p className='font-medium'>{title}</p>
      {description && <p className='text-muted-foreground max-w-sm text-sm'>{description}</p>}
      {action && (
        <Button variant='outline' className='mt-2 h-11 md:h-9' onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
