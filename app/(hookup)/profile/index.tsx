import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";

import { useState } from "react";

import {
  pickProfileImage,
  uploadProfileImage,
} from "../../../lib/hookup/profile/hookup-media-engine";

export default function ProfileScreen() {

  const [displayName, setDisplayName] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [country, setCountry] =
    useState("");

  async function uploadPhoto() {

    try {

      const image =
        await pickProfileImage();

      if (!image) return;

      await uploadProfileImage(
        "demo-user",
        image
      );

      Alert.alert(
        "Success",
        "Photo uploaded."
      );

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Error",
        "Upload failed."
      );
    }
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: "#050816",
        padding: 20,
      }}
    >

      <Text
        style={{
          color: "white",
          fontSize: 30,
          fontWeight: "bold",
          marginBottom: 30,
        }}
      >
        👤 My Profile
      </Text>

      <Pressable
        onPress={uploadPhoto}
        style={{
          backgroundColor: "#111827",
          padding: 18,
          borderRadius: 14,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
          }}
        >
          Upload Profile Photo
        </Text>
      </Pressable>

      <TextInput
        value={displayName}
        onChange={setDisplayName}
        placeholder="Display Name"
        placeholderTextColor="#6B7280"
        style={{
          backgroundColor: "#111827",
          color: "white",
          padding: 18,
          borderRadius: 14,
          marginBottom: 16,
        }}
      />

      <TextInput
        value={bio}
        onChange={setBio}
        placeholder="Bio"
        multiline
        placeholderTextColor="#6B7280"
        style={{
          backgroundColor: "#111827",
          color: "white",
          padding: 18,
          borderRadius: 14,
          marginBottom: 16,
          minHeight: 120,
        }}
      />

      <TextInput
        value={country}
        onChange={setCountry}
        placeholder="Country"
        placeholderTextColor="#6B7280"
        style={{
          backgroundColor: "#111827",
          color: "white",
          padding: 18,
          borderRadius: 14,
          marginBottom: 16,
        }}
      />

      <Pressable
        style={{
          backgroundColor: "#EC4899",
          padding: 18,
          borderRadius: 14,
          marginTop: 10,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Save Profile
        </Text>
      </Pressable>

    </ScrollView>
  );
}
