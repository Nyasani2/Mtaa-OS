import { Stack } from "expo-router";
import { View, ImageBackground } from "react-native";

export default function Layout() {
  return (
    <ImageBackground
      source={{
        uri: "https://dummyimage.com/1080x1920/000/111&text=MTAA+OS",
      }}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </ImageBackground>
  );
}
