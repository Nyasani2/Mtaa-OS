// @ts-nocheck
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraType } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export default function CCTVScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<Camera | null>(null);

  const requestPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required for snapshots.');
    }
  };

  const takeSnapshot = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync();
        Alert.alert('Snapshot Captured', `Saved to: ${photo.uri}`);
        // In production, upload this URI to Supabase Storage
      } catch (error) {
        Alert.alert('Error', 'Failed to capture snapshot.');
      }
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={requestPermissions} style={styles.permissionBtn}>
          <Text style={styles.permissionText}>Enable Camera for CCTV</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasPermission === false) {
    return <View style={styles.container}><Text style={styles.text}>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={CameraType.back} ref={ref => setCameraRef(ref)}>
        <View style={styles.overlay}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Live Feed: Main Gate</Text>
        </View>
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={takeSnapshot} style={styles.captureBtn}>
            <Ionicons name="camera" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-start', paddingTop: 50, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 },
  bottomBar: { flex: 1, backgroundColor: 'transparent', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 40 },
  captureBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
  permissionBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  permissionText: { color: '#fff', fontSize: 18 },
  text: { color: '#fff', fontSize: 18 },
});
