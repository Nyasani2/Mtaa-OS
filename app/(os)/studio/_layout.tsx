import { Stack } from 'expo-router';

export default function StudioLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0a0a' } }}>
      {/* Feed Tabs */}
      <Stack.Screen name="feed" options={{ title: 'Discover' }} />
      <Stack.Screen name="following" options={{ title: 'Following' }} />
      <Stack.Screen name="trending" options={{ title: 'Trending' }} />
      <Stack.Screen name="live" options={{ title: 'Live' }} />
      <Stack.Screen name="music-feed" options={{ title: 'Music' }} />
      <Stack.Screen name="learning-feed" options={{ title: 'Learning' }} />
      <Stack.Screen name="nearby" options={{ title: 'Nearby' }} />
      <Stack.Screen name="subscriptions" options={{ title: 'Subscriptions' }} />
      <Stack.Screen name="search-results" options={{ title: 'Search' }} />

      {/* Creator OS */}
      <Stack.Screen name="creator-profile" options={{ title: 'Studio Profile' }} />
      <Stack.Screen name="upload-center" options={{ title: 'Upload' }} />
      <Stack.Screen name="drafts" options={{ title: 'Drafts' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Stack.Screen name="revenue" options={{ title: 'Revenue' }} />
      <Stack.Screen name="children-mode" options={{ title: 'Kids Mode' }} />

      {/* Content Upload */}
      <Stack.Screen name="music-upload" options={{ title: 'Upload Music' }} />
      <Stack.Screen name="podcast-upload" options={{ title: 'Upload Podcast' }} />
      <Stack.Screen name="education-upload" options={{ title: 'Upload Education' }} />

      {/* Live & Camera */}
      <Stack.Screen name="live-setup" options={{ title: 'Go Live' }} />
      <Stack.Screen name="live-active" options={{ title: 'Live Stream', headerShown: false }} />
      <Stack.Screen name="camera" options={{ title: 'Camera', headerShown: false }} />

      {/* AI Studio */}
      <Stack.Screen name="ai-studio" options={{ title: 'AI Studio' }} />

      {/* Content Playback */}
      <Stack.Screen name="video-player" options={{ title: 'Video', headerShown: false }} />
      <Stack.Screen name="music-player" options={{ title: 'Music Player', headerShown: false }} />
      <Stack.Screen name="education-player" options={{ title: 'Education', headerShown: false }} />

      {/* Existing Screens (unique only) */}
      <Stack.Screen name="channel" options={{ title: 'Channel' }} />
      <Stack.Screen name="editor" options={{ title: 'Editor' }} />
      <Stack.Screen name="search" options={{ title: 'Search' }} />
      <Stack.Screen name="monetization" options={{ title: 'Monetization' }} />
      <Stack.Screen name="revenue-sharing" options={{ title: 'Revenue Sharing' }} />
      <Stack.Screen name="education-studio" options={{ title: 'Education Studio' }} />
      <Stack.Screen name="children-zone" options={{ title: 'Children Zone' }} />
      <Stack.Screen name="community" options={{ title: 'Community' }} />
      <Stack.Screen name="accessibility" options={{ title: 'Accessibility' }} />
      <Stack.Screen name="copyright" options={{ title: 'Copyright' }} />
      <Stack.Screen name="safety" options={{ title: 'Safety' }} />
      <Stack.Screen name="integrations" options={{ title: 'Integrations' }} />
      <Stack.Screen name="performance" options={{ title: 'Performance' }} />
      <Stack.Screen name="mstudio-complete" options={{ title: 'MStudio Complete' }} />
      <Stack.Screen name="broadcast-console" options={{ title: 'Broadcast Console' }} />
      <Stack.Screen name="live-broadcast" options={{ title: 'Live Broadcast' }} />
      <Stack.Screen name="unified-studio" options={{ title: 'Unified Studio' }} />
      <Stack.Screen name="virtual-production" options={{ title: 'Virtual Production' }} />
      <Stack.Screen name="asis-assistant" options={{ title: 'ASIS Assistant' }} />
      <Stack.Screen name="multi-camera" options={{ title: 'Multi Camera' }} />
      <Stack.Screen name="creator-revenue" options={{ title: 'Creator Revenue' }} />
      <Stack.Screen name="creator-transparency" options={{ title: 'Creator Transparency' }} />
      <Stack.Screen name="vision-manifesto" options={{ title: 'Vision Manifesto' }} />
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="publish" options={{ title: 'Publish' }} />
      <Stack.Screen name="comments" options={{ title: 'Comments' }} />
      <Stack.Screen name="director" options={{ title: 'Director' }} />
      <Stack.Screen name="music" options={{ title: 'Music' }} />
      <Stack.Screen name="pairing" options={{ title: 'Pairing' }} />
      <Stack.Screen name="recording" options={{ title: 'Recording' }} />
      <Stack.Screen name="scenes" options={{ title: 'Scenes' }} />
      <Stack.Screen name="thumbnail" options={{ title: 'Thumbnail' }} />
    </Stack>
  );
}
