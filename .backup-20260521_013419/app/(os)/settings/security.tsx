// app/(os)/settings/security.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { PinStore } from "@/lib/security/pin-store";

export default function SecurityScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [pinEnabled, setPinEnabled] = useState(false);

  // LOAD PIN STATE
  useEffect(() => {
    (async () => {
      try {
        const enabled = await PinStore.isEnabled();
        setPinEnabled(enabled);
      } catch (e) {
        setPinEnabled(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // TOGGLE PIN
  const togglePin = async () => {
    try {
      if (!pinEnabled) {
        router.push("/auth/set-pin");
        return;
      }

      await PinStore.disable();
      setPinEnabled(false);
    } catch (e) {}
  };

  // TEST LOCK SCREEN
  const openLock = () => {
    router.push("/auth/lock-screen");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Security</Text>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Security</Text>

      <View style={styles.card}>
        <Text style={styles.label}>PIN Lock</Text>
        <Text style={styles.text}>Enable fast unlock PIN</Text>

        <Switch value={pinEnabled} onValueChange={togglePin} />
      </View>

      <TouchableOpacity style={styles.btn} onPress={openLock}>
        <Text style={styles.btnText}>Test Lock Screen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0f",
    padding: 16,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 20,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#161622",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 6,
  },
  text: {
    color: "#999",
    fontSize: 13,
    marginBottom: 10,
  },
  btn: {
    padding: 14,
    backgroundColor: "#222",
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
