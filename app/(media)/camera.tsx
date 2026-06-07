// app/(media)/camera.tsx — MTAA OS Camera
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function CameraScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [flash, setFlash] = useState<"auto" | "on" | "off">("auto");
  const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
  const [captured, setCaptured] = useState<string | null>(null);

  const toggleFlash = () => {
    setFlash((prev) => (prev === "auto" ? "on" : prev === "on" ? "off" : "auto"));
  };

  const toggleCamera = () => {
    setCameraFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const handleCapture = () => {
    // Simulate capture — in real app, use expo-camera
    setCaptured("https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&q=80");
  };

  const handleRetake = () => {
    setCaptured(null);
  };

  const handleSave = () => {
    // Save to gallery — integrate with gallery module
    router.push("/gallery" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Camera</Text>
        <TouchableOpacity onPress={toggleFlash} style={styles.headerButton}>
          <Ionicons
            name={flash === "auto" ? "flash" : flash === "on" ? "flash" : "flash-off"}
            size={22}
            color={flash === "off" ? "#64748B" : "#FBBF24"}
          />
        </TouchableOpacity>
      </View>

      {/* Viewfinder */}
      <View style={styles.viewfinder}>
        {captured ? (
          <Image source={{ uri: captured }} style={styles.capturedImage} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera" size={64} color="rgba(255,255,255,0.2)" />
            <Text style={styles.placeholderText}>
              {cameraFacing === "back" ? "Rear Camera" : "Front Camera"}
            </Text>
            <Text style={styles.placeholderSub}>
              Camera module ready. Tap shutter to capture.
            </Text>
          </View>
        )}

        {/* Grid overlay */}
        {!captured && (
          <View style={styles.gridOverlay} pointerEvents="none">
            <View style={styles.gridLineV1} />
            <View style={styles.gridLineV2} />
            <View style={styles.gridLineH1} />
            <View style={styles.gridLineH2} />
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {captured ? (
          <View style={styles.reviewControls}>
            <TouchableOpacity style={styles.reviewButton} onPress={handleRetake}>
              <Ionicons name="refresh" size={28} color="#FFFFFF" />
              <Text style={styles.reviewButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.reviewButton, styles.saveButton]} onPress={handleSave}>
              <Ionicons name="checkmark" size={28} color="#FFFFFF" />
              <Text style={styles.reviewButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Mode switcher */}
            <View style={styles.modeSwitcher}>
              <TouchableOpacity
                style={[styles.modeButton, mode === "photo" && styles.modeButtonActive]}
                onPress={() => setMode("photo")}
              >
                <Text style={[styles.modeText, mode === "photo" && styles.modeTextActive]}>
                  Photo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, mode === "video" && styles.modeButtonActive]}
                onPress={() => setMode("video")}
              >
                <Text style={[styles.modeText, mode === "video" && styles.modeTextActive]}>
                  Video
                </Text>
              </TouchableOpacity>
            </View>

            {/* Shutter row */}
            <View style={styles.shutterRow}>
              <TouchableOpacity style={styles.galleryButton} onPress={() => router.push("/gallery" as any)}>
                <View style={styles.galleryThumb}>
                  <Ionicons name="images" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shutterButton} onPress={handleCapture}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.flipButton} onPress={toggleCamera}>
                <Ionicons name="camera-reverse" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  viewfinder: {
    flex: 1,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#111827",
    position: "relative",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  placeholderText: {
    fontSize: 18,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
  placeholderSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "400",
  },
  capturedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  gridLineV1: {
    position: "absolute",
    left: "33.33%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  gridLineV2: {
    position: "absolute",
    left: "66.66%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  gridLineH1: {
    position: "absolute",
    top: "33.33%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  gridLineH2: {
    position: "absolute",
    top: "66.66%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  controls: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
    paddingTop: 16,
  },
  modeSwitcher: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 20,
  },
  modeButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  modeButtonActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  modeText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  modeTextActive: {
    color: "#FBBF24",
    fontWeight: "600",
  },
  shutterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  galleryThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    alignItems: "center",
  },
  reviewButton: {
    alignItems: "center",
    gap: 6,
  },
  saveButton: {
    backgroundColor: "#10B981",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
});
