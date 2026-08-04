// Perguntas do feedback pós-fechamento de projeto — ver `feedback.md`.
// Compartilhado entre o formulário (`project-feedback-form.tsx`) e a visão
// consolidada (`project-feedback-list.tsx`) para manter chaves e rótulos em sincronia.

export const FEEDBACK_KEYS = {
  difficulty: 'maior_dificuldade',
  difficultyOther: 'maior_dificuldade_comentario',
  observations: 'observacoes'
} as const;

export const DIFFICULTY_OPTIONS: { value: string; label: string }[] = [
  { value: 'dificuldades_tecnicas', label: 'Dificuldades técnicas do próprio projeto' },
  { value: 'falta_comunicacao_grupo', label: 'Falta de comunicação entre os membros do grupo' },
  {
    value: 'falta_comunicacao_gerentes',
    label: 'Falta de comunicação com os gerentes responsáveis'
  },
  {
    value: 'falta_informacao_cliente',
    label: 'Falta de informação sobre as expectativas do cliente'
  },
  { value: 'baixa_qualificacao_grupo', label: 'Baixa qualificação do grupo' },
  { value: 'sem_dificuldade', label: 'Não houve dificuldade' },
  { value: 'outro', label: 'Outro' }
];

export function getDifficultyLabel(value: string): string {
  return DIFFICULTY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export interface RatingQuestion {
  key: string;
  label: string;
}

export const RATING_QUESTIONS: RatingQuestion[] = [
  { key: 'nota_esforco_grupo', label: 'Esforço e proatividade do seu grupo' },
  { key: 'nota_esforco_proprio', label: 'Seu esforço e proatividade' },
  { key: 'nota_capacitacoes', label: 'Capacitações sobre os maiores desafios do projeto' },
  { key: 'nota_comunicacao_grupo', label: 'Comunicação entre o grupo' },
  { key: 'nota_comunicacao_gerente', label: 'Comunicação com o gerente responsável' }
];
