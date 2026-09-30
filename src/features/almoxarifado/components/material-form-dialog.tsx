'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { FieldDescription, FieldLabel } from '@/components/ui/field';
import { FormFieldSet, FormField, FormFieldError } from '@/components/ui/form-context';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { AlmoxarifadoRepository } from '@/repositories/almoxarifado.repository';
import { toUserMessage } from '@/lib/api-client';
import { materialSchema, type MaterialFormValues } from '../schemas/almoxarifado';
import { QuantityStepper } from './quantity-stepper';
import { ResponsiveModal, ResponsiveModalActions } from './responsive-modal';
import type {
  AlmoxarifadoMaterial,
  CreateMaterialPayload,
  UpdateMaterialPayload
} from '@/types/almoxarifado';

interface MaterialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando informado, o diálogo edita o material; caso contrário, cadastra um novo. */
  material?: AlmoxarifadoMaterial | null;
  /** Unidades deste material emprestadas no momento (apenas edição). */
  outstandingQuantity?: number;
}

function toFormValues(material?: AlmoxarifadoMaterial | null): MaterialFormValues {
  return {
    nome: material?.nome ?? '',
    descricao: material?.descricao ?? '',
    quantidade_estoque: material?.quantidade_estoque ?? 0,
    observacoes: material?.observacoes ?? ''
  };
}

function toCreatePayload(value: MaterialFormValues): CreateMaterialPayload {
  const observacoes = value.observacoes.trim();
  return {
    nome: value.nome.trim(),
    descricao: value.descricao.trim(),
    quantidade_estoque: value.quantidade_estoque,
    ...(observacoes && { observacoes })
  };
}

/** Apenas campos alterados. `observacoes` vazio não é enviado (a API exige `minLength: 1`). */
function toUpdatePayload(
  value: MaterialFormValues,
  material: AlmoxarifadoMaterial
): UpdateMaterialPayload {
  const next = toCreatePayload(value);
  return {
    ...(next.nome !== material.nome && { nome: next.nome }),
    ...(next.descricao !== material.descricao && { descricao: next.descricao }),
    ...(next.quantidade_estoque !== material.quantidade_estoque && {
      quantidade_estoque: next.quantidade_estoque
    }),
    ...(next.observacoes &&
      next.observacoes !== material.observacoes && {
        observacoes: next.observacoes
      })
  };
}

export function MaterialFormDialog({
  open,
  onOpenChange,
  material,
  outstandingQuantity = 0
}: MaterialFormDialogProps) {
  const isEdit = !!material;
  const createMutation = AlmoxarifadoRepository.useCreateMaterial();
  const updateMutation = AlmoxarifadoRepository.useUpdateMaterial();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const { FormTextField, FormTextareaField } = useFormFields<MaterialFormValues>();

  const callbacks = {
    onSuccess: () => {
      toast.success(isEdit ? 'Material atualizado' : 'Material cadastrado');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(toUserMessage(err))
  };

  const form = useAppForm({
    defaultValues: toFormValues(material),
    validators: { onSubmit: materialSchema },
    onSubmit: ({ value }) => {
      if (!material) {
        createMutation.mutate(toCreatePayload(value), callbacks);
        return;
      }
      const payload = toUpdatePayload(value, material);
      if (Object.keys(payload).length === 0) {
        onOpenChange(false);
        return;
      }
      updateMutation.mutate({ id: material.id, payload }, callbacks);
    }
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(material));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, material?.id]);

  function handleOpenChange(next: boolean) {
    if (!isPending) onOpenChange(next);
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      icon='package'
      title={isEdit ? 'Editar material' : 'Cadastrar material'}
      description={
        isEdit
          ? 'Atualize os dados ou ajuste o estoque disponível do material.'
          : 'Cadastre um novo material disponível para empréstimo.'
      }
    >
      <form.AppForm>
        <form.Form className='flex flex-col gap-6'>
          <FormTextField
            name='nome'
            label='Nome'
            required
            placeholder='Ex.: Furadeira'
            className='h-11 text-base md:h-9 md:text-sm'
          />
          <FormTextareaField
            name='descricao'
            label='Descrição'
            required
            rows={2}
            className='resize-none text-base md:text-sm'
          />

          <form.AppField name='quantidade_estoque'>
            {(field) => (
              <FormFieldSet>
                <FormField>
                  <FieldLabel htmlFor='material-stock'>Disponível em estoque *</FieldLabel>
                  <QuantityStepper
                    id='material-stock'
                    value={field.state.value}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    min={0}
                    isInvalid={field.state.meta.errors.length > 0}
                  />
                  {isEdit && outstandingQuantity > 0 ? (
                    <p className='flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'>
                      <Icons.warning className='mt-px size-3.5 shrink-0' aria-hidden />
                      {outstandingQuantity} unidade(s) emprestada(s) no momento. Não inclua essas
                      unidades no valor acima.
                    </p>
                  ) : (
                    <FieldDescription>Unidades disponíveis para empréstimo agora.</FieldDescription>
                  )}
                </FormField>
                <FormFieldError />
              </FormFieldSet>
            )}
          </form.AppField>

          <FormTextareaField
            name='observacoes'
            label='Observações (opcional)'
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
              {isEdit ? 'Salvar alterações' : 'Cadastrar'}
            </form.SubmitButton>
          </ResponsiveModalActions>
        </form.Form>
      </form.AppForm>
    </ResponsiveModal>
  );
}
