'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toUserMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { FilterChip, FilterChipGroup } from './filter-chips';
import { MaterialCard } from './material-card';
import { SearchInput } from './search-input';
import { EmptyState, MaterialsSkeleton, SectionError } from './section-state';
import type { AlmoxarifadoMaterial } from '@/types/almoxarifado';

interface MaterialsCatalogProps {
  materials: AlmoxarifadoMaterial[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  canManage: boolean;
  onRequestLoan: (materialId: string) => void;
  onCreate: () => void;
  onEdit: (material: AlmoxarifadoMaterial) => void;
}

function matches(material: AlmoxarifadoMaterial, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return material.nome.toLowerCase().includes(q) || material.descricao.toLowerCase().includes(q);
}

export function MaterialsCatalog({
  materials,
  isLoading,
  error,
  onRetry,
  canManage,
  onRequestLoan,
  onCreate,
  onEdit
}: MaterialsCatalogProps) {
  const [query, setQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const availableCount = useMemo(
    () => materials.filter((m) => m.quantidade_estoque > 0).length,
    [materials]
  );
  const filtered = useMemo(
    () =>
      materials.filter((m) => matches(m, query) && (!onlyAvailable || m.quantidade_estoque > 0)),
    [materials, query, onlyAvailable]
  );
  const isFiltering = query.trim() !== '' || onlyAvailable;

  function clearFilters() {
    setQuery('');
    setOnlyAvailable(false);
  }

  function renderContent() {
    if (isLoading) return <MaterialsSkeleton />;
    if (error) return <SectionError message={toUserMessage(error)} onRetry={onRetry} />;
    if (materials.length === 0) {
      return (
        <EmptyState
          icon='package'
          title='Nenhum material cadastrado'
          description={
            canManage
              ? 'Cadastre o primeiro material para liberar os empréstimos.'
              : 'Assim que a gestão cadastrar materiais, eles aparecerão aqui.'
          }
          action={canManage ? { label: 'Cadastrar material', onClick: onCreate } : undefined}
        />
      );
    }
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon='search'
          title='Nenhum material encontrado'
          description='Tente outro termo ou remova os filtros.'
          action={{ label: 'Limpar filtros', onClick: clearFilters }}
        />
      );
    }
    return (
      <ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {filtered.map((material) => (
          <li key={material.id}>
            <MaterialCard
              material={material}
              canManage={canManage}
              onRequestLoan={onRequestLoan}
              onEdit={onEdit}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className={cn('space-y-4', canManage && 'pb-20 md:pb-0')}>
      <div className='flex flex-col gap-3 md:flex-row md:items-center'>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder='Buscar material'
          className='md:w-80'
        />
        <FilterChipGroup label='Filtrar materiais' className='md:flex-1'>
          <FilterChip
            selected={onlyAvailable}
            onClick={() => setOnlyAvailable((prev) => !prev)}
            count={availableCount}
          >
            Disponíveis
          </FilterChip>
        </FilterChipGroup>
        {canManage && (
          <Button className='hidden md:inline-flex' onClick={onCreate}>
            <Icons.add className='mr-1.5 size-4' />
            Cadastrar material
          </Button>
        )}
      </div>

      {isFiltering && !isLoading && materials.length > 0 && (
        <p className='text-muted-foreground text-xs' aria-live='polite'>
          {filtered.length} de {materials.length} materiais
        </p>
      )}

      {renderContent()}

      {canManage && (
        <Button
          size='icon'
          className='fixed right-4 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-lg md:hidden'
          onClick={onCreate}
          aria-label='Cadastrar material'
        >
          <Icons.add className='size-6' />
        </Button>
      )}
    </section>
  );
}
