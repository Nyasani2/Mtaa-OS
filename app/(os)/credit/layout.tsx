import { Stack } from "expo-router";

export default function CreditLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: "#050816" }, headerTintColor: "white", contentStyle: { backgroundColor: "#050816" } }}>
      <Stack.Screen name="index" options={{ title: "Credit & Finance", headerShown: false }} />
      <Stack.Screen name="loans/index" options={{ title: "My Loans" }} />
      <Stack.Screen name="investments/index" options={{ title: "Investments" }} />
      <Stack.Screen name="history/index" options={{ title: "Transaction History" }} />
      <Stack.Screen name="apply/index" options={{ title: "Apply for Credit" }} />
    </Stack>
  );
}
