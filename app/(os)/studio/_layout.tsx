import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function StudioLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="camera" />
        <Stack.Screen name="recording" />
        <Stack.Screen name="pairing" />
        <Stack.Screen name="director" />
        <Stack.Screen name="editor" />
        <Stack.Screen name="music" />
        <Stack.Screen name="scenes" />
        <Stack.Screen name="thumbnail" />
        <Stack.Screen name="publish" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="comments" />
        <Stack.Screen name="monetization" />
        <Stack.Screen name="drafts" />
        <Stack.Screen name="live-setup" />
        <Stack.Screen name="live-active" />
        <Stack.Screen name="asis" />
      </Stack>
    </View>
  );
}
