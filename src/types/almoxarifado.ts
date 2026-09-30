/** Espelha `AlmoxarifadoMaterialResponseDto` da WattAPI. */
export interface AlmoxarifadoMaterial {
  id: string;
  nome: string;
  descricao: string;
  /** Unidades disponíveis agora (o backend debita/credita a cada empréstimo/devolução). */
  quantidade_estoque: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMaterialPayload {
  nome: string;
  descricao: string;
  quantidade_estoque: number;
  observacoes?: string;
}

export type UpdateMaterialPayload = Partial<CreateMaterialPayload>;

/** Espelha `AlmoxarifadoEmprestimoResponseDto` da WattAPI. */
export interface AlmoxarifadoLoan {
  id: string;
  material_id: string;
  quantidade: number;
  user_id: string;
  emprestado_em: string;
  previsao_devolucao: string;
  devolvido_em: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLoanPayload {
  material_id: string;
  quantidade: number;
  previsao_devolucao: string;
  observacoes?: string;
}

export interface ReturnLoanPayload {
  devolvido_em?: string;
  observacoes?: string;
}

export type LoanStatus = 'ativo' | 'atrasado' | 'devolvido';
