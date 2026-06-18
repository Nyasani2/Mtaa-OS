# Media Gallery Component for MTAA Profile

## What's New
- **MediaGallery** component — grid of thumbnails above Wallet
- **View count** + **Like count** on every thumbnail
- **Filter tabs**: All / Videos / Photos
- **Tap to open** detail modal with full stats
- **Mock data** included — wire to Supabase for real content

## Files
```
lib/asis/components/MediaGallery.tsx     # NEW — Grid gallery component
lib/asis/components/index.ts             # NEW — Barrel export
app/(os)/profile/index.tsx               # UPDATED — Includes MediaGallery
```

## Install
```bash
cd ~/MTAA_OS_V10
rm -rf .expo
unzip -o ~/Downloads/media-gallery.zip -d ./
```

## Supabase Integration (TODO)
Replace MOCK_MEDIA with:
```sql
SELECT 
  mp.id,
  mp.type,
  mp.thumbnail_url,
  mp.duration,
  mp.title,
  mp.created_at,
  ma.views,
  ma.likes
FROM media_posts mp
LEFT JOIN media_analytics ma ON mp.id = ma.post_id
WHERE mp.user_id = $1
ORDER BY mp.created_at DESC;
```

## Tables Needed
```sql
CREATE TABLE media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT CHECK (type IN ('video', 'photo')),
  thumbnail_url TEXT,
  media_url TEXT NOT NULL,
  duration TEXT, -- e.g. '2:15' for videos
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE media_analytics (
  post_id UUID REFERENCES media_posts(id),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
