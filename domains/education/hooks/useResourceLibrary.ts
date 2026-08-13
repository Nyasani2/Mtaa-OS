// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import {
  getResources, getResourceById, createResource, updateResource, deleteResource, logAccess, incrementViewCount,
  getCollections, getCollectionById, createCollection, updateCollection, deleteCollection,
  getResourceStats, getPopularResources,
  type Resource, type ResourceCollection, type CreateResourceInput, type CreateCollectionInput,
} from '@/domains/education/services/resourceLibraryService';

// ============================================
// useResourceLibrary — Browse/search resources
// ============================================
export function useResourceLibrary(filters?: { institution_id?: string; teacher_id?: string; class_id?: string; subject_id?: string; resource_type?: string; collection_id?: string; search?: string; tags?: string[] }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    const { data, error } = await getResources(filters || {});
    if (data) setResources(data);
    if (error) setError(error);
    setLoading(false);
  }, [filters?.institution_id, filters?.teacher_id, filters?.class_id, filters?.subject_id, filters?.resource_type, filters?.collection_id, filters?.search, filters?.tags?.join(',')]);

  const add = useCallback(async (input: CreateResourceInput) => {
    setCreating(true); setError('');
    const { data, error } = await createResource(input);
    if (data) setResources(prev => [data, ...prev]);
    if (error) setError(error);
    setCreating(false);
    return { data, error };
  }, []);

  const edit = useCallback(async (id: string, updates: Partial<CreateResourceInput>) => {
    setLoading(true); setError('');
    const { data, error } = await updateResource(id, updates);
    if (data) setResources(prev => prev.map((r: any) => r.id === id ? data : r));
    if (error) setError(error);
    setLoading(false);
    return { data, error };
  }, []);

  const remove = useCallback(async (id: string) => {
    setDeleting(true); setError('');
    const { success, error } = await deleteResource(id);
    if (success) setResources(prev => prev.filter((r: any) => r.id !== id));
    if (error) setError(error);
    setDeleting(false);
    return { success, error };
  }, []);

  const view = useCallback(async (id: string) => {
    await incrementViewCount(id);
    await logAccess(id, 'view');
  }, []);

  const download = useCallback(async (id: string) => {
    await logAccess(id, 'download');
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { resources, loading, error, creating, deleting, fetch, add, edit, remove, view, download };
}

// ============================================
// useResourceDetail — Single resource view
// ============================================
export function useResourceDetail(resourceId?: string) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetch = useCallback(async () => {
    if (!resourceId) return;
    setLoading(true); setError('');
    const { data, error } = await getResourceById(resourceId);
    if (data) setResource(data);
    if (error) setError(error);
    setLoading(false);
  }, [resourceId]);

  const view = useCallback(async () => {
    if (resourceId) {
      await incrementViewCount(resourceId);
      await logAccess(resourceId, 'view');
    }
  }, [resourceId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { resource, loading, error, fetch, view };
}

// ============================================
// useCollections — Collection management
// ============================================
export function useCollections(filters?: { institution_id?: string; teacher_id?: string; is_public?: boolean }) {
  const [collections, setCollections] = useState<ResourceCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    const { data, error } = await getCollections(filters || {});
    if (data) setCollections(data);
    if (error) setError(error);
    setLoading(false);
  }, [filters?.institution_id, filters?.teacher_id, filters?.is_public]);

  const add = useCallback(async (input: CreateCollectionInput) => {
    setCreating(true); setError('');
    const { data, error } = await createCollection(input);
    if (data) setCollections(prev => [data, ...prev]);
    if (error) setError(error);
    setCreating(false);
    return { data, error };
  }, []);

  const edit = useCallback(async (id: string, updates: Partial<CreateCollectionInput>) => {
    setLoading(true); setError('');
    const { data, error } = await updateCollection(id, updates);
    if (data) setCollections(prev => prev.map((c: any) => c.id === id ? data : c));
    if (error) setError(error);
    setLoading(false);
    return { data, error };
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true); setError('');
    const { success, error } = await deleteCollection(id);
    if (success) setCollections(prev => prev.filter((c: any) => c.id !== id));
    if (error) setError(error);
    setLoading(false);
    return { success, error };
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { collections, loading, error, creating, fetch, add, edit, remove };
}

// ============================================
// useCollectionDetail — Single collection + its resources
// ============================================
export function useCollectionDetail(collectionId?: string, institutionId?: string) {
  const [collection, setCollection] = useState<ResourceCollection | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetch = useCallback(async () => {
    if (!collectionId) return;
    setLoading(true); setError('');
    const [{ data: c, error: cErr }, { data: r, error: rErr }] = await Promise.all([
      getCollectionById(collectionId),
      getResources({ collection_id: collectionId, institution_id: institutionId }),
    ]);
    if (c) setCollection(c);
    if (r) setResources(r);
    setError(cErr || rErr);
    setLoading(false);
  }, [collectionId, institutionId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { collection, resources, loading, error, refresh: fetch };
}

// ============================================
// useResourceStats — Teacher analytics
// ============================================
export function useResourceStats(teacherId?: string) {
  const [stats, setStats] = useState<{ total_resources: number; total_views: number; total_downloads: number; top_type: string } | null>(null);
  const [popular, setPopular] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetch = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true); setError('');
    const { data: s, error: sErr } = await getResourceStats(teacherId);
    if (s) setStats(s);
    if (sErr) setError(sErr);
    setLoading(false);
  }, [teacherId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, popular, loading, error, refresh: fetch };
}
