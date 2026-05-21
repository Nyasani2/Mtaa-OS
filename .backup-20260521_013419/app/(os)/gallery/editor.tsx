import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import Slider from "@react-native-community/slider";
import { router, useLocalSearchParams } from "expo-router";

export default function GalleryEditorScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();

  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      Alert.alert("Saved", "Edits applied", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }, 800);
  };

  if (!uri) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No image selected</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gallery Editor</Text>

      <View style={styles.previewContainer}>
        <Image
          source={{ uri }}
          style={[
            styles.preview,
            { opacity: brightness },
          ]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.controls}>
        <Text style={styles.label}>Brightness</Text>
        <Slider
          value={brightness}
          onValueChange={setBrightness}
          minimumValue={0.2}
          maximumValue={2}
        />

        <Text style={styles.label}>Contrast</Text>
        <Slider
          value={contrast}
          onValueChange={setContrast}
          minimumValue={0.2}
          maximumValue={2}
        />

        <Text style={styles.label}>Saturation</Text>
        <Slider
          value={saturation}
          onValueChange={setSaturation}
          minimumValue={0.2}
          maximumValue={2}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            setBrightness(1);
            setContrast(1);
            setSaturation(1);
          }}
        >
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 16 },
  title: { color: "#fff", fontSize: 22, marginTop: 40 },
  previewContainer: { flex: 1, marginVertical: 20 },
  preview: { width: "100%", height: "100%" },
  controls: { gap: 10 },
  label: { color: "#fff" },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  resetBtn: { flex: 1, padding: 12, backgroundColor: "#333" },
  saveBtn: { flex: 2, padding: 12, backgroundColor: "#6366f1" },
  resetText: { color: "#fff", textAlign: "center" },
  saveText: { color: "#fff", textAlign: "center" },
  error: { color: "#fff" },
  backText: { color: "#6366f1", marginTop: 10 },
});
