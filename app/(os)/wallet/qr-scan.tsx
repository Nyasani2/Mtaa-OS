"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useAuthStore } from "@/hooks/useAuthStore";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import {
  Flashlight,
  Keyboard,
  ScanLine,
  X,
  ArrowRight,
  ArrowLeft,
} from "lucide-react-native";

const { width } = Dimensions.get("window");
const SCANNER_SIZE = Math.min(width - 64, 280);

export default function QrScannerScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [manualInput, setManualInput] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const [BarCodeScanner, setBarCodeScanner] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("expo-barcode-scanner");
        if (mounted) {
          setBarCodeScanner(mod);
          const { status } = await mod.requestPermissionsAsync();
          setHasPermission(status === "granted");
        }
      } catch (e) {
        setHasPermission(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleBarCodeScanned = useCallback(
    async ({ type, data }: { type: string; data: string }) => {
      if (!scanning || resolving) return;
      setScanning(false);
      setResolving(true);

      try {
        let qrId = data;
        const match = data.match(/mtaa:\/\/qr\/([a-f0-9-]+)/i);
        if (match) qrId = match[1];

        if (!qrId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          Alert.alert("Invalid QR", "This QR code is not recognized by MTAA.");
          setScanning(true);
          setResolving(false);
          return;
        }

        const { data: resolveData, error } = await supabase.functions.invoke("qr-resolve", {
          body: {
            qr_id: qrId,
            scanner_id: user?.id,
          },
        });

        if (error) throw error;

        if (resolveData.error) {
          Alert.alert("QR Error", resolveData.error);
          setScanning(true);
          setResolving(false);
          return;
        }

        // Navigate using expo-router with params
        router.push({
          pathname: "/wallet/qr-action",
          params: { qr: JSON.stringify(resolveData) },
        });

      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to process QR code");
        setScanning(true);
        setResolving(false);
      }
    },
    [scanning, resolving, user?.id, router]
  );

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) return;
    await handleBarCodeScanned({ type: "manual", data: manualInput.trim() });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {/* Header */}
      <View style={{ padding: 16, paddingTop: 24, backgroundColor: "#1e293b", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#f8fafc" }}>
          Scan QR Code
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {resolving ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ color: "#94a3b8", marginTop: 16, fontSize: 14 }}>
            Resolving QR code...
          </Text>
        </View>
      ) : showManual ? (
        /* Manual Input Mode */
        <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
          <Keyboard size={48} color="#475569" style={{ alignSelf: "center", marginBottom: 16 }} />
          <Text style={{ fontSize: 16, color: "#f1f5f9", textAlign: "center", marginBottom: 8 }}>
            Enter QR Code ID
          </Text>
          <Text style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 24 }}>
            Paste the QR code ID or deep link here
          </Text>

          <TextInput
            value={manualInput}
            onChangeText={setManualInput}
            placeholder="mtaa://qr/... or UUID"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: "#1e293b",
              borderRadius: 12,
              padding: 16,
              color: "#f1f5f9",
              fontSize: 14,
              marginBottom: 16,
            }}
          />

          <TouchableOpacity
            onPress={handleManualSubmit}
            disabled={!manualInput.trim()}
            style={{
              backgroundColor: manualInput.trim() ? "#3b82f6" : "#334155",
              paddingVertical: 14,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <ArrowRight size={18} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
              Resolve QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setShowManual(false); setScanning(true); }}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ fontSize: 13, color: "#64748b" }}>Back to Scanner</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Scanner View */
        <View style={{ flex: 1, alignItems: "center", paddingTop: 40 }}>
          <View
            style={{
              width: SCANNER_SIZE,
              height: SCANNER_SIZE,
              borderRadius: 20,
              overflow: "hidden",
              position: "relative",
              backgroundColor: "#000",
            }}
          >
            {BarCodeScanner && hasPermission ? (
              <BarCodeScanner.default
                onBarCodeScanned={scanning ? handleBarCodeScanned : undefined}
                barCodeTypes={[BarCodeScanner.BarCodeType.qr]}
                style={{ width: SCANNER_SIZE, height: SCANNER_SIZE }}
                flashMode={flashOn ? "torch" : "off"}
              />
            ) : (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1e293b" }}>
                <ScanLine size={64} color="#475569" />
                <Text style={{ color: "#64748b", marginTop: 12, fontSize: 13, textAlign: "center", paddingHorizontal: 20 }}>
                  {hasPermission === false
                    ? "Camera access not available.\nUse manual input below."
                    : "Loading scanner..."}
                </Text>
              </View>
            )}

            {/* Overlay Corners */}
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
              <View style={{ position: "absolute", top: 16, left: 16, width: 40, height: 40, borderTopWidth: 3, borderLeftWidth: 3, borderColor: "#3b82f6" }} />
              <View style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderTopWidth: 3, borderRightWidth: 3, borderColor: "#3b82f6" }} />
              <View style={{ position: "absolute", bottom: 16, left: 16, width: 40, height: 40, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: "#3b82f6" }} />
              <View style={{ position: "absolute", bottom: 16, right: 16, width: 40, height: 40, borderBottomWidth: 3, borderRightWidth: 3, borderColor: "#3b82f6" }} />
            </View>
          </View>

          {/* Scan Line */}
          {scanning && (
            <View
              style={{
                position: "absolute",
                top: 40 + SCANNER_SIZE / 2,
                left: (width - SCANNER_SIZE) / 2 + 16,
                right: (width - SCANNER_SIZE) / 2 + 16,
                height: 2,
                backgroundColor: "#3b82f6",
                opacity: 0.8,
              }}
            />
          )}

          <Text style={{ color: "#94a3b8", marginTop: 24, fontSize: 14 }}>
            Align QR code within the frame
          </Text>

          {/* Bottom Controls */}
          <View style={{ flexDirection: "row", gap: 16, marginTop: 32 }}>
            {BarCodeScanner && (
              <TouchableOpacity
                onPress={() => setFlashOn(!flashOn)}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: flashOn ? "#f59e0b" : "#334155",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Flashlight size={22} color={flashOn ? "#fff" : "#cbd5e1"} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setShowManual(true)}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#334155",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Keyboard size={22} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
