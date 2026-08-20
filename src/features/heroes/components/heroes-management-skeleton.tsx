import { Skeleton } from '@/components/ui/skeleton';

export function HeroesManagementSkeleton() {
  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between gap-3'>
        <Skeleton className='h-4 w-40' />
        <Skeleton className='h-8 w-32' />
      </div>
      <div className='grid gap-3 sm:grid-cols-2'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='flex items-start gap-3 rounded-xl border p-4'>
            <Skeleton className='size-14 shrink-0 rounded-lg' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-3 w-24' />
              <Skeleton className='h-3 w-full' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
