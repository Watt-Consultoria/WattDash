/**
 * Reduz um nome completo a "primeiro e último nome" para exibição pública
 * (ex.: "Ana Beatriz da Silva Prado" → "Ana Prado").
 */
export function toShortHeroName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts[0]} ${parts[parts.length - 1]}`;
}
