'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

interface HeroPhotoPickerProps {
  file: File | null;
  onChange: (file: File | null) => void;
  /** URL da foto já cadastrada, exibida enquanto nenhum arquivo novo é selecionado (modo edição). */
  existingPhotoUrl?: string;
}

export function HeroPhotoPicker({ file, onChange, existingPhotoUrl }: HeroPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = useCallback(
    (incoming: File | undefined) => {
      if (!incoming) return;
      if (!incoming.type.startsWith('image/')) {
        setError('Selecione um arquivo de imagem.');
        return;
      }
      if (incoming.size > MAX_SIZE_BYTES) {
        setError('Imagem muito grande (máx 8MB).');
        return;
      }
      setError(null);
      onChange(incoming);
    },
    [onChange]
  );

  const displayUrl = previewUrl ?? existingPhotoUrl;

  return (
    <div className='space-y-2'>
      <button
        type='button'
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]);
        }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        aria-label='Selecionar foto do herói'
        className={cn(
          'relative flex aspect-[4/5] w-full max-w-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors',
          'hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt='Pré-visualização da foto' className='size-full object-cover' />
        ) : (
          <div className='flex flex-col items-center gap-1.5 px-3 text-center'>
            <Icons.media className='text-muted-foreground size-6' />
            <p className='text-muted-foreground text-xs'>Clique ou arraste uma foto</p>
          </div>
        )}
        <input
          ref={inputRef}
          type='file'
          accept='image/*'
          className='hidden'
          aria-label='Selecionar foto do herói'
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </button>

      {error && <p className='text-destructive text-xs'>{error}</p>}

      {file && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='text-muted-foreground h-7 px-2 text-xs'
          onClick={() => {
            onChange(null);
            setError(null);
          }}
        >
          <Icons.close className='mr-1 size-3' />
          Remover nova foto
        </Button>
      )}
    </div>
  );
}
