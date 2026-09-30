import { cn } from '@/lib/utils';

interface FilterChipGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

/** Linha de chips com rolagem horizontal de borda a borda no celular e quebra de linha no desktop. */
export function FilterChipGroup({ label, children, className }: FilterChipGroupProps) {
  return (
    <div
      role='group'
      aria-label={label}
      className={cn(
        '-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

interface FilterChipProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  /** Destaca a contagem em vermelho (ex.: atrasados). */
  isAlert?: boolean;
}

export function FilterChip({ selected, onClick, children, count, isAlert }: FilterChipProps) {
  return (
    <button
      type='button'
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring/50 inline-flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap outline-none focus-visible:ring-[3px] motion-safe:transition-colors',
        selected
          ? 'border-foreground bg-foreground text-background'
          : 'bg-background text-foreground hover:bg-accent'
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums',
            isAlert && count > 0
              ? 'bg-red-500 text-white'
              : selected
                ? 'bg-background/20'
                : 'bg-muted text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
