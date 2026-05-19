/**
 * MTAA OS — Profile Settings Screen
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';

export default function ProfileScreen() {
  const [profile, setProfile] = useState({
    full_name: '',
    username: '',
    bio: '',
    phone: '',
    location: '',
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile Settings</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        value={profile.full_name}
        onChangeText={(text) =>
          setProfile(p => ({ ...p, full_name: text }))
        }
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Username</Text>
      <TextInput
        value={profile.username}
        onChangeText={(text) =>
          setProfile(p => ({ ...p, username: text }))
        }
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        value={profile.bio}
        onChangeText={(text) =>
          setProfile(p => ({ ...p, bio: text }))
        }
        style={styles.input}
        placeholder="Bio"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        value={profile.phone}
        onChangeText={(text) =>
          setProfile(p => ({ ...p, phone: text }))
        }
        style={styles.input}
        placeholder="Phone"
        placeholderTextColor="#888"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        value={profile.location}
        onChangeText={(text) =>
          setProfile(p => ({ ...p, location: text }))
        }
        style={styles.input}
        placeholder="Location"
        placeholderTextColor="#888"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0f172a' },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 20 },
  label: { fontSize: 12, color: '#94a3b8', marginTop: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginTop: 6,
  },
});
