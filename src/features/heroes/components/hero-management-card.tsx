import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ROLE_LABEL } from '@/constants/user-options';
import type { Hero } from '@/types/api';

interface HeroManagementCardProps {
  hero: Hero;
  onEdit: () => void;
}

export function HeroManagementCard({ hero, onEdit }: HeroManagementCardProps) {
  return (
    <div className='flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={hero.photo_url}
        alt={hero.name}
        className='size-14 shrink-0 rounded-lg object-cover'
      />
      <div className='min-w-0 flex-1'>
        <p className='truncate font-medium leading-tight'>{hero.name}</p>
        <p className='text-muted-foreground mt-0.5 text-xs'>
          {ROLE_LABEL[hero.role] ?? hero.role} · {hero.start_year} — {hero.end_year}
        </p>
        <p className='mt-2 line-clamp-2 text-sm italic'>"{hero.phrase}"</p>
      </div>
      <Button variant='ghost' size='icon' className='shrink-0' onClick={onEdit}>
        <Icons.edit className='size-4' />
      </Button>
    </div>
  );
}
