import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Alert, Share } from 'react-native';
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from '@expo/vector-icons';

interface PhotoItem {
  id: string;
  uri: string;
  width: number;
  height: number;
  creationTime: number;
}

export default function GalleryShell() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAlbums, setShowAlbums] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [selectedAlbum]);

  const loadPhotos = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      setLoading(false);
      return;
    }

    const albumList = await MediaLibrary.getAlbumsAsync();
    setAlbums(albumList);

    const options: MediaLibrary.AssetsOptions = {
      first: 100,
      sortBy: ["creationTime"],
      mediaType: "photo",
    };

    if (selectedAlbum) {
      const album = albumList.find((a) => a.id === selectedAlbum);
      if (album) {
        (options as any).album = album;
      }
    }

    const assets = await MediaLibrary.getAssetsAsync(options);
    const items: PhotoItem[] = assets.assets.map((a) => ({
      id: a.id,
      uri: a.uri,
      width: a.width,
      height: a.height,
      creationTime: a.creationTime,
    }));

    setPhotos(items);
    setLoading(false);
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) {
      loadPhotos();
    }
  };

  const handleShare = async (uri: string) => {
    try {
      await Share.share({ url: uri });
    } catch {
      Alert.alert("Error", "Could not share photo");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Delete this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await MediaLibrary.deleteAssetsAsync([id]);
          setPhotos((prev) => prev.filter((p) => p.id !== id));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gallery</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowAlbums(!showAlbums)}>
            <Ionicons name="albums-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleCamera}>
            <Ionicons name="camera-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {showAlbums && (
        <View style={styles.albumBar}>
          <TouchableOpacity
            style={[styles.albumChip, !selectedAlbum && styles.albumChipActive]}
            onPress={() => { setSelectedAlbum(null); setShowAlbums(false); }}
          >
            <Text style={[styles.albumChipText, !selectedAlbum && styles.albumChipTextActive]}>All</Text>
          </TouchableOpacity>
          {albums.map((album) => (
            <TouchableOpacity
              key={album.id}
              style={[styles.albumChip, selectedAlbum === album.id && styles.albumChipActive]}
              onPress={() => { setSelectedAlbum(album.id); setShowAlbums(false); }}
            >
              <Text style={[styles.albumChipText, selectedAlbum === album.id && styles.albumChipTextActive]}>
                {album.title} ({album.assetCount})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.photoCell} onLongPress={() => handleDelete(item.id)}>
            <Image source={{ uri: item.uri }} style={styles.photoImage} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>Loading photos...</Text>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={48} color="#334155" />
              <Text style={styles.emptyText}>No photos</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center" },
  albumBar: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  albumChip: { backgroundColor: "#1a1a1a", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  albumChipActive: { backgroundColor: "#6366F1" },
  albumChipText: { color: "#94A3B8", fontSize: 12 },
  albumChipTextActive: { color: "#fff", fontWeight: "600" },
  photoCell: { flex: 1 / 3, aspectRatio: 1, padding: 1 },
  photoImage: { width: "100%", height: "100%" },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#64748B", textAlign: "center", marginTop: 16, fontSize: 15 },
});
