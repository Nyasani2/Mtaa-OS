import React from "react";
import { View, Text, StyleSheet, FlatList, Switch } from "react-native";

type AppItem = {
  id: string;
  name: string;
  enabled: boolean;
};

const APPS: AppItem[] = [
  { id: "1", name: "Wallet", enabled: true },
  { id: "2", name: "Messenger", enabled: true },
  { id: "3", name: "Scheduler", enabled: true },
  { id: "4", name: "Jobs", enabled: false },
];

export default function InstalledApps() {
  const [apps, setApps] = React.useState<AppItem[]>(APPS);

  const toggleApp = (id: string) => {
    setApps((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, enabled: !app.enabled } : app
      )
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Installed Apps</Text>

      <FlatList
        data={apps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Switch
              value={item.enabled}
              onValueChange={() => toggleApp(item.id)}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#333",
  },
  name: { fontSize: 16 },
});
