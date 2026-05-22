import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const CustomsNav: React.FC = () => {
  const router = useRouter();

  const navItems = [
    { label: 'Dashboard', path: '/(civic)/customs' },
    { label: 'Declarations', path: '/(civic)/customs/declarations' },
    { label: 'Duties', path: '/(civic)/customs/duties' },
    { label: 'Inspections', path: '/(civic)/customs/inspections' },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item, index) => (
        <TouchableOpacity key={index} onPress={() => router.push(item.path as any)} style={styles.item}>
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  item: { paddingHorizontal: 16, paddingVertical: 8 },
  label: { fontSize: 14, color: '#374151' },
});

export default CustomsNav;
