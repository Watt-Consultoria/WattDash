'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { ProjectsRepository } from '@/repositories/projects.repository';
import { hasProjectDirectorAccess } from '../lib/permissions';
import { ProjectList } from './project-list';
import { ProjectDetail } from './project-detail';
import { MyStagesTab } from './my-stages-tab';
import { ProjectFeedbackList } from './project-feedback-list';
import { PendingFeedbackGate } from './pending-feedback-gate';

function ConsolidatedFeedbackSection() {
  const { data: finalized = [], isLoading } = ProjectsRepository.useProjects({
    status: 'finalizado'
  });
  const [projectId, setProjectId] = useState<string>('');

  if (isLoading) return null;

  return (
    <div className='space-y-3'>
      <h3 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
        Visão Consolidada
      </h3>

      {finalized.length === 0 ? (
        <p className='text-muted-foreground text-sm'>Nenhum projeto finalizado ainda.</p>
      ) : (
        <div className='space-y-4'>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className='w-full sm:w-[280px]'>
              <SelectValue placeholder='Selecione um projeto finalizado' />
            </SelectTrigger>
            <SelectContent>
              {finalized.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {projectId && <ProjectFeedbackList projectId={projectId} canView />}
        </div>
      )}
    </div>
  );
}

export function ProjectsView() {
  const { profile } = useUserProfile();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const showConsolidatedFeedback = hasProjectDirectorAccess(profile);

  if (selectedProjectId) {
    return (
      <PendingFeedbackGate>
        <div className='space-y-4'>
          <Button
            variant='ghost'
            size='sm'
            className='-ml-2'
            onClick={() => setSelectedProjectId(null)}
          >
            <Icons.chevronLeft className='mr-1 size-4' />
            Voltar para Projetos
          </Button>
          <ProjectDetail projectId={selectedProjectId} />
        </div>
      </PendingFeedbackGate>
    );
  }

  return (
    <PendingFeedbackGate>
      <Tabs defaultValue='projects' className='space-y-4'>
        <div className='overflow-x-auto'>
          <TabsList className='h-auto flex-wrap gap-1 p-1'>
            <TabsTrigger value='projects'>
              <Icons.workspace className='mr-1.5 size-4' />
              Projetos
            </TabsTrigger>
            <TabsTrigger value='my-stages'>
              <Icons.checks className='mr-1.5 size-4' />
              Minhas Etapas
            </TabsTrigger>
            {showConsolidatedFeedback && (
              <TabsTrigger value='feedback'>
                <Icons.chat className='mr-1.5 size-4' />
                Feedback
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value='projects'>
          <ProjectList onSelect={setSelectedProjectId} />
        </TabsContent>

        <TabsContent value='my-stages'>
          <MyStagesTab />
        </TabsContent>

        {showConsolidatedFeedback && (
          <TabsContent value='feedback'>
            <ConsolidatedFeedbackSection />
          </TabsContent>
        )}
      </Tabs>
    </PendingFeedbackGate>
  );
}
