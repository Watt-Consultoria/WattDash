import * as z from 'zod';

export const materialSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório'),
  descricao: z.string().trim().min(1, 'Descrição é obrigatória'),
  quantidade_estoque: z
    .number({ message: 'Informe a quantidade' })
    .int('Use um número inteiro')
    .min(0, 'A quantidade não pode ser negativa'),
  observacoes: z.string()
});

export type MaterialFormValues = z.infer<typeof materialSchema>;

/**
 * O limite superior de `quantidade` depende do estoque do material selecionado e é
 * validado no próprio campo (`validators.onChangeListenTo: ['material_id']`).
 */
export function buildLoanSchema(today: string, maxDate: string) {
  return z.object({
    material_id: z.string().min(1, 'Selecione um material'),
    quantidade: z
      .number({ message: 'Informe a quantidade' })
      .int('Use um número inteiro')
      .min(1, 'Mínimo de 1 unidade'),
    previsao_devolucao: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de devolução')
      .refine((date) => date >= today, 'A devolução não pode ser no passado')
      .refine((date) => date <= maxDate, 'O prazo máximo de empréstimo é de 2 semanas'),
    observacoes: z.string()
  });
}

export type LoanFormValues = z.infer<ReturnType<typeof buildLoanSchema>>;
