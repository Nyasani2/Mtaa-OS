import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

export default function AssignmentSubmitScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const assignmentId = typeof id === "string" ? id : "";

  const [text, setText] = useState("");
  const [file, setFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setFile(result.assets[0]);
    } catch (err) {
      Alert.alert("Error", "Could not pick file.");
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file || !user?.id) return null;
    setUploading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const fileExt = file.name.split(".").pop() || "bin";
      const filePath = `assignments/${assignmentId}/${user.id}/${Date.now()}.${fileExt}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("education-submissions")
        .upload(filePath, blob, { contentType: file.mimeType || "application/octet-stream" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("education-submissions").getPublicUrl(filePath);
      return urlData?.publicUrl || null;
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Could not upload file.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() && !file) {
      Alert.alert("Required", "Please write a response or attach a file.");
      return;
    }
    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to submit.");
      return;
    }

    setSubmitting(true);
    try {
      let attachmentUrl: string | null = null;
      if (file) {
        attachmentUrl = await uploadFile();
        if (!attachmentUrl) { setSubmitting(false); return; }
      }

      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_assignment_submissions").insert({
        assignment_id: assignmentId,
        student_id: user.id,
        submission_text: text.trim() || null,
        attachment_url: attachmentUrl,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });
      if (error) throw error;

      Alert.alert("Submitted!", "Your assignment has been submitted successfully.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert("Submit Failed", err.message || "Could not submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#000" }} contentContainerStyle={{ padding: 16, paddingTop: 48, paddingBottom: 40 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginLeft: 12, flex: 1 }}>Submit Assignment</Text>
      </View>

      <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginBottom: 8 }}>Your Response</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Type your answer or notes here..."
        placeholderTextColor="#475569"
        multiline
        style={{ color: "#fff", fontSize: 14, lineHeight: 20, backgroundColor: "#1e293b", borderRadius: 10, padding: 14, minHeight: 120, textAlignVertical: "top", marginBottom: 16 }}
      />

      <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginBottom: 8 }}>Attachment</Text>
      <TouchableOpacity onPress={pickFile} style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#334155", borderStyle: "dashed" }}>
        <Ionicons name="cloud-upload-outline" size={22} color="#0ea5e9" />
        <Text style={{ color: "#0ea5e9", marginLeft: 10, fontSize: 14, fontWeight: "600", flex: 1 }}>
          {file ? file.name : "Tap to upload PDF, image, or document"}
        </Text>
        {file && <Ionicons name="checkmark-circle" size={20} color="#22c55e" />}
      </TouchableOpacity>

      {uploading && (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <ActivityIndicator size="small" color="#0ea5e9" />
          <Text style={{ color: "#94a3b8", marginLeft: 8, fontSize: 13 }}>Uploading file...</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting || uploading}
        style={{ backgroundColor: "#0ea5e9", paddingVertical: 14, borderRadius: 12, alignItems: "center", opacity: submitting || uploading ? 0.6 : 1 }}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Submit</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
