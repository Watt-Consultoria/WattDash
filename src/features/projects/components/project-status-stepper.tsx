import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { ProjectStatus } from '@/types/projects';

const STEPS: { status: ProjectStatus; label: string }[] = [
  { status: 'em_andamento', label: 'Em Andamento' },
  { status: 'em_revisao', label: 'Em Revisão' },
  { status: 'revisado', label: 'Revisado' },
  { status: 'finalizado', label: 'Finalizado' }
];

interface ProjectStatusStepperProps {
  status: ProjectStatus;
}

export function ProjectStatusStepper({ status }: ProjectStatusStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <div className='flex min-w-max items-start'>
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.status} className='flex items-start'>
            <div className='flex flex-col items-center gap-1'>
              <div
                className={cn(
                  'flex size-6 items-center justify-center rounded-full border text-xs font-medium',
                  isDone && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary text-primary',
                  !isDone && !isCurrent && 'border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {isDone ? <Icons.check className='size-3.5' /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-[11px] whitespace-nowrap',
                  isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-1.5 mt-3 h-px w-8 sm:w-14',
                  isDone ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
