import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Share } from 'react-native';
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Ionicons } from '@expo/vector-icons';

interface DocumentItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uri: string;
  date: string;
}

export default function DocumentsShell() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docDir = FileSystem.documentDirectory + "documents/";
      const dirInfo = await FileSystem.getInfoAsync(docDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(docDir, { intermediates: true });
      }
      const files = await FileSystem.readDirectoryAsync(docDir);
      const items: DocumentItem[] = [];
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(docDir + file);
        if (fileInfo.exists && !fileInfo.isDirectory) {
          // fileInfo is now narrowed to FileInfo with size
          const info = fileInfo as FileSystem.FileInfo & { size: number; modificationTime?: number };
          items.push({
            id: file,
            name: file,
            size: info.size || 0,
            type: file.split(".").pop() || "unknown",
            uri: info.uri,
            date: new Date(info.modificationTime || Date.now()).toLocaleDateString(),
          });
        }
      }
      setDocuments(items);
    } catch {
      // Directory might not exist yet
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const docDir = FileSystem.documentDirectory + "documents/";
      const destUri = docDir + asset.name;

      await FileSystem.makeDirectoryAsync(docDir, { intermediates: true });
      await FileSystem.copyAsync({ from: asset.uri, to: destUri });

      const fileInfo = await FileSystem.getInfoAsync(destUri);
      const info = fileInfo as FileSystem.FileInfo & { size: number };
      const newDoc: DocumentItem = {
        id: asset.name,
        name: asset.name,
        size: info.size || 0,
        type: asset.name.split(".").pop() || "unknown",
        uri: destUri,
        date: new Date().toLocaleDateString(),
      };

      setDocuments((prev) => [newDoc, ...prev]);
      Alert.alert("Success", `${asset.name} uploaded`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to upload document");
    }
  };

  const handleShare = async (doc: DocumentItem) => {
    try {
      await Share.share({ url: doc.uri, title: doc.name });
    } catch {
      Alert.alert("Error", "Could not share document");
    }
  };

  const handleDelete = (doc: DocumentItem) => {
    Alert.alert("Delete", `Delete ${doc.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await FileSystem.deleteAsync(doc.uri);
          setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        },
      },
    ]);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getIcon = (type: string) => {
    const map: Record<string, string> = {
      pdf: "document-text",
      doc: "document",
      docx: "document",
      xls: "grid",
      xlsx: "grid",
      jpg: "image",
      jpeg: "image",
      png: "image",
      mp4: "videocam",
      mp3: "musical-notes",
    };
    return map[type.toLowerCase()] || "document";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documents</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
          <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.docRow}>
            <View style={styles.docLeft}>
              <View style={[styles.docIcon, { backgroundColor: item.type === "pdf" ? "#EF4444" : item.type.startsWith("image") ? "#22C55E" : "#6366F1" }]}>
                <Ionicons name={getIcon(item.type) as any} size={20} color="#fff" />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.docMeta}>{formatSize(item.size)} • {item.date}</Text>
              </View>
            </View>
            <View style={styles.docActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
                <Ionicons name="share-outline" size={18} color="#6366F1" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>Loading documents...</Text>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color="#334155" />
              <Text style={styles.emptyText}>No documents</Text>
              <Text style={styles.emptySub}>Tap upload to add files</Text>
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
  uploadBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center" },
  docRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  docLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  docIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  docInfo: { marginLeft: 12, flex: 1 },
  docName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  docMeta: { color: "#64748B", fontSize: 12, marginTop: 2 },
  docActions: { flexDirection: "row", gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#64748B", fontSize: 16, marginTop: 16 },
  emptySub: { color: "#94A3B8", fontSize: 13, marginTop: 4 },
});
