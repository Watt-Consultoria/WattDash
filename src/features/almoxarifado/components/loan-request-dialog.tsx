'use client';

import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { FieldDescription, FieldLabel } from '@/components/ui/field';
import { FormFieldSet, FormField, FormFieldError } from '@/components/ui/form-context';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { DateField } from '@/components/date-field';
import { AlmoxarifadoRepository } from '@/repositories/almoxarifado.repository';
import { ApiError, toUserMessage } from '@/lib/api-client';
import { buildLoanSchema, type LoanFormValues } from '../schemas/almoxarifado';
import {
  MAX_LOAN_DAYS,
  addDaysLocalISODate,
  endOfLocalDayISO,
  formatDateTimeBR,
  todayLocalISODate
} from '../lib/loan-status';
import { FilterChip, FilterChipGroup } from './filter-chips';
import { QuantityStepper } from './quantity-stepper';
import { ResponsiveModal, ResponsiveModalActions } from './responsive-modal';
import { EmptyState } from './section-state';
import type { AlmoxarifadoMaterial, CreateLoanPayload } from '@/types/almoxarifado';

const DUE_DATE_SHORTCUTS = [
  { label: 'Amanhã', days: 1 },
  { label: '3 dias', days: 3 },
  { label: '1 semana', days: 7 },
  { label: '2 semanas', days: MAX_LOAN_DAYS }
];

interface LoanRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: AlmoxarifadoMaterial[];
  /** Material pré-selecionado (ex.: botão "Pegar emprestado" de um card). */
  initialMaterialId?: string | null;
}

function toPayload(value: LoanFormValues): CreateLoanPayload {
  const observacoes = value.observacoes.trim();
  return {
    material_id: value.material_id,
    quantidade: value.quantidade,
    previsao_devolucao: endOfLocalDayISO(value.previsao_devolucao),
    ...(observacoes && { observacoes })
  };
}

export function LoanRequestDialog({
  open,
  onOpenChange,
  materials,
  initialMaterialId
}: LoanRequestDialogProps) {
  const qc = useQueryClient();
  const createMutation = AlmoxarifadoRepository.useCreateLoan();
  const isPending = createMutation.isPending;
  const { FormSelectField, FormTextareaField } = useFormFields<LoanFormValues>();

  const today = todayLocalISODate();
  const maxDate = addDaysLocalISODate(MAX_LOAN_DAYS);
  const schema = useMemo(() => buildLoanSchema(today, maxDate), [today, maxDate]);
  const available = useMemo(
    () => materials.filter((material) => material.quantidade_estoque > 0),
    [materials]
  );
  const stockById = useMemo(
    () => new Map(materials.map((material) => [material.id, material.quantidade_estoque])),
    [materials]
  );
  const options = available.map((material) => ({
    value: material.id,
    label: `${material.nome} (${material.quantidade_estoque} disp.)`
  }));

  const defaultValues: LoanFormValues = {
    material_id: initialMaterialId ?? '',
    quantidade: 1,
    previsao_devolucao: '',
    observacoes: ''
  };

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => {
      createMutation.mutate(toPayload(value), {
        onSuccess: () => {
          toast.success('Empréstimo registrado');
          onOpenChange(false);
        },
        onError: (err: Error) => {
          toast.error(toUserMessage(err));
          // Estoque exibido pode estar defasado (ex.: "Estoque insuficiente").
          if (err instanceof ApiError && err.status === 400) {
            AlmoxarifadoRepository.invalidateAll(qc);
          }
        }
      });
    }
  });

  const selectedMaterialId = useStore(form.store, (state) => state.values.material_id);
  const selectedStock = stockById.get(selectedMaterialId);

  useEffect(() => {
    if (open) form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMaterialId]);

  function handleOpenChange(next: boolean) {
    if (!isPending) onOpenChange(next);
  }

  function quantityError(value: number, materialId: string): string | undefined {
    const stock = stockById.get(materialId);
    if (stock !== undefined && value > stock) {
      return `Apenas ${stock} unidade(s) disponível(is)`;
    }
    return undefined;
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      icon='package'
      title='Pegar material emprestado'
      description='O empréstimo fica no seu nome. Avisaremos se a devolução atrasar.'
    >
      {available.length === 0 ? (
        <div className='pb-4'>
          <EmptyState
            icon='package'
            title='Nada disponível agora'
            description='Nenhum material tem estoque no momento. Tente novamente mais tarde.'
          />
        </div>
      ) : (
        <form.AppForm>
          <form.Form className='flex flex-col gap-6'>
            <FormSelectField
              name='material_id'
              label='Material'
              required
              placeholder='Selecione um material'
              options={options}
            />

            <form.AppField
              name='quantidade'
              validators={{
                onChange: ({ value, fieldApi }) =>
                  quantityError(value, fieldApi.form.getFieldValue('material_id')),
                onSubmit: ({ value, fieldApi }) =>
                  quantityError(value, fieldApi.form.getFieldValue('material_id')),
                onChangeListenTo: ['material_id']
              }}
            >
              {(field) => (
                <FormFieldSet>
                  <FormField>
                    <FieldLabel htmlFor='loan-quantity'>Quantidade *</FieldLabel>
                    <QuantityStepper
                      id='loan-quantity'
                      value={field.state.value}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                      min={1}
                      max={selectedStock}
                      isInvalid={field.state.meta.errors.length > 0}
                    />
                  </FormField>
                  <FormFieldError />
                </FormFieldSet>
              )}
            </form.AppField>

            <form.AppField
              name='previsao_devolucao'
              validators={{
                onChange: ({ value }) =>
                  value && value > maxDate
                    ? 'O prazo máximo de empréstimo é de 2 semanas'
                    : undefined
              }}
            >
              {(field) => (
                <FormFieldSet>
                  <FormField>
                    <FieldLabel htmlFor='loan-return-date'>Devolver até *</FieldLabel>
                    <FilterChipGroup label='Atalhos de data de devolução'>
                      {DUE_DATE_SHORTCUTS.map(({ label, days }) => {
                        const date = addDaysLocalISODate(days);
                        return (
                          <FilterChip
                            key={days}
                            selected={field.state.value === date}
                            onClick={() => field.handleChange(date)}
                          >
                            {label}
                          </FilterChip>
                        );
                      })}
                    </FilterChipGroup>
                    <DateField
                      id='loan-return-date'
                      value={field.state.value}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                      placeholder='Ou escolha no calendário'
                      minDate={today}
                      maxDate={maxDate}
                      className='h-11 md:h-9 md:w-[240px]'
                    />
                    <FieldDescription>
                      Prazo máximo de 2 semanas (até {formatDateTimeBR(endOfLocalDayISO(maxDate))}).
                    </FieldDescription>
                  </FormField>
                  <FormFieldError />
                </FormFieldSet>
              )}
            </form.AppField>

            <FormTextareaField
              name='observacoes'
              label='Observações (opcional)'
              placeholder='Ex.: Para uso no projeto X'
              rows={2}
              className='resize-none text-base md:text-sm'
            />

            <ResponsiveModalActions>
              <Button
                type='button'
                variant='outline'
                disabled={isPending}
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <form.SubmitButton disabled={isPending}>
                {isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
                Confirmar empréstimo
              </form.SubmitButton>
            </ResponsiveModalActions>
          </form.Form>
        </form.AppForm>
      )}
    </ResponsiveModal>
  );
}
