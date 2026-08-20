'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/components/providers/user-profile-provider';

interface SettingsCardConfig {
  title: string;
  description: string;
  href: string;
  icon: keyof typeof Icons;
  minRank: number;
}

const SETTINGS_CARDS: SettingsCardConfig[] = [
  {
    title: 'Salão dos Heróis',
    description: 'Adicione e edite os heróis homenageados na página pública /herois.',
    href: '/dashboard/configuracoes/herois',
    icon: 'trophy',
    minRank: 3
  }
];

export function SettingsHub() {
  const { rank, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className='h-36 rounded-xl' />
        ))}
      </div>
    );
  }

  const visibleCards = SETTINGS_CARDS.filter((card) => rank >= card.minRank);

  if (visibleCards.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center'>
        <div className='bg-muted flex size-14 items-center justify-center rounded-full'>
          <Icons.settings className='text-muted-foreground size-6' />
        </div>
        <div>
          <p className='font-medium'>Nenhuma configuração disponível</p>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            Seu perfil não tem acesso a nenhuma configuração no momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
      {visibleCards.map((card) => {
        const Icon = Icons[card.icon];
        return (
          <Link
            key={card.href}
            href={card.href}
            className='group rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md'
          >
            <div className='bg-primary/10 flex size-10 items-center justify-center rounded-lg'>
              <Icon className='text-primary size-5' />
            </div>
            <p className='mt-3 font-medium'>{card.title}</p>
            <p className='text-muted-foreground mt-1 text-sm'>{card.description}</p>
            <span className='text-primary mt-3 inline-flex items-center gap-1 text-sm font-medium'>
              Gerenciar
              <Icons.arrowRight className='size-3.5 transition-transform group-hover:translate-x-0.5' />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
