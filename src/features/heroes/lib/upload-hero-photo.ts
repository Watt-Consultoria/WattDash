import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'hero-photos';

function sanitizeFilename(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[^\w.-]/g, '_');
}

export async function uploadHeroPhoto(
  file: File,
  userId: string,
  supabase: SupabaseClient
): Promise<string> {
  const folder = crypto.randomUUID();
  const safeName = sanitizeFilename(file.name);
  const path = `heroes/${userId}/${folder}/${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw new Error(`Falha ao enviar a foto: ${error.message}`);
  return path;
}
