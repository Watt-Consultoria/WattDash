'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { ProjectsRepository, type ProjectFilters } from '@/repositories/projects.repository';
import { LeadsRepository } from '@/repositories/leads.repository';
import { PortfolioRepository } from '@/repositories/portfolio.repository';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { ProjectStatusBadge } from './project-status-badge';
import { ProjectFormDialog } from './project-form-dialog';
import { getProjectCapabilities } from '../lib/permissions';
import { formatDate, isOverdue } from '../lib/format';
import { cn } from '@/lib/utils';
import type { Project, ProjectStatus } from '@/types/projects';

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'em_revisao', label: 'Em Revisão' },
  { value: 'revisado', label: 'Revisado' },
  { value: 'finalizado', label: 'Finalizado' }
];

interface ProjectCardProps {
  project: Project;
  leadName: string;
  typeName: string;
  onSelect: () => void;
}

function ProjectCard({ project, leadName, typeName, onSelect }: ProjectCardProps) {
  const deliveryLate = project.status === 'em_andamento' && isOverdue(project.delivery_date);

  return (
    <button
      type='button'
      onClick={onSelect}
      className='flex h-full flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md'
    >
      <div className='flex items-start justify-between gap-3'>
        <p className='min-w-0 truncate font-medium leading-tight'>{project.name}</p>
        <ProjectStatusBadge status={project.status} />
      </div>

      {project.description && (
        <p className='text-muted-foreground line-clamp-2 text-xs'>{project.description}</p>
      )}

      <div className='mt-auto space-y-1.5 pt-1 text-xs'>
        <div className='flex items-center gap-1.5'>
          <Icons.building className='text-muted-foreground size-3.5 shrink-0' />
          <span className='text-muted-foreground truncate'>{leadName}</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <Icons.tag className='text-muted-foreground size-3.5 shrink-0' />
          <span className='text-muted-foreground truncate'>{typeName}</span>
        </div>
        <div className={cn('flex items-center gap-1.5', deliveryLate && 'text-destructive')}>
          <Icons.calendar className='size-3.5 shrink-0' />
          <span className={cn(!deliveryLate && 'text-muted-foreground')}>
            Entrega em {formatDate(project.delivery_date)}
            {deliveryLate && ' · Atrasada'}
          </span>
        </div>
      </div>
    </button>
  );
}

interface ProjectListProps {
  onSelect: (projectId: string) => void;
}

export function ProjectList({ onSelect }: ProjectListProps) {
  const { profile } = useUserProfile();
  const { data: leads = [] } = LeadsRepository.useList();
  const { data: portfolioItems = [] } = PortfolioRepository.useList();
  const capabilities = getProjectCapabilities(profile, null);

  const [status, setStatus] = useState<ProjectStatus | 'all'>('all');
  const [leadId, setLeadId] = useState<string>('all');
  const [onlyMine, setOnlyMine] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filters: ProjectFilters = {
    ...(status !== 'all' && { status }),
    ...(leadId !== 'all' && { lead_id: leadId }),
    ...(onlyMine && profile?.id && { consultant_id: profile.id })
  };

  const { data: projects = [], isLoading } = ProjectsRepository.useProjects(filters);
  const hasFilters = status !== 'all' || leadId !== 'all' || onlyMine;

  const leadName = (id: string) => leads.find((l) => l.id === id)?.company_name ?? id;
  const typeName = (id: string) => portfolioItems.find((p) => p.id === id)?.name ?? id;

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-end gap-3'>
        <div className='space-y-1'>
          <Label className='text-muted-foreground text-xs'>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus | 'all')}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos os status</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-1'>
          <Label className='text-muted-foreground text-xs'>Lead</Label>
          <Select value={leadId} onValueChange={setLeadId}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='Lead' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos os leads</SelectItem>
              {leads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>
                  {lead.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {profile?.role === 'consultor' && (
          <div className='flex h-9 items-center gap-1.5'>
            <Checkbox id='only-mine' checked={onlyMine} onCheckedChange={(v) => setOnlyMine(!!v)} />
            <Label htmlFor='only-mine' className='cursor-pointer text-sm font-normal'>
              Apenas meus projetos
            </Label>
          </div>
        )}

        {capabilities.canCreateProject && (
          <Button size='sm' className='ml-auto shrink-0' onClick={() => setDialogOpen(true)}>
            <Icons.add className='mr-1.5 size-4' />
            Novo Projeto
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-32 w-full rounded-xl' />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center'>
          <div className='bg-muted flex size-14 items-center justify-center rounded-full'>
            <Icons.workspace className='text-muted-foreground size-6' />
          </div>
          <div>
            <p className='font-medium'>
              {hasFilters ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
            </p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {hasFilters
                ? 'Tente ajustar os filtros aplicados.'
                : capabilities.canCreateProject
                  ? 'Clique em "Novo Projeto" para começar.'
                  : 'Nenhum projeto foi criado ainda.'}
            </p>
          </div>
          {!hasFilters && capabilities.canCreateProject && (
            <Button variant='outline' size='sm' onClick={() => setDialogOpen(true)}>
              <Icons.add className='mr-1.5 size-4' />
              Novo Projeto
            </Button>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              leadName={leadName(project.lead_id)}
              typeName={typeName(project.project_type_id)}
              onSelect={() => onSelect(project.id)}
            />
          ))}
        </div>
      )}

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
