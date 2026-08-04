// Types for the `/projects` domain — see `Projects` topic in wattapi/API.md

import type { LeadStatus } from './api';

export type ProjectStatus = 'em_andamento' | 'em_revisao' | 'revisado' | 'finalizado';

export type StageStatus = 'pendente' | 'em_revisao' | 'concluida';

// ─── Lookups ───────────────────────────────────────────────────────────────

export interface ProjectLookupLead {
  id: string;
  company_name: string;
  status: LeadStatus;
}

export interface ProjectLookupPortfolioItem {
  id: string;
  name: string;
  description: string;
}

export interface ProjectLookupConsultant {
  id: string;
  name: string;
  email: string;
}

/** Resposta de `GET /projects/lookups` — dados de referência para o formulário de criação de projeto. */
export interface ProjectLookups {
  leads: ProjectLookupLead[];
  portfolio_items: ProjectLookupPortfolioItem[];
  consultants: ProjectLookupConsultant[];
}

/**
 * Resposta de `GET /projects/feedback-status` — ids dos projetos finalizados em que o
 * consultor autenticado tem etapa atribuída e ainda não enviou feedback, do mais recentemente
 * finalizado para o mais antigo. Restrito a `role: 'consultor'`.
 */
export interface ProjectFeedbackStatus {
  pending_feedbacks: string[];
}

export interface Project {
  id: string;
  lead_id: string;
  project_type_id: string;
  name: string;
  description: string | null;
  delivery_date: string;
  closing_notes: string | null;
  closed_by: string | null;
  closed_at: string | null;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
}

export interface ProjectStage {
  id: string;
  project_id: string;
  delivery_date: string;
  deadline_date: string;
  name: string;
  description: string;
  position: number;
  consultant_id: string;
  status: StageStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  deliverables: Deliverable[];
}

export interface SubmittedFile {
  id: string;
  deliverable_id: string;
  name: string;
  /** Present on `GET .../submissions` (listing). */
  path?: string;
  /** Present on `GET .../submissions/:submissionId` (detail), valid for 1 hour. */
  signed_url?: string;
}

export interface StageSubmission {
  id: string;
  stage_id: string;
  notes: string | null;
  attempt: number;
  submitted_by: string;
  submitted_at: string;
  files: SubmittedFile[];
}

export interface StageReview {
  id: string;
  submission_id: string;
  approved: boolean;
  notes: string | null;
  new_delivery_date: string | null;
  reviewed_by: string;
  reviewed_at: string;
  /** Only present when `approved: false`. */
  rework_deliverable_ids?: string[];
}

export interface ProjectReview {
  id: string;
  project_id: string;
  round: number;
  approved: boolean;
  notes: string;
  reviewer_id: string;
  reviewed_at: string;
}

export interface ProjectFeedback {
  id: string;
  project_id: string;
  consultor_id: string;
  answers: Record<string, unknown>;
  submitted_at: string;
}

// ─── Payloads ──────────────────────────────────────────────────────────────

export interface CreateProjectPayload {
  lead_id: string;
  project_type_id: string;
  name: string;
  description?: string;
  delivery_date: string;
}

export interface CreateStageDeliverablePayload {
  name: string;
  description: string;
}

export interface CreateStagePayload {
  delivery_date: string;
  deadline_date: string;
  name: string;
  description: string;
  position: number;
  consultant_id: string;
  deliverables: CreateStageDeliverablePayload[];
}

export interface UpdateStagePayload {
  name?: string;
  description?: string;
  delivery_date?: string;
  deadline_date?: string;
  position?: number;
  consultant_id?: string;
}

export interface CreateSubmissionFilePayload {
  deliverable_id: string;
  path: string;
  name: string;
}

export interface CreateSubmissionPayload {
  notes?: string;
  files: CreateSubmissionFilePayload[];
}

export interface CreateStageReviewPayload {
  approved: boolean;
  notes?: string;
  new_delivery_date?: string;
  deliverable_ids?: string[];
}

export interface CreateProjectReviewPayload {
  approved: boolean;
  notes: string;
}

export interface CreateFeedbackPayload {
  answers: Record<string, unknown>;
}
