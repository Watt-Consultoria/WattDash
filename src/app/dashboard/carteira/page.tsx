import PageContainer from '@/components/layout/page-container';
import { RoleGuard } from '@/components/layout/role-guard';
import { CarteiraView } from '@/features/carteira/components/carteira-view';

export const metadata = { title: 'Dashboard: Carteira Watt' };

export default function CarteiraPage() {
  return (
    <PageContainer
      pageTitle='Carteira Watt'
      pageDescription='Visão financeira das contas internas, entradas e saídas.'
    >
      <RoleGuard minRank={2}>
        <CarteiraView />
      </RoleGuard>
    </PageContainer>
  );
}
