import { supabase } from '@/lib/supabase';

export async function uploadMedia(
  file: File | Blob | { uri: string; type: string; name: string },
  bucket: string = 'streets-media'
): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // DEFENSIVE: Ensure bucket is a valid string, not file data
  const validBucket = typeof bucket === 'string' && bucket.length > 0 && bucket.length < 100
    ? bucket
    : 'streets-media';

  // Extract file extension
  let ext = 'jpg';
  const fileAny = file as any;
  if (fileAny.name) {
    const parts = fileAny.name.split('.');
    if (parts.length > 1) ext = parts.pop().toLowerCase();
  } else if (fileAny.type) {
    const mimeParts = fileAny.type.split('/');
    if (mimeParts.length === 2) ext = mimeParts[1];
  }

  // Generate unique filename
  const filename = `${user.user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;

  console.log('[uploadMedia] bucket:', validBucket, 'filename:', filename);

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(validBucket)
    .upload(filename, file as any, {
      cacheControl: '3600',
      upsert: false,
      contentType: fileAny.type || 'image/jpeg',
    });

  if (error) {
    console.error('[uploadMedia] upload error:', error);
    throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(validBucket)
    .getPublicUrl(data.path);

  console.log('[uploadMedia] publicUrl:', urlData.publicUrl);
  return urlData.publicUrl;
}
