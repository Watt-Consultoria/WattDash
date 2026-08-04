import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'project-stage-files';

export interface UploadedStageFile {
  path: string;
  name: string;
}

function sanitizeFilename(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[^\w.-]/g, '_');
}

export async function uploadStageFile(
  file: File,
  consultantId: string,
  supabase: SupabaseClient
): Promise<UploadedStageFile> {
  const folder = crypto.randomUUID();
  const safeName = sanitizeFilename(file.name);
  const path = `stage-files/${consultantId}/${folder}/${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw new Error(`Falha ao enviar "${file.name}": ${error.message}`);
  return { path, name: file.name };
}
