'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { ContributionsEditor } from './contributions-editor';
import { HeroPhotoPicker } from './hero-photo-picker';
import { HeroesRepository } from '@/repositories/heroes.repository';
import { uploadHeroPhoto } from '../lib/upload-hero-photo';
import { createClient } from '@/utils/supabase/client';
import { toUserMessage } from '@/lib/api-client';
import { ROLE_LABEL } from '@/constants/user-options';
import type { Hero } from '@/types/api';

interface HeroEditDialogProps {
  hero: Hero | null;
  onOpenChange: (open: boolean) => void;
}

export function HeroEditDialog({ hero, onOpenChange }: HeroEditDialogProps) {
  const updateMutation = HeroesRepository.useUpdateHero();

  const [phrase, setPhrase] = useState('');
  const [contributions, setContributions] = useState<string[]>(['']);
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isSubmitting = updateMutation.isPending || isUploading;
  const cleanContributions = contributions.map((c) => c.trim()).filter(Boolean);
  const canSubmit =
    phrase.trim() &&
    cleanContributions.length > 0 &&
    startYear &&
    endYear &&
    Number(startYear) <= Number(endYear) &&
    !isSubmitting;

  useEffect(() => {
    if (hero) {
      setPhrase(hero.phrase);
      setContributions(hero.contributions.length > 0 ? hero.contributions : ['']);
      setStartYear(String(hero.start_year));
      setEndYear(String(hero.end_year));
      setPhotoFile(null);
    }
  }, [hero]);

  function handleClose() {
    if (!isSubmitting) onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !hero) return;

    let photoPath: string | undefined;
    if (photoFile) {
      setIsUploading(true);
      try {
        const supabase = createClient();
        photoPath = await uploadHeroPhoto(photoFile, hero.user_id, supabase);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Falha ao enviar a foto.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    updateMutation.mutate(
      {
        id: hero.id,
        payload: {
          phrase: phrase.trim(),
          contributions: cleanContributions,
          start_year: Number(startYear),
          end_year: Number(endYear),
          ...(photoPath && { photo_path: photoPath })
        }
      },
      {
        onSuccess: () => {
          toast.success('Herói atualizado com sucesso!');
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Dialog open={!!hero} onOpenChange={handleClose}>
      <DialogContent className='max-h-[90vh] w-[min(92vw,560px)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span className='bg-primary/10 flex size-8 items-center justify-center rounded-full'>
              <Icons.edit className='text-primary size-4' />
            </span>
            Editar Herói
          </DialogTitle>
          <DialogDescription>
            {hero && (
              <>
                {hero.name} · {ROLE_LABEL[hero.role] ?? hero.role}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {hero && (
          <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
            <div className='grid gap-4 sm:grid-cols-[auto_1fr]'>
              <div className='space-y-1.5'>
                <Label>Foto</Label>
                <HeroPhotoPicker
                  file={photoFile}
                  onChange={setPhotoFile}
                  existingPhotoUrl={hero.photo_url}
                />
              </div>

              <div className='space-y-4'>
                <div className='grid gap-4 grid-cols-2'>
                  <div className='space-y-1.5'>
                    <Label htmlFor='hero-edit-start-year'>Ano de início *</Label>
                    <Input
                      id='hero-edit-start-year'
                      type='number'
                      inputMode='numeric'
                      value={startYear}
                      onChange={(e) => setStartYear(e.target.value)}
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor='hero-edit-end-year'>Ano de saída *</Label>
                    <Input
                      id='hero-edit-end-year'
                      type='number'
                      inputMode='numeric'
                      value={endYear}
                      onChange={(e) => setEndYear(e.target.value)}
                    />
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='hero-edit-phrase'>Frase de homenagem *</Label>
                  <Textarea
                    id='hero-edit-phrase'
                    value={phrase}
                    onChange={(e) => setPhrase(e.target.value)}
                    rows={2}
                    className='resize-none'
                  />
                </div>
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label>Contribuições *</Label>
              <ContributionsEditor contributions={contributions} onChange={setContributions} />
            </div>

            <Separator />

            <DialogFooter>
              <Button type='button' variant='outline' disabled={isSubmitting} onClick={handleClose}>
                Cancelar
              </Button>
              <Button type='submit' disabled={!canSubmit}>
                {isSubmitting && <Icons.spinner className='mr-2 size-4 animate-spin' />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
