import PageContainer from '@/components/layout/page-container';
import { ProjectsView } from '@/features/projects/components/projects-view';

export const metadata = { title: 'Dashboard: Projetos' };

export default function ProjectsPage() {
  return (
    <PageContainer
      pageTitle='Projetos'
      pageDescription='Gerencie projetos, etapas e entregáveis de consultoria.'
    >
      <ProjectsView />
    </PageContainer>
  );
}
