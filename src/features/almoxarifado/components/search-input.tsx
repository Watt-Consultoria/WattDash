import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

/** Busca com alvo de toque de 44px no celular, fonte de 16px (evita zoom no iOS) e botão de limpar. */
export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Icons.search
        aria-hidden
        className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2'
      />
      <Input
        type='search'
        enterKeyHint='search'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className='h-11 pr-10 pl-9 text-base md:h-9 md:text-sm [&::-webkit-search-cancel-button]:hidden'
      />
      {value && (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='absolute top-1/2 right-1 size-9 -translate-y-1/2 md:size-7'
          onClick={() => onChange('')}
          aria-label='Limpar busca'
        >
          <Icons.close className='size-4' />
        </Button>
      )}
    </div>
  );
}
