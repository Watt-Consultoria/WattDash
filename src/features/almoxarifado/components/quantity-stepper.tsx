import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';

interface QuantityStepperProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  min: number;
  max?: number;
  isInvalid?: boolean;
}

/** Campo numérico com botões −/+ de 44px — evita o teclado e o spinner nativo no celular. */
export function QuantityStepper({
  id,
  value,
  onChange,
  onBlur,
  min,
  max,
  isInvalid
}: QuantityStepperProps) {
  const current = Number.isNaN(value) ? min : value;
  const clamp = (next: number) => Math.min(Math.max(next, min), max ?? Number.POSITIVE_INFINITY);

  return (
    <div className='flex items-center gap-2'>
      <Button
        type='button'
        variant='outline'
        size='icon'
        className='size-11 shrink-0 md:size-9'
        disabled={current <= min}
        onClick={() => onChange(clamp(current - 1))}
        aria-label='Diminuir quantidade'
      >
        <Icons.minus className='size-4' />
      </Button>
      <Input
        id={id}
        inputMode='numeric'
        pattern='[0-9]*'
        value={Number.isNaN(value) ? '' : String(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '');
          onChange(digits === '' ? Number.NaN : Number.parseInt(digits, 10));
        }}
        onBlur={onBlur}
        aria-invalid={isInvalid || undefined}
        className='h-11 w-20 text-center text-base tabular-nums md:h-9 md:text-sm'
      />
      <Button
        type='button'
        variant='outline'
        size='icon'
        className='size-11 shrink-0 md:size-9'
        disabled={max !== undefined && current >= max}
        onClick={() => onChange(clamp(current + 1))}
        aria-label='Aumentar quantidade'
      >
        <Icons.add className='size-4' />
      </Button>
      {max !== undefined && (
        <span className='text-muted-foreground text-sm tabular-nums'>de {max} disponíveis</span>
      )}
    </div>
  );
}
