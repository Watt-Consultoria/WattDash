import PageContainer from '@/components/layout/page-container';
import { SettingsHub } from '@/features/settings/components/settings-hub';

export const metadata = { title: 'Dashboard: Configurações' };

export default function ConfiguracoesPage() {
  return (
    <PageContainer
      pageTitle='Configurações'
      pageDescription='Gerencie as configurações do sistema disponíveis para o seu perfil.'
    >
      <SettingsHub />
    </PageContainer>
  );
}
