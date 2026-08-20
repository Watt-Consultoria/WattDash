'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { HeroesRepository } from '@/repositories/heroes.repository';
import { Icons } from '@/components/icons';
import { HeroFeaturedSlide } from './hero-featured-slide';
import { HeroRoster } from './hero-roster';
import { BoltIcon, LaurelIcon } from './hero-icons';

const SLIDE_INTERVAL_MS = 10000;

function HeroesHallLoading() {
  return (
    <div className='animate-pulse space-y-10'>
      <div className='h-[420px] rounded-[22px] border border-[#d9b45b]/10 bg-white/[0.02] sm:h-[480px]' />
      <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className='h-[72px] rounded-2xl border border-white/[0.06] bg-white/[0.02]'
          />
        ))}
      </div>
    </div>
  );
}

function HeroesHallEmpty() {
  return (
    <div className='flex flex-col items-center gap-4 rounded-[22px] border border-dashed border-[#d9b45b]/20 py-20 text-center'>
      <div className='flex size-14 items-center justify-center rounded-full bg-[#d9b45b]/10'>
        <BoltIcon className='size-6' />
      </div>
      <div>
        <p className='font-[family-name:var(--herois-font-serif)] text-2xl text-[#f7f3e9]'>
          O mural ainda está em branco
        </p>
        <p className='mt-1.5 max-w-xs text-sm text-[#f4f1ea]/50'>
          Em breve, os nomes que construíram a Watt vão ganhar seu lugar aqui.
        </p>
      </div>
    </div>
  );
}

export function HeroesHall() {
  const { data: heroes = [], isLoading } = HeroesRepository.useHeroes();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (heroes.length < 2) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % heroes.length);
    }, SLIDE_INTERVAL_MS);
  }, [heroes.length]);

  useEffect(() => {
    start();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [start]);

  useEffect(() => {
    if (activeIndex >= heroes.length) setActiveIndex(0);
  }, [activeIndex, heroes.length]);

  function jump(index: number) {
    setActiveIndex(index);
    start();
  }

  const active = heroes[activeIndex];

  return (
    <div className='relative min-h-svh overflow-hidden bg-[#050505] text-[#f4f1ea]'>
      <div
        className='pointer-events-none absolute top-[-160px] left-1/2 h-[420px] w-[92vw] max-w-[900px] -translate-x-1/2 rounded-full blur-sm [animation:shGlow_7s_ease-in-out_infinite]'
        style={{
          backgroundImage:
            'radial-gradient(ellipse at center, rgba(217,180,91,.14), transparent 68%)'
        }}
      />
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,.018) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <button
        type='button'
        onClick={() => setIsKioskMode((v) => !v)}
        title={isKioskMode ? 'Sair do modo tela de descanso' : 'Modo tela de descanso'}
        aria-label={isKioskMode ? 'Sair do modo tela de descanso' : 'Modo tela de descanso'}
        className='fixed top-5 right-5 z-20 flex size-10 items-center justify-center rounded-full border border-[#d9b45b]/20 bg-[#0c0c0c]/70 text-[#d9b45b] backdrop-blur transition-colors hover:border-[#d9b45b]/50 hover:bg-[#0c0c0c] sm:top-6 sm:right-6'
      >
        {isKioskMode ? (
          <Icons.minimize className='size-4' />
        ) : (
          <Icons.maximize className='size-4' />
        )}
      </button>

      <div
        className={`relative mx-auto max-w-5xl px-5 sm:px-8 lg:px-12 ${
          isKioskMode
            ? 'flex min-h-svh flex-col justify-center py-10'
            : 'pt-14 pb-16 sm:pt-20 lg:pt-24'
        }`}
      >
        {!isKioskMode && (
          <header className='text-center'>
            <div className='mb-5 flex justify-center'>
              <LaurelIcon className='h-14 w-auto sm:h-[70px]' />
            </div>
            <div className='mb-4 flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.3em] text-[#d9b45b] uppercase sm:text-xs sm:tracking-[0.34em]'>
              <BoltIcon className='size-3' />
              Watt Consultoria Júnior
              <BoltIcon className='size-3' />
            </div>
            <h1 className='font-[family-name:var(--herois-font-serif)] text-[44px] leading-[0.94] font-medium tracking-tight text-[#f7f3e9] sm:text-6xl lg:text-[88px]'>
              Salão dos Heróis
            </h1>
            <p className='mx-auto mt-4 max-w-xl font-[family-name:var(--herois-font-serif)] text-sm leading-relaxed text-[#f4f1ea]/55 italic sm:text-base lg:text-[17px]'>
              Àqueles que ergueram a Watt com as próprias mãos e depois seguiram novos caminhos — a
              chama que acenderam ainda ilumina cada projeto que nasce por aqui.
            </p>
            <div className='mt-7 flex items-center justify-center gap-3.5'>
              <span className='h-px w-12 bg-gradient-to-r from-transparent to-[#d9b45b]/45 sm:w-16' />
              <BoltIcon className='size-3.5' />
              <span className='h-px w-12 bg-gradient-to-l from-transparent to-[#d9b45b]/45 sm:w-16' />
            </div>
          </header>
        )}

        <main className={isKioskMode ? '' : 'mt-10 sm:mt-14'}>
          {isLoading ? (
            <HeroesHallLoading />
          ) : heroes.length === 0 ? (
            <HeroesHallEmpty />
          ) : (
            <>
              <section>
                <div className='mb-4 flex items-center justify-between'>
                  <span className='text-[11px] font-semibold tracking-[0.3em] text-[#f4f1ea]/40 uppercase sm:text-xs sm:tracking-[0.34em]'>
                    Em destaque agora
                  </span>
                  <span className='text-xs tabular-nums text-[#f4f1ea]/40'>
                    {String(activeIndex + 1).padStart(2, '0')} /{' '}
                    {String(heroes.length).padStart(2, '0')}
                  </span>
                </div>

                <div className='relative overflow-hidden rounded-[22px] border border-[#d9b45b]/[0.16] bg-gradient-to-b from-[#d9b45b]/5 to-transparent p-5 sm:p-8 lg:p-11'>
                  <div className='absolute inset-x-0 top-0 z-10 h-0.5 bg-[#d9b45b]/10'>
                    <div
                      key={active?.id}
                      className='h-full origin-left bg-[#d9b45b] [animation:shBar_10s_linear_infinite]'
                    />
                  </div>
                  {active && (
                    <div key={active.id} className='[animation:shFade_0.6s_ease]'>
                      <HeroFeaturedSlide hero={active} />
                    </div>
                  )}
                </div>

                {heroes.length > 1 && (
                  <div className='mt-5 flex items-center justify-center gap-2.5'>
                    {heroes.map((hero, i) => (
                      <button
                        key={hero.id}
                        type='button'
                        onClick={() => jump(i)}
                        title={hero.name}
                        aria-label={`Ver ${hero.name}`}
                        className={`h-1.5 rounded-full transition-all duration-400 ${
                          i === activeIndex ? 'w-7 bg-[#d9b45b]' : 'w-1.5 bg-[#d9b45b]/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </section>

              {!isKioskMode && (
                <section className='mt-10 sm:mt-14'>
                  <div className='mb-5 flex items-center gap-4'>
                    <span className='text-[11px] font-semibold tracking-[0.32em] text-[#f4f1ea]/40 uppercase sm:text-xs'>
                      O mural
                    </span>
                    <span className='h-px flex-1 bg-white/[0.08]' />
                    <span className='text-[11.5px] text-[#f4f1ea]/38'>
                      {heroes.length} {heroes.length === 1 ? 'veterano' : 'veteranos'}
                    </span>
                  </div>
                  <HeroRoster
                    heroes={heroes}
                    activeId={active?.id ?? ''}
                    onSelect={(id) => jump(heroes.findIndex((hero) => hero.id === id))}
                  />
                </section>
              )}
            </>
          )}
        </main>

        {!isKioskMode && (
          <footer className='relative pt-16 pb-4 text-center sm:pt-20'>
            <div className='mb-5 flex items-center justify-center gap-4'>
              <span className='h-px w-11 bg-gradient-to-r from-transparent to-[#d9b45b]/50 sm:w-14' />
              <BoltIcon className='size-3.5' />
              <span className='h-px w-11 bg-gradient-to-l from-transparent to-[#d9b45b]/50 sm:w-14' />
            </div>
            <p className='mx-auto max-w-md font-[family-name:var(--herois-font-serif)] text-lg leading-relaxed text-[#f4f1ea]/60 italic sm:text-xl'>
              &ldquo;Uma vez Watt, para sempre Watt.&rdquo;
            </p>
            <div className='mt-3.5 text-[11px] font-semibold tracking-[0.3em] text-[#f4f1ea]/35 uppercase'>
              Com gratidão eterna
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
