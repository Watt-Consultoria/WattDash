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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Icons } from '@/components/icons';
import { ContributionsEditor } from './contributions-editor';
import { HeroPhotoPicker } from './hero-photo-picker';
import { HeroesRepository } from '@/repositories/heroes.repository';
import { UserRepository } from '@/repositories/users.repository';
import { uploadHeroPhoto } from '../lib/upload-hero-photo';
import { createClient } from '@/utils/supabase/client';
import { toUserMessage } from '@/lib/api-client';
import { ROLE_LABEL } from '@/constants/user-options';
import { cn } from '@/lib/utils';

interface HeroFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HeroFormDialog({ open, onOpenChange }: HeroFormDialogProps) {
  const createMutation = HeroesRepository.useCreateHero();
  const { data: heroes = [] } = HeroesRepository.useHeroes();
  const { data: inactiveUsers = [], isLoading: isLoadingUsers } = UserRepository.useInactive();

  const heroUserIds = new Set(heroes.map((h) => h.user_id));
  const eligibleUsers = inactiveUsers.filter((u) => !heroUserIds.has(u.id));

  const [userId, setUserId] = useState('');
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [contributions, setContributions] = useState<string[]>(['']);
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const selectedUser = eligibleUsers.find((u) => u.id === userId);
  const cleanContributions = contributions.map((c) => c.trim()).filter(Boolean);
  const isSubmitting = createMutation.isPending || isUploading;
  const canSubmit =
    userId &&
    phrase.trim() &&
    cleanContributions.length > 0 &&
    startYear &&
    endYear &&
    Number(startYear) <= Number(endYear) &&
    photoFile &&
    !isSubmitting;

  useEffect(() => {
    if (open) {
      setUserId('');
      setUserPopoverOpen(false);
      setPhrase('');
      setContributions(['']);
      setStartYear('');
      setEndYear('');
      setPhotoFile(null);
    }
  }, [open]);

  function handleClose() {
    if (!isSubmitting) onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !photoFile) return;

    let photoPath: string;
    setIsUploading(true);
    try {
      const supabase = createClient();
      photoPath = await uploadHeroPhoto(photoFile, userId, supabase);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao enviar a foto.');
      setIsUploading(false);
      return;
    }
    setIsUploading(false);

    createMutation.mutate(
      {
        user_id: userId,
        phrase: phrase.trim(),
        contributions: cleanContributions,
        start_year: Number(startYear),
        end_year: Number(endYear),
        photo_path: photoPath
      },
      {
        onSuccess: () => {
          toast.success('Herói adicionado ao Salão dos Heróis!');
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-h-[90vh] w-[min(92vw,560px)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span className='bg-primary/10 flex size-8 items-center justify-center rounded-full'>
              <Icons.trophy className='text-primary size-4' />
            </span>
            Novo Herói
          </DialogTitle>
          <DialogDescription>
            Homenageie um ex-membro de destaque na página pública /herois.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          <div className='space-y-1.5'>
            <Label className='flex items-center gap-1.5'>
              <Icons.employee className='text-muted-foreground size-3.5' />
              Membro (inativo) *
            </Label>
            <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type='button'
                  variant='outline'
                  role='combobox'
                  aria-expanded={userPopoverOpen}
                  className='w-full justify-between font-normal'
                >
                  <span className={cn('truncate', !selectedUser && 'text-muted-foreground')}>
                    {selectedUser ? selectedUser.name : 'Selecione um ex-membro'}
                  </span>
                  <Icons.chevronsUpDown className='text-muted-foreground size-4 shrink-0 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0' align='start'>
                <Command>
                  <CommandInput placeholder='Buscar por nome...' />
                  <CommandList>
                    <CommandEmpty>
                      {isLoadingUsers ? 'Carregando...' : 'Nenhum ex-membro elegível encontrado.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {eligibleUsers.map((u) => (
                        <CommandItem
                          key={u.id}
                          value={u.name}
                          onSelect={() => {
                            setUserId(u.id);
                            setUserPopoverOpen(false);
                          }}
                        >
                          <Icons.check
                            className={cn('size-4', userId === u.id ? 'opacity-100' : 'opacity-0')}
                          />
                          <div className='min-w-0'>
                            <span className='block truncate'>{u.name}</span>
                            <span className='text-muted-foreground block truncate text-xs'>
                              {ROLE_LABEL[u.role] ?? u.role}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className='text-muted-foreground text-xs'>
              Somente usuários inativos que ainda não possuem um herói aparecem aqui.
            </p>
          </div>

          <div className='grid gap-4 sm:grid-cols-[auto_1fr]'>
            <div className='space-y-1.5'>
              <Label>Foto *</Label>
              <HeroPhotoPicker file={photoFile} onChange={setPhotoFile} />
            </div>

            <div className='space-y-4'>
              <div className='grid gap-4 grid-cols-2'>
                <div className='space-y-1.5'>
                  <Label htmlFor='hero-start-year'>Ano de início *</Label>
                  <Input
                    id='hero-start-year'
                    type='number'
                    inputMode='numeric'
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    placeholder='2020'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='hero-end-year'>Ano de saída *</Label>
                  <Input
                    id='hero-end-year'
                    type='number'
                    inputMode='numeric'
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                    placeholder='2023'
                  />
                </div>
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='hero-phrase'>Frase de homenagem *</Label>
                <Textarea
                  id='hero-phrase'
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  placeholder='Ex.: Fez a diferença em tudo que tocou.'
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
              Adicionar Herói
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
