import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";

export default function InstalledAppsScreen() {
  const [enabled, setEnabled] = React.useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Installed Apps</Text>

      <View style={styles.row}>
        <Text style={styles.label}>System Apps</Text>
        <Switch value={enabled} onValueChange={setEnabled} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
  },
  label: { color: "#fff" },
});
