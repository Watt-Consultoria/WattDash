import { Badge } from '@/components/ui/badge';
import type { StageStatus } from '@/types/projects';

const config: Record<StageStatus, { label: string; className: string }> = {
  pendente: {
    label: 'Pendente',
    className:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
  },
  em_revisao: {
    label: 'Em Revisão',
    className:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
  },
  concluida: {
    label: 'Concluída',
    className:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
  }
};

interface StageStatusBadgeProps {
  status: StageStatus;
}

export function StageStatusBadge({ status }: StageStatusBadgeProps) {
  const { label, className } = config[status];
  return (
    <Badge variant='outline' className={className}>
      {label}
    </Badge>
  );
}
