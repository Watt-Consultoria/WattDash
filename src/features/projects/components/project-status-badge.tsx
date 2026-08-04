import { Badge } from '@/components/ui/badge';
import type { ProjectStatus } from '@/types/projects';

const config: Record<ProjectStatus, { label: string; className: string }> = {
  em_andamento: {
    label: 'Em Andamento',
    className:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
  },
  em_revisao: {
    label: 'Em Revisão',
    className:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
  },
  revisado: {
    label: 'Revisado',
    className:
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
  },
  finalizado: {
    label: 'Finalizado',
    className:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
  }
};

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const { label, className } = config[status];
  return (
    <Badge variant='outline' className={className}>
      {label}
    </Badge>
  );
}
