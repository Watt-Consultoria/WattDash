import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGetPublic, apiPost, apiPatch } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import type { Hero, CreateHeroPayload, UpdateHeroPayload } from '@/types/api';

const THIRTY_MINUTES = 30 * 60 * 1000;

export const heroesKeys = {
  all: () => ['heroes'] as const
};

async function getAll(): Promise<Hero[]> {
  return apiGetPublic<Hero[]>('/heroes');
}

async function create(token: string, payload: CreateHeroPayload): Promise<Hero> {
  return apiPost<Hero>('/heroes', token, payload);
}

async function update(token: string, id: string, payload: UpdateHeroPayload): Promise<Hero> {
  return apiPatch<Hero>(`/heroes/${id}`, token, payload);
}

/**
 * Lista pública de heróis. `photo_url` é uma signed URL com validade de 1h —
 * refetch periódico mantém as fotos válidas em sessões longas (ex.: a página
 * pública /herois ficando aberta em segundo plano).
 */
function useHeroes() {
  return useQuery({
    queryKey: heroesKeys.all(),
    queryFn: getAll,
    refetchInterval: THIRTY_MINUTES
  });
}

function useCreateHero() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHeroPayload) => create(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: heroesKeys.all() });
    }
  });
}

function useUpdateHero() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateHeroPayload }) =>
      update(token, id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: heroesKeys.all() });
    }
  });
}

export const HeroesRepository = {
  keys: heroesKeys,
  useHeroes,
  useCreateHero,
  useUpdateHero
};
