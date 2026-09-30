import PageContainer from '@/components/layout/page-container';
import { AlmoxarifadoView } from '@/features/almoxarifado/components/almoxarifado-view';

export const metadata = { title: 'Dashboard: Almoxarifado' };

export default function AlmoxarifadoPage() {
  return (
    <PageContainer
      pageTitle='Almoxarifado'
      pageDescription='Consulte materiais, solicite empréstimos e registre devoluções.'
    >
      <AlmoxarifadoView />
    </PageContainer>
  );
}
