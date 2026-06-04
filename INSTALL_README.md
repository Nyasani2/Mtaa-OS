# MTAA AppStore Redesign — Installation Guide

## What's Included

This package completely replaces your AppStore with a Google Play Store-inspired redesign.

### Files

| File | Destination | Description |
|------|-------------|-------------|
| `hooks_useAppStore.ts` | `hooks/useAppStore.ts` | Complete state management hook with mock data, install tracking, interests, search |
| `components_AppCard.tsx` | `components/appstore/AppCard.tsx` | Reusable app card (compact, horizontal, full variants) |
| `components_ScreenshotCarousel.tsx` | `components/appstore/ScreenshotCarousel.tsx` | Screenshot carousel with colored labels (Google Play style) |
| `components_InterestPicker.tsx` | `components/appstore/InterestPicker.tsx` | Onboarding interest picker |
| `appstore_index.tsx` | `app/(os)/appstore/index.tsx` | AppStore Home — Discover/Installed/Updates tabs, search, carousels |
| `appstore_id.tsx` | `app/(os)/appstore/[id].tsx` | App Detail — screenshots, about, features, ASIS prompt, install button |
| `appstore_categories.tsx` | `app/(os)/appstore/categories.tsx` | Category browse with horizontal filter tabs |
| `appstore_top-charts.tsx` | `app/(os)/appstore/top-charts.tsx` | Ranked top charts with filters |
| `appstore_layout.tsx` | `app/(os)/appstore/_layout.tsx` | Stack layout with slide animation |

## Key Features

1. **Screenshot Carousel** — Yellow/lime accent borders with feature labels on top ("Book", "Track", "Pay")
2. **App Detail Page** — Hero icon, stats row, ranking badge, category tags, "About this app", features list, permissions, ASIS AI prompt, developer card
3. **Interest Picker Onboarding** — "What are you interested in?" with chip selection (minimum 3)
4. **Sponsored/Recommended Sections** — Horizontal carousels with clear labels
5. **Top Charts** — Ranked lists with gold/silver/bronze highlighting for top 3
6. **Fixed Install Flow** — Get → Installing... → Open. **Stays in AppStore** (no navigation to home!)
7. **Search** — Full search overlay with results
8. **Category Browse** — Horizontal category tabs with icon + color

## Installation Steps

### Step 1: Create directories
```bash
mkdir -p ~/MTAA_OS_V10/components/appstore
```

### Step 2: Move files from Downloads
```bash
cd ~/Downloads
mv hooks_useAppStore.ts ~/MTAA_OS_V10/hooks/useAppStore.ts
mv components_AppCard.tsx ~/MTAA_OS_V10/components/appstore/AppCard.tsx
mv components_ScreenshotCarousel.tsx ~/MTAA_OS_V10/components/appstore/ScreenshotCarousel.tsx
mv components_InterestPicker.tsx ~/MTAA_OS_V10/components/appstore/InterestPicker.tsx
mv appstore_index.tsx ~/MTAA_OS_V10/app/\(os\)/appstore/index.tsx
mv appstore_id.tsx ~/MTAA_OS_V10/app/\(os\)/appstore/\[id\].tsx
mv appstore_categories.tsx ~/MTAA_OS_V10/app/\(os\)/appstore/categories.tsx
mv appstore_top-charts.tsx ~/MTAA_OS_V10/app/\(os\)/appstore/top-charts.tsx
mv appstore_layout.tsx ~/MTAA_OS_V10/app/\(os\)/appstore/_layout.tsx
```

### Step 3: Verify routes
Make sure your Expo Router has these routes registered:
- `/(os)/appstore` → Home
- `/(os)/appstore/:id` → App Detail
- `/(os)/appstore/categories` → Categories
- `/(os)/appstore/top-charts` → Top Charts

### Step 4: Wire to your kernel
The `useAppStore` hook currently uses mock data. To connect to your real backend:
1. Replace `MOCK_APPS` with a Supabase/API fetch in `useEffect`
2. Replace `installedApps` state with your kernel's app registry
3. Replace `installApp` with a real API call to your kernel installer

### Step 5: The "Get" Button Fix
The critical fix: clicking **Get** now calls `installApp(appId)` which:
- Shows "Installing..." spinner for 2 seconds
- Adds app to `installedApps` set
- Button changes to **Open**
- **User stays on AppStore page** — no navigation to home

Clicking **Open** navigates to the app's route.

## Customization

- **Colors**: Edit `getIconBg()` in AppCard.tsx and [id].tsx
- **Mock data**: Edit `MOCK_APPS` in `useAppStore.ts`
- **Screenshots**: Replace Unsplash URLs with your actual app screenshots
- **ASIS integration**: Wire the "Ask ASIS" button to your ASIS AI chat

## Notes

- All components use `#121212` dark background (matches Google Play)
- Accent color is `#4ECDC4` (teal)
- Uses Expo Vector Icons (Feather)
- Compatible with Expo Router v2+
