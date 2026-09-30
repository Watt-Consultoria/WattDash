'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** ISO yyyy-mm-dd → dd/mm/yyyy for display */
function formatBR(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface DateFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Primeira data selecionável (yyyy-mm-dd), inclusiva. */
  minDate?: string;
  /** Última data selecionável (yyyy-mm-dd), inclusiva. */
  maxDate?: string;
}

/** Campo de data com exibição sempre em pt-BR (dd/mm/aaaa), independente do locale do navegador. */
export function DateField({
  id,
  value,
  onChange,
  onBlur,
  placeholder = 'dd/mm/aaaa',
  className,
  disabled,
  minDate,
  maxDate
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + 'T00:00:00') : undefined;
  const disabledDays = [
    ...(minDate ? [{ before: new Date(minDate + 'T00:00:00') }] : []),
    ...(maxDate ? [{ after: new Date(maxDate + 'T00:00:00') }] : [])
  ];

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type='button'
          variant='outline'
          disabled={disabled}
          className={cn(
            'w-full justify-start gap-2 font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <Icons.calendar className='text-muted-foreground size-4 shrink-0' />
          {value ? formatBR(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={selected}
          defaultMonth={selected}
          disabled={disabledDays.length > 0 ? disabledDays : undefined}
          onSelect={(day) => {
            if (!day) return;
            onChange(toISODate(day));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
