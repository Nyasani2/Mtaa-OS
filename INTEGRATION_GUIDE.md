# MTAA AppStore — Complete Integration Guide

## All Files (8 ZIP Parts)

### Part 1: Core Hooks & Components
- `hooks/useAppStore.ts` — State management, mock data, install tracking
- `components/appstore/AppCard.tsx` — Reusable app cards (3 variants)
- `components/appstore/ScreenshotCarousel.tsx` — Screenshot carousel with labels
- `components/appstore/InterestPicker.tsx` — Onboarding interest picker

### Part 2: Pages & Layout
- `app/(os)/appstore/index.tsx` — Home with Discover/Installed/Updates
- `app/(os)/appstore/[id].tsx` — App detail with all sections
- `app/(os)/appstore/categories.tsx` — Category browse
- `app/(os)/appstore/top-charts.tsx` — Ranked lists with filters
- `app/(os)/appstore/_layout.tsx` — Stack layout

### Part 3: ASIS AI & Search
- `components/appstore/AsisChat.tsx` — Full-screen AI chat
- `components/appstore/SearchOverlay.tsx` — Search overlay component

### Part 4: Updated Pages (Wired)
- `app/(os)/appstore/index.tsx` — Home with SearchOverlay
- `app/(os)/appstore/[id].tsx` — Detail with ASIS modal

### Part 5: Reviews & Install Progress
- `components/appstore/AppReviews.tsx` — Reviews & ratings modal
- `components/appstore/InstallProgress.tsx` — Floating install toast

### Part 6: Final Integrated Pages
- `app/(os)/appstore/[id].tsx` — Final detail (Reviews + InstallProgress + ASIS)
- `app/(os)/appstore/index.tsx` — Final home (InstallProgress + SearchOverlay)

### Part 7: Bottom Nav & Profile
- `components/appstore/BottomNav.tsx` — 4-tab bottom navigation
- `app/(os)/appstore/you.tsx` — Profile/settings page

### Part 8: Search & Layout
- `app/(os)/appstore/search.tsx` — Dedicated search page
- `app/(os)/appstore/_layout.tsx` — Layout with BottomNav

### Part 9: Wishlist & Compare
- `components/appstore/Wishlist.tsx` — Saved apps wishlist
- `components/appstore/AppCompare.tsx` — Side-by-side app comparison

### Part 10: Types
- `types/appstore.ts` — Complete TypeScript definitions

---

## Quick Install (All Parts)

```bash
cd ~/Downloads
mkdir -p ~/MTAA_OS_V10/components/appstore

# Extract all parts
for i in 1 2 3 4 5 6 7 8 9; do
  unzip -o MTAA_AppStore_Part${i}_*.zip -d ~/MTAA_OS_V10/
done

# Part 10 (types)
mkdir -p ~/MTAA_OS_V10/types
mv ~/MTAA_OS_V10/types_appstore.ts ~/MTAA_OS_V10/types/appstore.ts 2>/dev/null || true
```

---

## Routes Required

```tsx
// app/(os)/appstore/_layout.tsx
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { AppStoreBottomNav } from '@/components/appstore/BottomNav';

export default function AppStoreLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <AppStoreBottomNav />
    </View>
  );
}
```

Routes:
- `/(os)/appstore` → Home
- `/(os)/appstore/:id` → App Detail
- `/(os)/appstore/categories` → Categories
- `/(os)/appstore/top-charts` → Top Charts
- `/(os)/appstore/search` → Search
- `/(os)/appstore/you` → Profile

---

## Key Features Summary

| Feature | Status | File |
|---------|--------|------|
| Screenshot carousel with labels | ✅ | ScreenshotCarousel.tsx |
| App detail with all sections | ✅ | [id].tsx |
| Interest picker onboarding | ✅ | InterestPicker.tsx |
| Sponsored/recommended sections | ✅ | index.tsx |
| Top charts with filters | ✅ | top-charts.tsx |
| Fixed install flow (no home nav) | ✅ | InstallProgress.tsx |
| ASIS AI chat integration | ✅ | AsisChat.tsx |
| Search with trending/recent | ✅ | SearchOverlay.tsx + search.tsx |
| Reviews & ratings | ✅ | AppReviews.tsx |
| Bottom navigation (4 tabs) | ✅ | BottomNav.tsx |
| Profile/You page | ✅ | you.tsx |
| Wishlist | ✅ | Wishlist.tsx |
| App comparison | ✅ | AppCompare.tsx |
| Install progress toast | ✅ | InstallProgress.tsx |

---

## Connect to Real Backend

Replace mock data in `useAppStore.ts`:

```tsx
// Instead of MOCK_APPS, fetch from Supabase:
useEffect(() => {
  async function loadApps() {
    const { data } = await supabase.from('apps').select('*');
    setApps(data || []);
  }
  loadApps();
}, []);

// Instead of local state, use kernel registry:
const installApp = async (appId: string) => {
  await kernel.installApp(appId);
  // Or call edge function:
  await fetch('/functions/v1/install-app', { method: 'POST', body: JSON.stringify({ appId }) });
};
```

---

## Color System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#121212` | Main background |
| Card | `#1C1C1C` | Cards, inputs |
| Surface | `#2A2A2A` | Buttons, hover |
| Accent | `#4ECDC4` | Primary actions |
| Gold | `#FFD700` | Rankings, stars |
| Danger | `#FF6B6B` | Errors, uninstall |
| Text Primary | `#fff` | Headings |
| Text Secondary | `#ccc` | Body |
| Text Muted | `#888` | Labels |
| Text Disabled | `#666` | Placeholders |
