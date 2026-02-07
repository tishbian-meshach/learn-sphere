import { createClient } from './client';

export async function uploadFile(file: File, path: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.storage
    .from('LearnSphere')
    .upload(path, file, {
      upsert: true,
      cacheControl: '3600'
    });

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('LearnSphere')
    .getPublicUrl(data.path);

  return publicUrl;
}
