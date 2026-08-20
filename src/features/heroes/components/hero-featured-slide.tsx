'use client';

import { useState } from 'react';
import { ROLE_LABEL } from '@/constants/user-options';
import { toShortHeroName } from '../lib/format-hero-name';
import type { Hero } from '@/types/api';

interface HeroFeaturedSlideProps {
  hero: Hero;
}

export function HeroFeaturedSlide({ hero }: HeroFeaturedSlideProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className='grid items-center gap-8 md:grid-cols-[0.82fr_1fr] md:gap-12'>
      <div className='relative h-[300px] overflow-hidden rounded-2xl border border-[#d9b45b]/20 shadow-[0_30px_80px_rgba(0,0,0,0.6)] sm:h-[380px] md:h-[420px] lg:h-[484px]'>
        <div
          className={`absolute inset-0 bg-[#0c0c0c] transition-opacity duration-500 ${
            imgLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.photo_url}
          alt={`Foto de ${hero.name}`}
          className='size-full object-cover'
          onLoad={() => setImgLoaded(true)}
        />
        <div
          className='pointer-events-none absolute inset-0'
          style={{ backgroundImage: 'linear-gradient(180deg, transparent 58%, rgba(5,5,5,.5))' }}
        />
      </div>

      <div>
        <div className='text-[11px] font-semibold tracking-[0.3em] text-[#d9b45b] uppercase sm:text-xs sm:tracking-[0.34em]'>
          {ROLE_LABEL[hero.role] ?? hero.role}
        </div>
        <h2 className='mt-3 font-[family-name:var(--herois-font-serif)] text-[38px] leading-[0.98] font-medium tracking-tight text-[#f7f3e9] sm:text-5xl lg:text-[56px]'>
          {toShortHeroName(hero.name)}
        </h2>
        <div className='mt-2.5 flex items-center gap-2.5 text-[13px] tabular-nums text-[#f4f1ea]/45'>
          <span className='h-px w-3.5 bg-[#d9b45b]/60' />
          {hero.start_year} — {hero.end_year}
        </div>
        <blockquote className='relative mt-6 font-[family-name:var(--herois-font-serif)] text-[22px] leading-[1.32] text-[#f4efe2] italic sm:text-[26px] lg:text-[30px]'>
          <span
            className='pointer-events-none absolute -top-6 -left-1.5 font-[family-name:var(--herois-font-serif)] text-[54px] leading-none text-[#d9b45b]/35 sm:text-[70px]'
            aria-hidden='true'
          >
            &ldquo;
          </span>
          {hero.phrase}
        </blockquote>
        <div className='mt-7'>
          <div className='mb-3.5 text-[11px] font-semibold tracking-[0.28em] text-[#f4f1ea]/40 uppercase'>
            Deixou seu nome em
          </div>
          <div className='flex flex-col gap-2.5'>
            {hero.contributions.map((contribution, i) => (
              <div key={i} className='flex items-start gap-3'>
                <span className='mt-1.5 size-[5px] shrink-0 rotate-45 bg-[#d9b45b]' />
                <span className='text-[13.5px] leading-[1.55] text-[#f4f1ea]/75 sm:text-[14.5px]'>
                  {contribution}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
