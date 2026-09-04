"use client";

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Error", message = "Something went wrong", onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.button}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 18, fontWeight: "600", color: "#ef4444", marginBottom: 8 },
  message: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 16 },
  button: { backgroundColor: "#2563eb", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
