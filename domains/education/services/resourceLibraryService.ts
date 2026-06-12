import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Types
export interface Resource {
  id: string;
  institution_id: string;
  teacher_id: string | null;
  class_id: string | null;
  subject_id: string | null;
  title: string;
  description: string | null;
  resource_type: 'document' | 'video' | 'audio' | 'image' | 'link' | 'lesson_plan' | 'worksheet' | 'presentation' | 'code' | 'book' | 'article';
  file_url: string | null;
  file_size_bytes: number | null;
  file_mime_type: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  tags: string[];
  language: string;
  grade_level: number | null;
  is_public: boolean;
  download_count: number;
  view_count: number;
  license_type: string;
  collection_id: string | null;
  metadata: Record<string, unknown>;
  status: 'active' | 'archived' | 'pending_review' | 'rejected';
  created_at: string;
  updated_at: string;
  // Joined
  teacher?: { id: string; full_name: string } | null;
  class?: { id: string; name: string } | null;
  subject?: { id: string; name: string } | null;
  collection?: { id: string; name: string } | null;
}

export interface ResourceCollection {
  id: string;
  institution_id: string;
  teacher_id: string | null;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  resource_count: number;
  tags: string[];
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  // Joined
  teacher?: { id: string; full_name: string } | null;
}

export interface ResourceAccessLog {
  id: string;
  resource_id: string;
  user_id: string | null;
  user_type: string | null;
  action: 'view' | 'download' | 'share' | 'bookmark';
  device_info: string | null;
  ip_address: string | null;
  created_at: string;
  // Joined
  resource?: { id: string; title: string } | null;
}

export interface CreateResourceInput {
  institution_id: string;
  teacher_id?: string;
  class_id?: string;
  subject_id?: string;
  title: string;
  description?: string;
  resource_type: string;
  file_url?: string;
  file_size_bytes?: number;
  file_mime_type?: string;
  external_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  language?: string;
  grade_level?: number;
  is_public?: boolean;
  license_type?: string;
  collection_id?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateCollectionInput {
  institution_id: string;
  teacher_id?: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  is_public?: boolean;
  tags?: string[];
}

// Error helper
const handleError = (error: PostgrestError | null): string => {
  if (!error) return '';
  if (error.code === '42501') return 'Permission denied.';
  return error.message;
};

// ============================================
// RESOURCES
// ============================================

export const getResources = async (filters: { institution_id?: string; teacher_id?: string; class_id?: string; subject_id?: string; resource_type?: string; collection_id?: string; search?: string; tags?: string[] }): Promise<{ data: Resource[] | null; error: string }> => {
  let query = supabase
    .from('education_resources')
    .select('*, teacher:education_teachers(id, full_name), class:education_classes_v2(id, name), subject:education_subjects(id, name), collection:education_resource_collections(id, name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (filters.institution_id) query = query.eq('institution_id', filters.institution_id);
  if (filters.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
  if (filters.class_id) query = query.eq('class_id', filters.class_id);
  if (filters.subject_id) query = query.eq('subject_id', filters.subject_id);
  if (filters.resource_type) query = query.eq('resource_type', filters.resource_type);
  if (filters.collection_id) query = query.eq('collection_id', filters.collection_id);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);
  if (filters.tags && filters.tags.length > 0) query = query.contains('tags', filters.tags);

  const { data, error } = await query;
  return { data: data as Resource[] | null, error: handleError(error) };
};

export const getResourceById = async (id: string): Promise<{ data: Resource | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_resources')
    .select('*, teacher:education_teachers(id, full_name), class:education_classes_v2(id, name), subject:education_subjects(id, name), collection:education_resource_collections(id, name)')
    .eq('id', id)
    .single();
  return { data: data as Resource | null, error: handleError(error) };
};

export const createResource = async (input: CreateResourceInput): Promise<{ data: Resource | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_resources')
    .insert({
      institution_id: input.institution_id,
      teacher_id: input.teacher_id || null,
      class_id: input.class_id || null,
      subject_id: input.subject_id || null,
      title: input.title,
      description: input.description || null,
      resource_type: input.resource_type,
      file_url: input.file_url || null,
      file_size_bytes: input.file_size_bytes || null,
      file_mime_type: input.file_mime_type || null,
      external_url: input.external_url || null,
      thumbnail_url: input.thumbnail_url || null,
      tags: input.tags || [],
      language: input.language || 'en',
      grade_level: input.grade_level || null,
      is_public: input.is_public ?? false,
      license_type: input.license_type || 'standard',
      collection_id: input.collection_id || null,
      metadata: input.metadata || {},
    })
    .select()
    .single();
  return { data: data as Resource | null, error: handleError(error) };
};

export const updateResource = async (id: string, updates: Partial<CreateResourceInput>): Promise<{ data: Resource | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_resources')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data: data as Resource | null, error: handleError(error) };
};

export const deleteResource = async (id: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.from('education_resources').delete().eq('id', id);
  return { success: !error, error: handleError(error) };
};

export const incrementViewCount = async (id: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.rpc('increment_resource_view', { resource_id: id });
  if (error) {
    // Fallback: direct update
    const { error: updErr } = await supabase.from('education_resources').update({ view_count: supabase.rpc('get_view_count', { rid: id }) }).eq('id', id);
    return { success: !updErr, error: handleError(updErr) };
  }
  return { success: true, error: '' };
};

export const logAccess = async (resourceId: string, action: 'view' | 'download' | 'share' | 'bookmark', userType?: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase
    .from('education_resource_access_logs')
    .insert({ resource_id: resourceId, action, user_type: userType || null });
  return { success: !error, error: handleError(error) };
};

// ============================================
// COLLECTIONS
// ============================================

export const getCollections = async (filters: { institution_id?: string; teacher_id?: string; is_public?: boolean }): Promise<{ data: ResourceCollection[] | null; error: string }> => {
  let query = supabase
    .from('education_resource_collections')
    .select('*, teacher:education_teachers(id, full_name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (filters.institution_id) query = query.eq('institution_id', filters.institution_id);
  if (filters.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
  if (filters.is_public !== undefined) query = query.eq('is_public', filters.is_public);

  const { data, error } = await query;
  return { data: data as ResourceCollection[] | null, error: handleError(error) };
};

export const getCollectionById = async (id: string): Promise<{ data: ResourceCollection | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_resource_collections')
    .select('*, teacher:education_teachers(id, full_name)')
    .eq('id', id)
    .single();
  return { data: data as ResourceCollection | null, error: handleError(error) };
};

export const createCollection = async (input: CreateCollectionInput): Promise<{ data: ResourceCollection | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_resource_collections')
    .insert({
      institution_id: input.institution_id,
      teacher_id: input.teacher_id || null,
      name: input.name,
      description: input.description || null,
      cover_image_url: input.cover_image_url || null,
      is_public: input.is_public ?? false,
      tags: input.tags || [],
    })
    .select()
    .single();
  return { data: data as ResourceCollection | null, error: handleError(error) };
};

export const updateCollection = async (id: string, updates: Partial<CreateCollectionInput>): Promise<{ data: ResourceCollection | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_resource_collections')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data: data as ResourceCollection | null, error: handleError(error) };
};

export const deleteCollection = async (id: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.from('education_resource_collections').delete().eq('id', id);
  return { success: !error, error: handleError(error) };
};

// ============================================
// STATS
// ============================================

export const getResourceStats = async (teacherId: string): Promise<{ data: { total_resources: number; total_views: number; total_downloads: number; top_type: string } | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_resources')
    .select('resource_type, view_count, download_count')
    .eq('teacher_id', teacherId)
    .eq('status', 'active');

  if (error) return { data: null, error: handleError(error) };

  const resources = data || [];
  const typeCount: Record<string, number> = {};
  resources.forEach(r => { typeCount[r.resource_type] = (typeCount[r.resource_type] || 0) + 1; });
  const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

  return {
    data: {
      total_resources: resources.length,
      total_views: resources.reduce((sum, r) => sum + (r.view_count || 0), 0),
      total_downloads: resources.reduce((sum, r) => sum + (r.download_count || 0), 0),
      top_type: topType,
    },
    error: '',
  };
};

export const getPopularResources = async (institutionId: string, limit: number = 10): Promise<{ data: Resource[] | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_resources')
    .select('*, teacher:education_teachers(id, full_name)')
    .eq('institution_id', institutionId)
    .eq('status', 'active')
    .order('view_count', { ascending: false })
    .limit(limit);
  return { data: data as Resource[] | null, error: handleError(error) };
};
