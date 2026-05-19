import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";

type Profile = {
  full_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  phone: string;
  location: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
    phone: "",
    location: "",
  });

  const handleChange = (key: keyof Profile, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#888"
        style={styles.input}
        value={profile.full_name}
        onChangeText={(text) => handleChange("full_name", text)}
      />

      <TextInput
        placeholder="Username"
        placeholderTextColor="#888"
        style={styles.input}
        value={profile.username}
        onChangeText={(text) => handleChange("username", text)}
      />

      <TextInput
        placeholder="Bio"
        placeholderTextColor="#888"
        style={styles.input}
        value={profile.bio}
        onChangeText={(text) => handleChange("bio", text)}
      />

      <TextInput
        placeholder="Phone"
        placeholderTextColor="#888"
        style={styles.input}
        value={profile.phone}
        onChangeText={(text) => handleChange("phone", text)}
      />

      <TextInput
        placeholder="Location"
        placeholderTextColor="#888"
        style={styles.input}
        value={profile.location}
        onChangeText={(text) => handleChange("location", text)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    marginBottom: 12,
    color: "#fff",
  },
});
