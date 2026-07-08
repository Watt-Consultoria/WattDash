'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { ProcessesTab } from './processes-tab';
import { ApplicationsTab } from './applications-tab';
import { CandidatesTab } from './candidates-tab';
import { InterviewsTab } from './interviews-tab';
import { EvaluationsView } from './evaluations-view';
import { EmailTab } from './email-tab';

export function PselView() {
  const { rank } = useUserProfile();
  const canSendEmail = rank >= 3;

  return (
    <Tabs defaultValue='processes' className='space-y-4'>
      <div className='overflow-x-auto'>
        <TabsList className='h-auto flex-wrap gap-1 p-1'>
          <TabsTrigger value='processes'>Processos</TabsTrigger>
          <TabsTrigger value='applications'>Candidaturas</TabsTrigger>
          <TabsTrigger value='candidates'>Candidatos</TabsTrigger>
          <TabsTrigger value='interviews'>Entrevistas</TabsTrigger>
          <TabsTrigger value='evaluations'>Avaliações</TabsTrigger>
          {canSendEmail && <TabsTrigger value='email'>E-mail</TabsTrigger>}
        </TabsList>
      </div>

      <TabsContent value='processes'>
        <ProcessesTab />
      </TabsContent>

      <TabsContent value='applications'>
        <ApplicationsTab />
      </TabsContent>

      <TabsContent value='candidates'>
        <CandidatesTab />
      </TabsContent>

      <TabsContent value='interviews'>
        <InterviewsTab />
      </TabsContent>

      <TabsContent value='evaluations'>
        <EvaluationsView />
      </TabsContent>

      {canSendEmail && (
        <TabsContent value='email'>
          <EmailTab />
        </TabsContent>
      )}
    </Tabs>
  );
}
