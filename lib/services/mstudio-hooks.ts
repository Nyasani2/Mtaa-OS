// mstudio-hooks.ts — MTAA MStudio React Hooks
import { useState, useCallback, useEffect, useRef } from 'react';
import * as svc from './mstudio-service';
import type {
  MStudioStudio, MStudioVideo, MStudioLiveStream, MStudioLiveChatMessage,
  MStudioProject, MStudioComment, MStudioPlaylist, MStudioDraft,
  MStudioRecording, MStudioNotification, MStudioCommunityPost,
  MStudioMembershipTier, MStudioMerch, MStudioTip, MStudioASISContent,
  MStudioMusicTrack, MStudioThumbnail, MStudioSceneDetection,
  MStudioDashboardStats, MStudioRevenueSummary, MStudioAnalyticsPoint,
  MStudioFeedFilters, MStudioSearchResult,
} from './mstudio-types';

function useMState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [list, setList] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = useCallback(() => { setLoading(true); setError(null); }, []);
  const fail = useCallback((e: any) => { setLoading(false); setError(e?.message || String(e)); }, []);
  const done = useCallback((d: T | null = null, l: T[] = []) => { setLoading(false); setError(null); setData(d); setList(l); }, []);
  return { data, setData, list, setList, loading, error, start, fail, done };
}

// ─── STUDIOS ───
export function useMStudios() {
  const s = useMState<MStudioStudio>();
  const loadAll = useCallback(async (limit = 20) => { s.start(); try { s.done(null, await svc.getStudios(limit)); } catch (e) { s.fail(e); } }, []);
  const loadOne = useCallback(async (id: string) => { s.start(); try { s.done(await svc.getStudioById(id)); } catch (e) { s.fail(e); } }, []);
  const loadByHandle = useCallback(async (h: string) => { s.start(); try { s.done(await svc.getStudioByHandle(h)); } catch (e) { s.fail(e); } }, []);
  const create = useCallback(async (studio: Partial<MStudioStudio>) => { s.start(); try { const x = await svc.createStudio(studio); s.setList(p => [x, ...p]); s.done(x); return x; } catch (e) { s.fail(e); return null; } }, []);
  const update = useCallback(async (id: string, u: Partial<MStudioStudio>) => { try { const x = await svc.updateStudio(id, u); s.setList(p => p.map((y: any) => y.id === id ? x : y)); if (s.data?.id === id) s.setData(x); return x; } catch (e) { s.fail(e); return null; } }, []);
  return { ...s, loadAll, loadOne, loadByHandle, create, update };
}

// ─── VIDEOS ───
export function useMVideos() {
  const s = useMState<MStudioVideo>();
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const loadFeed = useCallback(async (f?: MStudioFeedFilters, append = false) => {
    s.start(); try { const v = await svc.getVideos({ ...f, limit: f?.limit || 20, offset: append ? offset : 0 });
      if (append) { s.setList(p => [...p, ...v]); setOffset(p => p + v.length); }
      else { s.done(null, v); setOffset(v.length); }
      setHasMore(v.length >= (f?.limit || 20));
    } catch (e) { s.fail(e); }
  }, [offset]);
  const loadOne = useCallback(async (id: string) => { s.start(); try { s.done(await svc.getVideoById(id)); } catch (e) { s.fail(e); } }, []);
  const create = useCallback(async (v: Partial<MStudioVideo>) => { s.start(); try { const x = await svc.createVideo(v); s.setList(p => [x, ...p]); s.done(x); return x; } catch (e) { s.fail(e); return null; } }, []);
  const update = useCallback(async (id: string, u: Partial<MStudioVideo>) => { try { const x = await svc.updateVideo(id, u); s.setList(p => p.map((y: any) => y.id === id ? x : y)); if (s.data?.id === id) s.setData(x); return x; } catch (e) { s.fail(e); return null; } }, []);
  const remove = useCallback(async (id: string) => { try { await svc.deleteVideo(id); s.setList(p => p.filter((y: any) => y.id !== id)); if (s.data?.id === id) s.setData(null); } catch (e) { s.fail(e); } }, []);
  const view = useCallback(async (id: string) => { try { await svc.incrementVideoView(id); } catch (e) {} }, []);
  return { ...s, hasMore, loadFeed, loadOne, create, update, remove, view };
}

// ─── LIVE STREAMS ───
export function useMLiveStreams() {
  const s = useMState<MStudioLiveStream>();
  const [chat, setChat] = useState<MStudioLiveChatMessage[]>([]);
  const subRef = useRef<any>(null);
  const loadAll = useCallback(async (status?: string) => { s.start(); try { s.done(null, await svc.getLiveStreams(status)); } catch (e) { s.fail(e); } }, []);
  const loadOne = useCallback(async (id: string) => { s.start(); try { const d = await svc.getLiveStreamById(id); s.done(d); if (d?.chat) setChat(d.chat); } catch (e) { s.fail(e); } }, []);
  const create = useCallback(async (stream: Partial<MStudioLiveStream>) => { s.start(); try { const x = await svc.createLiveStream(stream); s.setList(p => [x, ...p]); s.done(x); return x; } catch (e) { s.fail(e); return null; } }, []);
  const update = useCallback(async (id: string, u: Partial<MStudioLiveStream>) => { try { const x = await svc.updateLiveStream(id, u); s.setList(p => p.map((y: any) => y.id === id ? x : y)); if (s.data?.id === id) s.setData(x); return x; } catch (e) { s.fail(e); return null; } }, []);
  const subscribeChat = useCallback((streamId: string) => {
    if (subRef.current) subRef.current.unsubscribe();
    subRef.current = svc.subscribeToLiveChat(streamId, (p) => setChat(prev => [p.new, ...prev].slice(0, 200)));
    return () => subRef.current?.unsubscribe();
  }, []);
  const sendChat = useCallback(async (streamId: string, userId: string, msg: string, isSuper = false, amount = 0) => {
    try { if (isSuper && amount > 0) await svc.sendSuperChat(streamId, userId, amount, msg); else await svc.sendLiveChatMessage({ stream_id: streamId, user_id: userId, message: msg }); }
    catch (e) { s.fail(e); }
  }, []);
  return { ...s, chat, loadAll, loadOne, create, update, subscribeChat, sendChat };
}

// ─── PROJECTS ───
export function useMProjects() {
  const s = useMState<MStudioProject>();
  const [scenes, setScenes] = useState<any[]>([]);
  const loadAll = useCallback(async (userId: string) => { s.start(); try { s.done(null, await svc.getProjects(userId)); } catch (e) { s.fail(e); } }, []);
  const loadOne = useCallback(async (id: string) => { s.start(); try { const d = await svc.getProjectById(id); s.done(d?.project || null); if (d?.scenes) setScenes(d.scenes); } catch (e) { s.fail(e); } }, []);
  const create = useCallback(async (p: Partial<MStudioProject>) => { s.start(); try { const x = await svc.createProject(p); s.setList(prev => [x, ...prev]); s.done(x); return x; } catch (e) { s.fail(e); return null; } }, []);
  const update = useCallback(async (id: string, u: Partial<MStudioProject>) => { try { const x = await svc.updateProject(id, u); s.setList(p => p.map((y: any) => y.id === id ? x : y)); if (s.data?.id === id) s.setData(x); return x; } catch (e) { s.fail(e); return null; } }, []);
  const remove = useCallback(async (id: string) => { try { await svc.deleteProject(id); s.setList(p => p.filter((y: any) => y.id !== id)); if (s.data?.id === id) { s.setData(null); setScenes([]); } } catch (e) { s.fail(e); } }, []);
  return { ...s, scenes, setScenes, loadAll, loadOne, create, update, remove };
}

// ─── COMMENTS ───
export function useMComments(videoId?: string) {
  const [comments, setComments] = useState<MStudioComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (id: string, parentId?: string) => { setLoading(true); setError(null); try { setComments(await svc.getComments(id, parentId)); } catch (e) { setError((e as any)?.message); } finally { setLoading(false); } }, []);
  const create = useCallback(async (c: Partial<MStudioComment>) => { try { const x = await svc.createComment(c); setComments(p => [x, ...p]); return x; } catch (e) { setError((e as any)?.message); return null; } }, []);
  const remove = useCallback(async (id: string) => { try { await svc.deleteComment(id); setComments(p => p.filter((c: any) => c.id !== id)); } catch (e) { setError((e as any)?.message); } }, []);
  useEffect(() => { if (videoId) load(videoId); }, [videoId, load]);
  return { comments, loading, error, load, create, remove };
}

// ─── SUBSCRIPTIONS ───
export function useMSubscription(studioId?: string, userId?: string) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const subscribe = useCallback(async () => { if (!studioId || !userId) return; setLoading(true); try { await svc.subscribeToStudio(studioId, userId); setSubscribed(true); } catch (e) {} finally { setLoading(false); } }, [studioId, userId]);
  const unsubscribe = useCallback(async () => { if (!studioId || !userId) return; setLoading(true); try { await svc.unsubscribeFromStudio(studioId, userId); setSubscribed(false); } catch (e) {} finally { setLoading(false); } }, [studioId, userId]);
  return { subscribed, loading, subscribe, unsubscribe };
}

// ─── WATCH HISTORY ───
export function useMWatchHistory(userId?: string) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (!userId) return; setLoading(true); try { setHistory(await svc.getWatchHistory(userId)); } catch (e) {} finally { setLoading(false); } }, [userId]);
  const saveProgress = useCallback(async (vid: string, wd: number, td: number) => { if (!userId) return; try { await svc.saveWatchProgress(userId, vid, wd, td); } catch (e) {} }, [userId]);
  useEffect(() => { load(); }, [load]);
  return { history, loading, load, saveProgress };
}

// ─── PLAYLISTS ───
export function useMPlaylists(studioId?: string) {
  const [playlists, setPlaylists] = useState<MStudioPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (!studioId) return; setLoading(true); try { setPlaylists(await svc.getPlaylists(studioId)); } catch (e) {} finally { setLoading(false); } }, [studioId]);
  const create = useCallback(async (p: Partial<MStudioPlaylist>) => { try { const x = await svc.createPlaylist(p); setPlaylists(prev => [x, ...prev]); return x; } catch (e) { return null; } }, []);
  useEffect(() => { load(); }, [load]);
  return { playlists, loading, load, create };
}

// ─── REVENUE ───
export function useMRevenue(studioId?: string) {
  const [summary, setSummary] = useState<MStudioRevenueSummary | null>(null);
  const [timeseries, setTimeseries] = useState<MStudioAnalyticsPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const loadSummary = useCallback(async (sd?: string, ed?: string) => { if (!studioId) return; setLoading(true); try { setSummary(await svc.getRevenueSummary(studioId, sd, ed)); } catch (e) {} finally { setLoading(false); } }, [studioId]);
  const loadTimeseries = useCallback(async (vid?: string, days = 30) => { if (!studioId) return; setLoading(true); try { setTimeseries(await svc.getAnalyticsTimeseries(studioId, vid, days)); } catch (e) {} finally { setLoading(false); } }, [studioId]);
  return { summary, timeseries, loading, loadSummary, loadTimeseries };
}

// ─── SEARCH ───
export function useMSearch() {
  const [results, setResults] = useState<MStudioSearchResult>({ videos: [], studios: [] });
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const search = useCallback(async (q: string, limit = 20) => { if (!q.trim()) { setResults({ videos: [], studios: [] }); return; } setLoading(true); setQuery(q); try { setResults(await svc.searchMStudio(q, limit)); } catch (e) { setResults({ videos: [], studios: [] }); } finally { setLoading(false); } }, []);
  return { results, loading, query, search };
}

// ─── DASHBOARD ───
export function useMDashboard(studioId?: string) {
  const [stats, setStats] = useState<MStudioDashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (!studioId) return; setLoading(true); try { setStats(await svc.getStudioDashboard(studioId)); } catch (e) {} finally { setLoading(false); } }, [studioId]);
  useEffect(() => { load(); }, [load]);
  return { stats, loading, load };
}

// ─── NOTIFICATIONS ───
export function useMNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<MStudioNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const subRef = useRef<any>(null);
  const load = useCallback(async () => { if (!userId) return; setLoading(true); try { const d = await svc.getNotifications(userId); setNotifications(d); setUnread(d.filter((n: any) => !n.is_read).length); } catch (e) {} finally { setLoading(false); } }, [userId]);
  const markRead = useCallback(async (id: string) => { try { await svc.markNotificationRead(id); setNotifications(p => p.map((n: any) => n.id === id ? { ...n, is_read: true } : n)); setUnread(p => Math.max(p - 1, 0)); } catch (e) {} }, []);
  useEffect(() => { load(); if (userId) { subRef.current = svc.subscribeToNotifications(userId, (p) => { setNotifications(prev => [p.new, ...prev]); setUnread(prev => prev + 1); }); return () => subRef.current?.unsubscribe(); } }, [userId, load]);
  return { notifications, unread, loading, load, markRead };
}

// ─── PAIRING ───
export function useMPairing() {
  const [session, setSession] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const createSession = useCallback(async (directorId: string, title?: string) => { setLoading(true); try { const s = await svc.createPairingSession(directorId, title); setSession(s); return s; } catch (e) { return null; } finally { setLoading(false); } }, []);
  const loadDevices = useCallback(async (code: string) => { setLoading(true); try { const d = await svc.getPairedDevices(code); setSession(d?.session); setDevices(d?.devices || []); } catch (e) {} finally { setLoading(false); } }, []);
  const joinSession = useCallback(async (code: string, did: string, dname: string, role?: string) => { setLoading(true); try { const d = await svc.joinPairingSession(code, did, dname, role); setDevices(p => [...p, d]); return d; } catch (e) { return null; } finally { setLoading(false); } }, []);
  return { session, devices, loading, createSession, loadDevices, joinSession };
}

// ─── DRAFTS ───
export function useMDrafts(userId?: string) {
  const [drafts, setDrafts] = useState<MStudioDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (!userId) return; setLoading(true); try { setDrafts(await svc.getDrafts(userId)); } catch (e) {} finally { setLoading(false); } }, [userId]);
  const create = useCallback(async (d: Partial<MStudioDraft>) => { try { const x = await svc.createDraft(d); setDrafts(p => [x, ...p]); return x; } catch (e) { return null; } }, []);
  const remove = useCallback(async (id: string) => { try { await svc.deleteDraft(id); setDrafts(p => p.filter((d: any) => d.id !== id)); } catch (e) {} }, []);
  useEffect(() => { load(); }, [load]);
  return { drafts, loading, load, create, remove };
}

// ─── RECORDINGS ───
export function useMRecordings(userId?: string) {
  const [recordings, setRecordings] = useState<MStudioRecording[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (!userId) return; setLoading(true); try { setRecordings(await svc.getRecordings(userId)); } catch (e) {} finally { setLoading(false); } }, [userId]);
  const create = useCallback(async (r: Partial<MStudioRecording>) => { try { const x = await svc.createRecording(r); setRecordings(p => [x, ...p]); return x; } catch (e) { return null; } }, []);
  useEffect(() => { load(); }, [load]);
  return { recordings, loading, load, create };
}

// ─── COMMUNITY ───
export function useMCommunity(studioId?: string) {
  const [posts, setPosts] = useState<MStudioCommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (!studioId) return; setLoading(true); try { setPosts(await svc.getCommunityPosts(studioId)); } catch (e) {} finally { setLoading(false); } }, [studioId]);
  const create = useCallback(async (p: Partial<MStudioCommunityPost>) => { try { const x = await svc.createCommunityPost(p); setPosts(prev => [x, ...prev]); return x; } catch (e) { return null; } }, []);
  useEffect(() => { load(); }, [load]);
  return { posts, loading, load, create };
}

// ─── MEMBERSHIPS ───
export function useMMemberships(studioId?: string) {
  const [tiers, setTiers] = useState<MStudioMembershipTier[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (!studioId) return; setLoading(true); try { setTiers(await svc.getMembershipTiers(studioId)); } catch (e) {} finally { setLoading(false); } }, [studioId]);
  useEffect(() => { load(); }, [load]);
  return { tiers, loading, load };
}

// ─── MERCH ───
export function useMMerch(studioId?: string) {
  const [items, setItems] = useState<MStudioMerch[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (!studioId) return; setLoading(true); try { setItems(await svc.getMerch(studioId)); } catch (e) {} finally { setLoading(false); } }, [studioId]);
  useEffect(() => { load(); }, [load]);
  return { items, loading, load };
}

// ─── TIPS ───
export function useMTips(studioId?: string) {
  const [tips, setTips] = useState<MStudioTip[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (!studioId) return; setLoading(true); try { setTips(await svc.getTips(studioId)); } catch (e) {} finally { setLoading(false); } }, [studioId]);
  const send = useCallback(async (sid: string, rid: string, amount: number, msg?: string) => { if (!studioId) return null; try { const t = await svc.sendTip(studioId, sid, rid, amount, msg); setTips(p => [t, ...p] as any); return t; } catch (e) { return null; } }, [studioId]);
  useEffect(() => { load(); }, [load]);
  return { tips, loading, load, send };
}

// ─── ASIS ───
export function useMASIS(userId?: string) {
  const [content, setContent] = useState<MStudioASISContent[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (!userId) return; setLoading(true); try { setContent(await svc.getASISContent(userId)); } catch (e) {} finally { setLoading(false); } }, [userId]);
  const create = useCallback(async (c: Partial<MStudioASISContent>) => { try { const x = await svc.createASISContent(c); setContent(p => [x, ...p]); return x; } catch (e) { return null; } }, []);
  useEffect(() => { load(); }, [load]);
  return { content, loading, load, create };
}

// ─── MUSIC ───
export function useMMusic(userId?: string) {
  const [tracks, setTracks] = useState<MStudioMusicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (!userId) return; setLoading(true); try { setTracks(await svc.getMusicTracks(userId)); } catch (e) {} finally { setLoading(false); } }, [userId]);
  useEffect(() => { load(); }, [load]);
  return { tracks, loading, load };
}

// ─── THUMBNAILS ───
export function useMThumbnails(videoId?: string) {
  const [thumbnails, setThumbnails] = useState<MStudioThumbnail[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (!videoId) return; setLoading(true); try { setThumbnails(await svc.getThumbnails(videoId)); } catch (e) {} finally { setLoading(false); } }, [videoId]);
  const create = useCallback(async (t: Partial<MStudioThumbnail>) => { try { const x = await svc.createThumbnail(t); setThumbnails(p => [x, ...p]); return x; } catch (e) { return null; } }, []);
  useEffect(() => { load(); }, [load]);
  return { thumbnails, loading, load, create };
}

// ─── SCENES ───
export function useMScenes(videoId?: string) {
  const [scenes, setScenes] = useState<MStudioSceneDetection[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (!videoId) return; setLoading(true); try { setScenes(await svc.getSceneDetections(videoId)); } catch (e) {} finally { setLoading(false); } }, [videoId]);
  useEffect(() => { load(); }, [load]);
  return { scenes, loading, load };
}
