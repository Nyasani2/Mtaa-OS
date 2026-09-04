import React, { useState } from "react";
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Alert, useRouter } from "expo-router";
import EducationService from "@/lib/services/education-service";
import { Ionicons } from '@expo/vector-icons';

const TYPES = ["book", "digital", "video", "audio"];

export default function UploadLibraryItemScreen() {
  const router = useRouter();
  const [institutionId, setInstitutionId] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("book");
  const [fileUrl, setFileUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!institutionId.trim() || !title.trim()) {
      Alert.alert("Error", "Institution ID and Title are required");
      return;
    }
    try {
      setLoading(true);
      await EducationService.uploadLibraryItem({
        institution_id: institutionId.trim(),
        title: title.trim(),
        author: author.trim() || undefined,
        isbn: isbn.trim() || undefined,
        category: category.trim() || undefined,
        type: type as any,
        file_url: fileUrl.trim() || undefined,
        cover_url: coverUrl.trim() || undefined,
        quantity: parseInt(quantity) || 1,
        available: parseInt(quantity) || 1,
        status: "active",
      });
      Alert.alert("Success", "Item added to library", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: "#94a3b8", marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>Add to Library</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Upload a book or media item</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Institution ID</Text>
          <TextInput
            value={institutionId}
            onChangeText={setInstitutionId}
            placeholder="Enter institution UUID"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Item title"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Author</Text>
          <TextInput
            value={author}
            onChangeText={setAuthor}
            placeholder="Author name"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginRight: 8 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>ISBN</Text>
            <TextInput
              value={isbn}
              onChangeText={setIsbn}
              placeholder="ISBN"
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
            />
          </View>
          <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginLeft: 8 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Quantity</Text>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              placeholder="1"
              keyboardType="numeric"
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
            />
          </View>
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Category</Text>
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Science, Literature"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Type</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={{
                  backgroundColor: type === t ? "#0ea5e9" : "#0f172a",
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 8,
                  margin: 4,
                  borderWidth: 1,
                  borderColor: type === t ? "#0ea5e9" : "#334155",
                }}
              >
                <Text style={{ color: type === t ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: "600", textTransform: "capitalize" }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>File URL (optional)</Text>
          <TextInput
            value={fileUrl}
            onChangeText={setFileUrl}
            placeholder="https://..."
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" }}>Cover URL (optional)</Text>
          <TextInput
            value={coverUrl}
            onChangeText={setCoverUrl}
            placeholder="https://..."
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#0f172a", borderRadius: 8, padding: 12, color: "#f8fafc", fontSize: 15, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <TouchableOpacity
          onPress={handleUpload}
          disabled={loading}
          style={{ backgroundColor: loading ? "#1e3a5f" : "#0ea5e9", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 32, flexDirection: "row", justifyContent: "center" }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 }}>Add to Library</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
