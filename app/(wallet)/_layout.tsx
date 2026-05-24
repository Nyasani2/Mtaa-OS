import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

export default function WalletLayout() {
  const scheme = useColorScheme();

  return (
    <View style={styles.container}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: scheme === "dark" ? "#0F0F0F" : "#F8FAFC" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ title: "Wallet" }} />
        <Stack.Screen name="send" options={{ title: "Send Money" }} />
        <Stack.Screen name="deposit" options={{ title: "Deposit" }} />
        <Stack.Screen name="withdraw" options={{ title: "Withdraw" }} />
        <Stack.Screen name="qr-pay" options={{ title: "QR Pay" }} />
        <Stack.Screen name="escrow" options={{ title: "Escrow" }} />
        <Stack.Screen name="history" options={{ title: "History" }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
        <Stack.Screen name="credit" options={{ title: "Go Fund" }} />
        <Stack.Screen name="settings" options={{ title: "Wallet Settings" }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
