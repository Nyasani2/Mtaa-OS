import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EducationIndex() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Education</Text>
      <Text>Access schools, teachers, lessons, and educational resources.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 }
});
