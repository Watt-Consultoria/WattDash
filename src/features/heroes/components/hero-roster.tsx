'use client';

import { ROLE_LABEL } from '@/constants/user-options';
import { BoltIcon } from './hero-icons';
import { toShortHeroName } from '../lib/format-hero-name';
import type { Hero } from '@/types/api';

interface HeroRosterProps {
  heroes: Hero[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function HeroRoster({ heroes, activeId, onSelect }: HeroRosterProps) {
  return (
    <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
      {heroes.map((hero) => {
        const active = hero.id === activeId;
        return (
          <button
            key={hero.id}
            type='button'
            onClick={() => onSelect(hero.id)}
            aria-current={active}
            className={`flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-all duration-500 ease-out ${
              active
                ? 'border-[#d9b45b]/40 bg-gradient-to-b from-[#d9b45b]/[0.08] to-transparent'
                : 'border-white/[0.08] bg-[#0b0b0b] hover:-translate-y-0.5 hover:border-[#d9b45b]/25'
            }`}
          >
            <span
              className={`transition-colors duration-500 ${active ? 'text-[#d9b45b]' : 'text-[#d9b45b]/30'}`}
            >
              <BoltIcon className='size-3.5' fill='currentColor' />
            </span>
            <div className='min-w-0 flex-1'>
              <div className='truncate font-[family-name:var(--herois-font-serif)] text-xl leading-[1.05] font-semibold text-[#f4efe2] sm:text-[22px]'>
                {toShortHeroName(hero.name)}
              </div>
              <div className='mt-0.5 truncate text-[12.5px] text-[#f4f1ea]/50'>
                {ROLE_LABEL[hero.role] ?? hero.role}
              </div>
            </div>
            <span className='shrink-0 text-xs tabular-nums text-[#f4f1ea]/40'>
              {hero.start_year}–{hero.end_year}
            </span>
          </button>
        );
      })}
    </div>
  );
}
