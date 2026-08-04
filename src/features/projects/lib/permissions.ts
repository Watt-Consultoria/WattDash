import type { UserProfile } from '@/types/user-profile';
import type { Project, ProjectStage } from '@/types/projects';

export interface ProjectCapabilities {
  /** `gerente` ou superusuário podem criar novos projetos. */
  canCreateProject: boolean;
  /** Gerente responsável pelo projeto (ou superusuário), com o projeto `em_andamento`. */
  canManageStages: boolean;
  /** Consultor atribuído à etapa, com a etapa `pendente`. */
  canSubmitStage: (stage: ProjectStage) => boolean;
  /** Gerente responsável pelo projeto (ou superusuário), com a etapa `em_revisao`. */
  canReviewStage: (stage: ProjectStage) => boolean;
  /** Diretor de `projetos` (ou superusuário), com o projeto `em_revisao`. */
  canReviewProject: boolean;
  /** Diretor de `projetos` (ou superusuário), com o projeto `revisado`. */
  canClose: boolean;
  /** Gerente responsável pelo projeto ou diretor/superusuário de `projetos`. */
  canViewFeedback: boolean;
}

function isSuperuser(profile: UserProfile | null): boolean {
  return (profile?.rank ?? 0) >= 3;
}

function isProjectOwner(profile: UserProfile | null, project: Project | null): boolean {
  return !!profile && !!project && project.created_by === profile.id;
}

/** Espelha `MANAGER_ACCESS`: `gerente`/`assessor`/`presidente`. */
export function hasManagerAccess(profile: UserProfile | null): boolean {
  return profile?.role === 'gerente' || isSuperuser(profile);
}

/** Espelha `PROJECT_DIRECTOR_ACCESS`: `diretor` do setor `projetos`/`assessor`/`presidente`. */
export function hasProjectDirectorAccess(profile: UserProfile | null): boolean {
  return (profile?.role === 'diretor' && profile.sector === 'projetos') || isSuperuser(profile);
}

export function getProjectCapabilities(
  profile: UserProfile | null,
  project: Project | null
): ProjectCapabilities {
  const managerAccess = hasManagerAccess(profile);
  const directorAccess = hasProjectDirectorAccess(profile);
  const isOwnerOrSuperuser = isSuperuser(profile) || isProjectOwner(profile, project);

  return {
    canCreateProject: managerAccess,
    canManageStages: managerAccess && isOwnerOrSuperuser && project?.status === 'em_andamento',
    canSubmitStage: (stage) =>
      !!profile && stage.consultant_id === profile.id && stage.status === 'pendente',
    canReviewStage: (stage) => managerAccess && isOwnerOrSuperuser && stage.status === 'em_revisao',
    canReviewProject: directorAccess && project?.status === 'em_revisao',
    canClose: directorAccess && project?.status === 'revisado',
    canViewFeedback: directorAccess || isOwnerOrSuperuser
  };
}
