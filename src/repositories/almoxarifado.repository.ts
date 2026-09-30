import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { getAlmoxarifadoCapabilities } from '@/features/almoxarifado/lib/permissions';
import type {
  AlmoxarifadoMaterial,
  AlmoxarifadoLoan,
  CreateMaterialPayload,
  UpdateMaterialPayload,
  CreateLoanPayload,
  ReturnLoanPayload
} from '@/types/almoxarifado';

export const almoxarifadoKeys = {
  all: () => ['almoxarifado'] as const,
  materials: () => ['almoxarifado', 'materials'] as const,
  loans: () => ['almoxarifado', 'loans'] as const
};

async function getMaterials(token: string): Promise<AlmoxarifadoMaterial[]> {
  return apiGet<AlmoxarifadoMaterial[]>('/almoxarifado/material', token);
}

async function createMaterial(
  token: string,
  payload: CreateMaterialPayload
): Promise<AlmoxarifadoMaterial> {
  return apiPost<AlmoxarifadoMaterial>('/almoxarifado/material', token, payload);
}

async function updateMaterial(
  token: string,
  id: string,
  payload: UpdateMaterialPayload
): Promise<AlmoxarifadoMaterial> {
  return apiPatch<AlmoxarifadoMaterial>(`/almoxarifado/material/${id}`, token, payload);
}

async function getLoans(token: string): Promise<AlmoxarifadoLoan[]> {
  return apiGet<AlmoxarifadoLoan[]>('/almoxarifado/emprestimos', token);
}

async function createLoan(token: string, payload: CreateLoanPayload): Promise<AlmoxarifadoLoan> {
  return apiPost<AlmoxarifadoLoan>('/almoxarifado/emprestimos', token, payload);
}

async function returnLoan(
  token: string,
  id: string,
  payload: ReturnLoanPayload
): Promise<AlmoxarifadoLoan> {
  return apiPatch<AlmoxarifadoLoan>(`/almoxarifado/emprestimos/${id}`, token, payload);
}

/** Empréstimos e materiais se afetam mutuamente (estoque e nome exibido). */
function invalidateAll(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: almoxarifadoKeys.all() });
}

function useMaterials() {
  const token = useAccessToken();
  return useQuery({
    queryKey: almoxarifadoKeys.materials(),
    queryFn: () => getMaterials(token),
    enabled: !!token
  });
}

function useCreateMaterial() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaterialPayload) => createMaterial(token, payload),
    onSuccess: () => invalidateAll(qc)
  });
}

function useUpdateMaterial() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMaterialPayload }) =>
      updateMaterial(token, id, payload),
    onSuccess: () => invalidateAll(qc)
  });
}

/**
 * Empréstimos do usuário logado. `GET /almoxarifado/emprestimos` não aplica escopo
 * por usuário no backend — o filtro é feito aqui para que componentes de consultor
 * nunca recebam empréstimos de terceiros.
 */
function useMyLoans() {
  const token = useAccessToken();
  const { profile } = useUserProfile();
  const userId = profile?.id;
  return useQuery({
    queryKey: almoxarifadoKeys.loans(),
    queryFn: () => getLoans(token),
    enabled: !!token && !!userId,
    select: (loans) => loans.filter((loan) => loan.user_id === userId)
  });
}

const NO_LOANS: AlmoxarifadoLoan[] = [];

/**
 * Todos os empréstimos — apenas para gestão (`gerente`/`diretor`/`assessor`/`presidente`).
 * Compartilha a query key com `useMyLoans`, então `enabled: false` não basta: o cache
 * já populado seria lido mesmo assim. O `select` garante lista vazia para quem não é gestão.
 */
function useAllLoans() {
  const token = useAccessToken();
  const { profile } = useUserProfile();
  const { canViewAllLoans } = getAlmoxarifadoCapabilities(profile);
  return useQuery({
    queryKey: almoxarifadoKeys.loans(),
    queryFn: () => getLoans(token),
    enabled: !!token && canViewAllLoans,
    select: (loans) => (canViewAllLoans ? loans : NO_LOANS)
  });
}

function useCreateLoan() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLoanPayload) => createLoan(token, payload),
    onSuccess: () => invalidateAll(qc)
  });
}

function useReturnLoan() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReturnLoanPayload }) =>
      returnLoan(token, id, payload),
    onSuccess: () => invalidateAll(qc)
  });
}

export const AlmoxarifadoRepository = {
  keys: almoxarifadoKeys,
  invalidateAll,
  useMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  useMyLoans,
  useAllLoans,
  useCreateLoan,
  useReturnLoan
};
