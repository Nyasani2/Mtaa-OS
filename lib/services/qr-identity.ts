import { supabase } from '@/lib/supabase/client';

const QR_BASE_URL = 'https://mtaa.app/u';

export interface QrIdentityData {
  userId: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  qrUrl: string;
  deepLink: string;
}

export const qrIdentityService = {
  async generateQrIdentity(userId: string): Promise<QrIdentityData | null> {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('user_id, username, display_name, avatar_url, qr_identity_url')
      .eq('user_id', userId)
      .single();

    if (error || !profile) return null;

    // If QR already generated, return it
    if (profile.qr_identity_url) {
      return {
        userId: profile.user_id,
        username: profile.username,
        displayName: profile.display_name || 'MTAA User',
        avatarUrl: profile.avatar_url,
        qrUrl: profile.qr_identity_url,
        deepLink: `mtaa://user/${profile.user_id}`,
      };
    }

    // Generate new QR identity URL
    const username = profile.username || profile.user_id.substring(0, 8);
    const qrUrl = `${QR_BASE_URL}/${username}`;

    // Save to profile
    await supabase
      .from('user_profiles')
      .update({ qr_identity_url: qrUrl })
      .eq('user_id', userId);

    return {
      userId: profile.user_id,
      username: profile.username,
      displayName: profile.display_name || 'MTAA User',
      avatarUrl: profile.avatar_url,
      qrUrl,
      deepLink: `mtaa://user/${profile.user_id}`,
    };
  },

  async resolveQrIdentity(identifier: string): Promise<QrIdentityData | null> {
    // identifier can be: mtaa://user/{userId}, https://mtaa.app/u/{username}, or raw userId
    let userId: string | null = null;
    let username: string | null = null;

    if (identifier.startsWith('mtaa://user/')) {
      userId = identifier.replace('mtaa://user/', '');
    } else if (identifier.startsWith('https://mtaa.app/u/')) {
      username = identifier.replace('https://mtaa.app/u/', '');
    } else if (identifier.includes('-')) {
      userId = identifier; // Assume UUID
    } else {
      username = identifier;
    }

    let query = supabase
      .from('user_profiles')
      .select('user_id, username, display_name, avatar_url, qr_identity_url');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (username) {
      query = query.eq('username', username);
    } else {
      return null;
    }

    const { data: profile, error } = await query.single();
    if (error || !profile) return null;

    return {
      userId: profile.user_id,
      username: profile.username,
      displayName: profile.display_name || 'MTAA User',
      avatarUrl: profile.avatar_url,
      qrUrl: profile.qr_identity_url || `${QR_BASE_URL}/${profile.username || profile.user_id.substring(0, 8)}`,
      deepLink: `mtaa://user/${profile.user_id}`,
    };
  },

  async getMyQrIdentity(): Promise<QrIdentityData | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    return this.generateQrIdentity(session.user.id);
  },
};
