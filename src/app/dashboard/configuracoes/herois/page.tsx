import PageContainer from '@/components/layout/page-container';
import { RoleGuard } from '@/components/layout/role-guard';
import { HeroesManagementView } from '@/features/heroes/components/heroes-management-view';
import { HeroesManagementSkeleton } from '@/features/heroes/components/heroes-management-skeleton';

export const metadata = { title: 'Dashboard: Gestão de Heróis' };

export default function ConfiguracoesHeroisPage() {
  return (
    <PageContainer
      pageTitle='Salão dos Heróis'
      pageDescription='Adicione e edite os heróis homenageados na página pública /herois.'
    >
      <RoleGuard minRank={3} fallback={<HeroesManagementSkeleton />}>
        <HeroesManagementView />
      </RoleGuard>
    </PageContainer>
  );
}
