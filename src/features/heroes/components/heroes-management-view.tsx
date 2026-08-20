'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { HeroesRepository } from '@/repositories/heroes.repository';
import { HeroFormDialog } from './hero-form-dialog';
import { HeroEditDialog } from './hero-edit-dialog';
import { HeroManagementCard } from './hero-management-card';
import { HeroesManagementSkeleton } from './heroes-management-skeleton';
import type { Hero } from '@/types/api';

export function HeroesManagementView() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingHero, setEditingHero] = useState<Hero | null>(null);
  const { data: heroes = [], isLoading } = HeroesRepository.useHeroes();

  if (isLoading) {
    return <HeroesManagementSkeleton />;
  }

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between gap-3'>
        <p className='text-muted-foreground text-sm'>
          {heroes.length} {heroes.length === 1 ? 'herói' : 'heróis'} cadastrados
        </p>
        <Button onClick={() => setCreateOpen(true)} size='sm'>
          <Icons.add className='mr-1.5 size-4' />
          Novo Herói
        </Button>
      </div>

      {heroes.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center'>
          <div className='bg-muted flex size-14 items-center justify-center rounded-full'>
            <Icons.trophy className='text-muted-foreground size-6' />
          </div>
          <div>
            <p className='font-medium'>Nenhum herói cadastrado ainda</p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              Clique em "Novo Herói" para homenagear um ex-membro de destaque.
            </p>
          </div>
          <Button variant='outline' size='sm' onClick={() => setCreateOpen(true)}>
            <Icons.add className='mr-1.5 size-4' />
            Novo Herói
          </Button>
        </div>
      ) : (
        <div className='grid gap-3 sm:grid-cols-2'>
          {heroes.map((hero) => (
            <HeroManagementCard key={hero.id} hero={hero} onEdit={() => setEditingHero(hero)} />
          ))}
        </div>
      )}

      <HeroFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <HeroEditDialog
        hero={editingHero}
        onOpenChange={(open) => {
          if (!open) setEditingHero(null);
        }}
      />
    </div>
  );
}
