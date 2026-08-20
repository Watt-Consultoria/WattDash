import type { Metadata } from 'next';
import { Geist, Cormorant_Garamond } from 'next/font/google';

const heroisSans = Geist({
  subsets: ['latin'],
  variable: '--herois-font-sans'
});

const heroisSerif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--herois-font-serif'
});

export const metadata: Metadata = {
  title: 'Salão dos Heróis — Watt Consultoria',
  description:
    'Homenagem aos ex-membros de destaque da Watt Consultoria — a chama que acenderam ainda ilumina cada projeto que nasce por aqui.',
  robots: { index: false, follow: false }
};

export default function HeroisPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${heroisSans.variable} ${heroisSerif.variable} font-[family-name:var(--herois-font-sans)]`}
      style={{ background: '#050505' }}
    >
      {children}
    </div>
  );
}
