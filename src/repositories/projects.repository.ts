import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import type {
  Project,
  ProjectStatus,
  ProjectStage,
  StageStatus,
  StageSubmission,
  StageReview,
  ProjectReview,
  ProjectFeedback,
  ProjectLookups,
  ProjectFeedbackStatus,
  CreateProjectPayload,
  CreateStagePayload,
  UpdateStagePayload,
  CreateSubmissionPayload,
  CreateStageReviewPayload,
  CreateProjectReviewPayload,
  CreateFeedbackPayload
} from '@/types/projects';

export interface ProjectFilters {
  status?: ProjectStatus;
  lead_id?: string;
  created_by?: string;
  consultant_id?: string;
}

export interface StageFilters {
  consultant_id?: string;
  status?: StageStatus;
}

export interface UpdateProjectStatusPayload {
  status: 'em_revisao' | 'finalizado';
  closing_notes?: string;
}

export const projectsKeys = {
  all: () => ['projects'] as const,
  list: (filters?: ProjectFilters) => ['projects', 'list', filters ?? {}] as const,
  lookups: () => ['projects', 'lookups'] as const,
  detail: (projectId: string) => ['projects', 'detail', projectId] as const,
  stages: (projectId: string, filters?: StageFilters) =>
    ['projects', 'detail', projectId, 'stages', filters ?? {}] as const,
  stageDetail: (projectId: string, stageId: string) =>
    ['projects', 'detail', projectId, 'stages', stageId] as const,
  submissions: (projectId: string, stageId: string) =>
    ['projects', 'detail', projectId, 'stages', stageId, 'submissions'] as const,
  submissionDetail: (projectId: string, stageId: string, submissionId: string) =>
    ['projects', 'detail', projectId, 'stages', stageId, 'submissions', submissionId] as const,
  stageReviews: (projectId: string, stageId: string) =>
    ['projects', 'detail', projectId, 'stages', stageId, 'reviews'] as const,
  projectReviews: (projectId: string) => ['projects', 'detail', projectId, 'reviews'] as const,
  feedback: (projectId: string) => ['projects', 'detail', projectId, 'feedback'] as const,
  feedbackStatus: () => ['projects', 'feedback-status'] as const
};

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

// ─── Projects ──────────────────────────────────────────────────────────────

async function getProjects(token: string, filters: ProjectFilters = {}): Promise<Project[]> {
  const qs = buildQuery({ ...filters });
  return apiGet<Project[]>(`/projects${qs}`, token);
}

export async function getProject(token: string, projectId: string): Promise<Project> {
  return apiGet<Project>(`/projects/${projectId}`, token);
}

async function getProjectLookups(token: string): Promise<ProjectLookups> {
  return apiGet<ProjectLookups>('/projects/lookups', token);
}

async function createProject(token: string, payload: CreateProjectPayload): Promise<Project> {
  return apiPost<Project>('/projects', token, payload);
}

async function updateProjectStatus(
  token: string,
  projectId: string,
  payload: UpdateProjectStatusPayload
): Promise<Project> {
  return apiPatch<Project>(`/projects/${projectId}`, token, payload);
}

function useProjects(filters: ProjectFilters = {}) {
  const token = useAccessToken();
  return useQuery({
    queryKey: projectsKeys.list(filters),
    queryFn: () => getProjects(token, filters),
    enabled: !!token
  });
}

function useProject(projectId: string | null) {
  const token = useAccessToken();
  return useQuery({
    queryKey: projectsKeys.detail(projectId ?? ''),
    queryFn: () => getProject(token, projectId!),
    enabled: !!token && !!projectId
  });
}

function useProjectLookups() {
  const token = useAccessToken();
  return useQuery({
    queryKey: projectsKeys.lookups(),
    queryFn: () => getProjectLookups(token),
    enabled: !!token
  });
}

function useCreateProject() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: projectsKeys.list() });
    }
  });
}

function useUpdateProjectStatus(projectId: string) {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProjectStatusPayload) =>
      updateProjectStatus(token, projectId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: projectsKeys.detail(projectId) });
      void qc.invalidateQueries({ queryKey: projectsKeys.list() });
    }
  });
}

// ─── Stages ────────────────────────────────────────────────────────────────

async function getStages(
  token: string,
  projectId: string,
  filters: StageFilters = {}
): Promise<ProjectStage[]> {
  const qs = buildQuery({ ...filters });
  return apiGet<ProjectStage[]>(`/projects/${projectId}/stages${qs}`, token);
}

async function getStage(token: string, projectId: string, stageId: string): Promise<ProjectStage> {
  return apiGet<ProjectStage>(`/projects/${projectId}/stages/${stageId}`, token);
}

async function createStage(
  token: string,
  projectId: string,
  payload: CreateStagePayload
): Promise<ProjectStage> {
  return apiPost<ProjectStage>(`/projects/${projectId}/stages`, token, payload);
}

async function updateStage(
  token: string,
  projectId: string,
  stageId: string,
  payload: UpdateStagePayload
): Promise<ProjectStage> {
  return apiPatch<ProjectStage>(`/projects/${projectId}/stages/${stageId}`, token, payload);
}

function useStages(projectId: string | null, filters: StageFilters = {}) {
  const token = useAccessToken();
  return useQuery({
    queryKey: projectsKeys.stages(projectId ?? '', filters),
    queryFn: () => getStages(token, projectId!, filters),
    enabled: !!token && !!projectId
  });
}

function useStage(projectId: string | null, stageId: string | null) {
  const token = useAccessToken();
  return useQuery({
    queryKey: projectsKeys.stageDetail(projectId ?? '', stageId ?? ''),
    queryFn: () => getStage(token, projectId!, stageId!),
    enabled: !!token && !!projectId && !!stageId
  });
}

function useCreateStage(projectId: string) {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStagePayload) => createStage(token, projectId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: projectsKeys.stages(projectId) });
    }
  });
}

function useUpdateStage(projectId: string) {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stageId, payload }: { stageId: string; payload: UpdateStagePayload }) =>
      updateStage(token, projectId, stageId, payload),
    onSuccess: (_data, { stageId }) => {
      void qc.invalidateQueries({ queryKey: projectsKeys.stages(projectId) });
      void qc.invalidateQueries({ queryKey: projectsKeys.stageDetail(projectId, stageId) });
    }
  });
}

// ─── Submissions ───────────────────────────────────────────────────────────

async function getSubmissions(
  token: string,
  projectId: string,
  stageId: string
): Promise<StageSubmission[]> {
  return apiGet<StageSubmission[]>(`/projects/${projectId}/stages/${stageId}/submissions`, token);
}

async function getSubmission(
  token: string,
  projectId: string,
  stageId: string,
  submissionId: string
): Promise<StageSubmission> {
  return apiGet<StageSubmission>(
    `/projects/${projectId}/stages/${stageId}/submissions/${submissionId}`,
    token
  );
}

async function createSubmission(
  token: string,
  projectId: string,
  stageId: string,
  payload: CreateSubmissionPayload
): Promise<StageSubmission> {
  return apiPost<StageSubmission>(
    `/projects/${projectId}/stages/${stageId}/submissions`,
    token,
    payload
  );
}

function useSubmissions(projectId: string | null, stageId: string | null) {
  const token = useAccessToken();
  return useQuery({
    queryKey: projectsKeys.submissions(projectId ?? '', stageId ?? ''),
    queryFn: () => getSubmissions(token, projectId!, stageId!),
    enabled: !!token && !!projectId && !!stageId
  });
}

function useSubmission(
  projectId: string | null,
  stageId: string | null,
  submissionId: string | null
) {
  const token = useAccessToken();
  return useQuery({
    queryKey: projectsKeys.submissionDetail(projectId ?? '', stageId ?? '', submissionId ?? ''),
    queryFn: () => getSubmission(token, projectId!, stageId!, submissionId!),
    enabled: !!token && !!projectId && !!stageId && !!submissionId
  });
}

function useCreateSubmission(projectId: string, stageId: string) {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubmissionPayload) =>
      createSubmission(token, projectId, stageId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: projectsKeys.submissions(projectId, stageId) });
      void qc.invalidateQueries({ queryKey: projectsKeys.stageDetail(projectId, stageId) });
      void qc.invalidateQueries({ queryKey: projectsKeys.stages(projectId) });
    }
  });
}

// ─── Stage Reviews ─────────────────────────────────────────────────────────

async function getStageReviews(
  token: string,
  projectId: string,
  stageId: string
): Promise<StageReview[]> {
  return apiGet<StageReview[]>(`/projects/${projectId}/stages/${stageId}/reviews`, token);
}

async function createStageReview(
  token: string,
  projectId: string,
  stageId: string,
  payload: CreateStageReviewPayload
): Promise<StageReview> {
  return apiPost<StageReview>(`/projects/${projectId}/stages/${stageId}/reviews`, token, payload);
}

function useStageReviews(projectId: string | null, stageId: string | null) {
  const token = useAccessToken();
  return useQuery({
    queryKey: projectsKeys.stageReviews(projectId ?? '', stageId ?? ''),
    queryFn: () => getStageReviews(token, projectId!, stageId!),
    enabled: !!token && !!projectId && !!stageId
  });
}

function useCreateStageReview(projectId: string, stageId: string) {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStageReviewPayload) =>
      createStageReview(token, projectId, stageId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: projectsKeys.stageDetail(projectId, stageId) });
      void qc.invalidateQueries({ queryKey: projectsKeys.stages(projectId) });
      void qc.invalidateQueries({ queryKey: projectsKeys.submissions(projectId, stageId) });
      void qc.invalidateQueries({ queryKey: projectsKeys.stageReviews(projectId, stageId) });
    }
  });
}

// ─── Project Reviews ───────────────────────────────────────────────────────

async function getProjectReviews(token: string, projectId: string): Promise<ProjectReview[]> {
  return apiGet<ProjectReview[]>(`/projects/${projectId}/reviews`, token);
}

async function updateProjectReview(
  token: string,
  projectId: string,
  payload: CreateProjectReviewPayload
): Promise<ProjectReview> {
  return apiPatch<ProjectReview>(`/projects/${projectId}/reviews`, token, payload);
}

function useProjectReviews(projectId: string | null) {
  const token = useAccessToken();
  return useQuery({
    queryKey: projectsKeys.projectReviews(projectId ?? ''),
    queryFn: () => getProjectReviews(token, projectId!),
    enabled: !!token && !!projectId
  });
}

function useUpdateProjectReview(projectId: string) {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectReviewPayload) =>
      updateProjectReview(token, projectId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: projectsKeys.detail(projectId) });
      void qc.invalidateQueries({ queryKey: projectsKeys.projectReviews(projectId) });
    }
  });
}

// ─── Feedback ──────────────────────────────────────────────────────────────

async function getFeedback(token: string, projectId: string): Promise<ProjectFeedback[]> {
  return apiGet<ProjectFeedback[]>(`/projects/${projectId}/feedback`, token);
}

async function createFeedback(
  token: string,
  projectId: string,
  payload: CreateFeedbackPayload
): Promise<ProjectFeedback> {
  return apiPost<ProjectFeedback>(`/projects/${projectId}/feedback`, token, payload);
}

/** Restrito a `role: 'consultor'` — projetos finalizados com feedback pendente do consultor autenticado. */
async function getFeedbackStatus(token: string): Promise<ProjectFeedbackStatus> {
  return apiGet<ProjectFeedbackStatus>('/projects/feedback-status', token);
}

function useFeedback(projectId: string | null, enabled: boolean) {
  const token = useAccessToken();
  return useQuery({
    queryKey: projectsKeys.feedback(projectId ?? ''),
    queryFn: () => getFeedback(token, projectId!),
    enabled: !!token && !!projectId && enabled
  });
}

function useFeedbackStatus(enabled: boolean) {
  const token = useAccessToken();
  return useQuery({
    queryKey: projectsKeys.feedbackStatus(),
    queryFn: () => getFeedbackStatus(token),
    enabled: !!token && enabled
  });
}

function useCreateFeedback(projectId: string) {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFeedbackPayload) => createFeedback(token, projectId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: projectsKeys.feedback(projectId) });
      void qc.invalidateQueries({ queryKey: projectsKeys.feedbackStatus() });
    }
  });
}

export const ProjectsRepository = {
  keys: projectsKeys,
  useProjects,
  useProject,
  useProjectLookups,
  useCreateProject,
  useUpdateProjectStatus,
  useStages,
  useStage,
  useCreateStage,
  useUpdateStage,
  useSubmissions,
  useSubmission,
  useCreateSubmission,
  useStageReviews,
  useCreateStageReview,
  useProjectReviews,
  useUpdateProjectReview,
  useFeedback,
  useFeedbackStatus,
  useCreateFeedback
};
