'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { DateField } from '@/components/date-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
import { ProjectsRepository } from '@/repositories/projects.repository';
import { toUserMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectFormDialog({ open, onOpenChange }: ProjectFormDialogProps) {
  const createMutation = ProjectsRepository.useCreateProject();
  const { data: lookups } = ProjectsRepository.useProjectLookups();
  const leads = lookups?.leads ?? [];
  const portfolioItems = lookups?.portfolio_items ?? [];

  const [leadId, setLeadId] = useState('');
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  const [projectTypeId, setProjectTypeId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const selectedLead = leads.find((lead) => lead.id === leadId);

  const isPending = createMutation.isPending;
  const canSubmit = leadId && projectTypeId && name.trim() && deliveryDate && !isPending;

  useEffect(() => {
    if (open) {
      setLeadId('');
      setLeadPopoverOpen(false);
      setProjectTypeId('');
      setName('');
      setDescription('');
      setDeliveryDate('');
    }
  }, [open]);

  function handleClose() {
    if (!isPending) onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    createMutation.mutate(
      {
        lead_id: leadId,
        project_type_id: projectTypeId,
        name: name.trim(),
        ...(description.trim() && { description: description.trim() }),
        delivery_date: deliveryDate
      },
      {
        onSuccess: () => {
          toast.success('Projeto criado com sucesso!');
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-h-[90vh] w-[min(90vw,560px)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span className='bg-primary/10 flex size-8 items-center justify-center rounded-full'>
              <Icons.workspace className='text-primary size-4' />
            </span>
            Novo Projeto
          </DialogTitle>
          <DialogDescription>
            Defina os dados iniciais do projeto. As etapas e entregáveis são configurados depois, na
            página do projeto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5'>
                <Icons.building className='text-muted-foreground size-3.5' />
                Lead *
              </Label>
              <Popover open={leadPopoverOpen} onOpenChange={setLeadPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    role='combobox'
                    aria-expanded={leadPopoverOpen}
                    className='w-full justify-between font-normal'
                  >
                    <span className={cn('truncate', !selectedLead && 'text-muted-foreground')}>
                      {selectedLead ? selectedLead.company_name : 'Selecione um lead'}
                    </span>
                    <Icons.chevronsUpDown className='text-muted-foreground size-4 shrink-0 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className='w-[var(--radix-popover-trigger-width)] p-0'
                  align='start'
                >
                  <Command>
                    <CommandInput placeholder='Buscar lead...' />
                    <CommandList>
                      <CommandEmpty>Nenhum lead encontrado.</CommandEmpty>
                      <CommandGroup>
                        {leads.map((lead) => (
                          <CommandItem
                            key={lead.id}
                            value={lead.company_name}
                            onSelect={() => {
                              setLeadId(lead.id);
                              setLeadPopoverOpen(false);
                            }}
                          >
                            <Icons.check
                              className={cn(
                                'size-4',
                                leadId === lead.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <span className='truncate'>{lead.company_name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5'>
                <Icons.tag className='text-muted-foreground size-3.5' />
                Tipo de Projeto *
              </Label>
              <Select value={projectTypeId} onValueChange={setProjectTypeId}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Selecione um item de portfólio' />
                </SelectTrigger>
                <SelectContent>
                  {portfolioItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='project-name'>Nome do Projeto *</Label>
            <Input
              id='project-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex.: Projeto Watt'
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='project-desc'>
              Descrição <span className='text-muted-foreground font-normal'>(opcional)</span>
            </Label>
            <Textarea
              id='project-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Contexto, objetivos ou observações sobre o projeto'
              rows={3}
              className='resize-none'
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='project-delivery' className='flex items-center gap-1.5'>
              <Icons.calendar className='text-muted-foreground size-3.5' />
              Data de Entrega *
            </Label>
            <DateField
              id='project-delivery'
              value={deliveryDate}
              onChange={setDeliveryDate}
              className='sm:w-[220px]'
            />
          </div>

          <Separator />

          <DialogFooter>
            <Button type='button' variant='outline' disabled={isPending} onClick={handleClose}>
              Cancelar
            </Button>
            <Button type='submit' disabled={!canSubmit}>
              {isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              Criar Projeto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
