import { Stack } from 'expo-router';

export default function StudioLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* Dashboard (with sidebar) */}
      <Stack.Screen name="index" />

      {/* Live Streaming */}
      <Stack.Screen name="live" />
      <Stack.Screen name="live-active" />
      <Stack.Screen name="live-broadcast" />
      <Stack.Screen name="broadcast-console" />

      {/* Videos & Content */}
      <Stack.Screen name="video-player" />
      <Stack.Screen name="feed" />
      <Stack.Screen name="trending" />
      <Stack.Screen name="nearby" />
      <Stack.Screen name="search" />
      <Stack.Screen name="search-results" />

      {/* Upload & Create */}
      <Stack.Screen name="upload-center" />
      <Stack.Screen name="publish" />
      <Stack.Screen name="drafts" />
      <Stack.Screen name="editor" />
      <Stack.Screen name="thumbnail" />

      {/* Creator Hub */}
      <Stack.Screen name="creator-profile" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="creator-revenue" />
      <Stack.Screen name="creator-transparency" />
      <Stack.Screen name="following" />
      <Stack.Screen name="subscriptions" />

      {/* Music & Audio */}
      <Stack.Screen name="music-studio" />
      <Stack.Screen name="music-feed" />
      <Stack.Screen name="podcast-upload" />

      {/* Education Studio */}
      <Stack.Screen name="education-upload" />
      <Stack.Screen name="learning-feed" />

      {/* Production Tools */}
      <Stack.Screen name="director" />
      <Stack.Screen name="multi-camera" />
      <Stack.Screen name="virtual-production" />
      <Stack.Screen name="scenes" />
      <Stack.Screen name="camera" />

      {/* Community */}
      <Stack.Screen name="community" />
      <Stack.Screen name="comments" />

      {/* ASIS & AI */}
      <Stack.Screen name="asis" />
      <Stack.Screen name="ai-studio" />

      {/* Settings & Safety */}
      <Stack.Screen name="safety" />
      <Stack.Screen name="accessibility" />
      <Stack.Screen name="copyright" />
      <Stack.Screen name="performance" />
      <Stack.Screen name="children-mode" />
      <Stack.Screen name="children-zone" />
      <Stack.Screen name="pairing" />

      {/* System */}
      <Stack.Screen name="mstudio-complete" />
      <Stack.Screen name="unified-studio" />
    </Stack>
  );
}
