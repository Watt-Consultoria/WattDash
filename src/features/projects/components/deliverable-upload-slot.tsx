'use client';

import { useCallback, useRef } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type DeliverableFileStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface DeliverableManagedFile {
  file: File;
  status: DeliverableFileStatus;
  error?: string;
}

interface DeliverableUploadSlotProps {
  deliverableId: string;
  deliverableName: string;
  needsRework?: boolean;
  value: DeliverableManagedFile | null;
  onChange: (value: DeliverableManagedFile | null) => void;
}

export function DeliverableUploadSlot({
  deliverableName,
  needsRework,
  value,
  onChange
}: DeliverableUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const setFile = useCallback(
    (file: File) => {
      if (file.size > MAX_SIZE_BYTES) {
        onChange({ file, status: 'error', error: 'Arquivo muito grande (máx 10MB)' });
        return;
      }
      onChange({ file, status: 'pending' });
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) setFile(file);
    },
    [setFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setFile(file);
      e.target.value = '';
    },
    [setFile]
  );

  const statusIcon = () => {
    if (!value) return null;
    if (value.status === 'uploading')
      return <Icons.spinner className='size-3.5 animate-spin text-blue-500' />;
    if (value.status === 'done') return <Icons.circleCheck className='size-3.5 text-green-500' />;
    if (value.status === 'error')
      return <Icons.alertCircle className='size-3.5 text-destructive' />;
    return <Icons.paperclip className='size-3.5 text-muted-foreground' />;
  };

  return (
    <div className='space-y-1.5'>
      <p className='flex items-center gap-1.5 text-sm font-medium'>
        {deliverableName}
        {needsRework && (
          <span className='rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-normal text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'>
            Reenviar
          </span>
        )}
      </p>

      {value ? (
        <div className='flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2'>
          {statusIcon()}
          <span className='min-w-0 flex-1 truncate text-sm'>{value.file.name}</span>
          {value.error && <span className='text-destructive shrink-0 text-xs'>{value.error}</span>}
          {value.status !== 'uploading' && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-6 shrink-0'
              onClick={() => onChange(null)}
            >
              <Icons.close className='size-3' />
            </Button>
          )}
        </div>
      ) : (
        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
          <button
            type='button'
            onClick={() => inputRef.current?.click()}
            aria-label={`Anexar arquivo para ${deliverableName}`}
            className={cn(
              'flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed px-3 py-2.5 text-sm transition-colors',
              'hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            <Icons.upload className='text-muted-foreground size-4' />
            <span className='text-muted-foreground'>Anexar arquivo</span>
          </button>
          <input
            ref={inputRef}
            type='file'
            className='hidden'
            aria-label={`Anexar arquivo para ${deliverableName}`}
            onChange={handleInputChange}
            accept='image/*,.pdf,.doc,.docx,.xls,.xlsx'
          />
        </div>
      )}
    </div>
  );
}
