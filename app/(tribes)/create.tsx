// @ts-nocheck
// app/(os)/tribes/create.tsx
// Create Tribe Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tribesService } from '@/lib/tribes/services/tribes.service';

export default function CreateTribeScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [fee, setFee] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [isPrivate, setIsPrivate] = useState(false);
  const [rules, setRules] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    tribesService.getCategories().then(setCategories);
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Enter a tribe name');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Enter a description');
      return;
    }

    setCreating(true);
    const res = await tribesService.createTribe({
      name: name.trim(),
      description: description.trim(),
      category_id: categoryId || undefined,
      is_paid: isPaid,
      membership_fee: isPaid ? parseFloat(fee) || 0 : 0,
      membership_currency: currency,
      is_private: isPrivate,
      rules: rules.trim() || undefined,
      location: location.trim() || undefined,
      tags: tags.split(',').map((t: any) => t.trim()).filter(Boolean),
    });
    setCreating(false);

    if (res.success && res.tribe) {
      Alert.alert('Created!', `Your tribe "${res.tribe.name}" is live.`, [
        { text: 'View Tribe', onPress: () => router.replace(`/(os)/tribes/${res.tribe!.id}`) },
      ]);
    } else {
      Alert.alert('Error', res.error || 'Could not create tribe');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Tribe</Text>
          <View style={{ width: 30 }} />
        </View>

        <TextInput style={styles.input} placeholder="Tribe Name" placeholderTextColor="#666" value={name} onChangeText={setName} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Description" placeholderTextColor="#666" value={description} onChangeText={setDescription} multiline numberOfLines={4} />

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, categoryId === cat.id && styles.catChipActive]}
              onPress={() => setCategoryId(cat.id)}
            >
              <Text style={styles.catChipIcon}>{cat.icon}</Text>
              <Text style={categoryId === cat.id ? styles.catChipTextActive : styles.catChipText}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Paid Membership</Text>
          <Switch value={isPaid} onValueChange={setIsPaid} trackColor={{ false: '#2a2a3e', true: '#007AFF' }} />
        </View>

        {isPaid && (
          <View style={styles.feeRow}>
            <TextInput style={[styles.input, styles.feeInput]} placeholder="Fee" placeholderTextColor="#666" keyboardType="decimal-pad" value={fee} onChangeText={setFee} />
            <TextInput style={[styles.input, styles.currencyInput]} placeholder="Currency" placeholderTextColor="#666" value={currency} onChangeText={setCurrency} />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Private Tribe</Text>
          <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ false: '#2a2a3e', true: '#007AFF' }} />
        </View>

        <TextInput style={[styles.input, styles.textArea]} placeholder="Rules (optional)" placeholderTextColor="#666" value={rules} onChangeText={setRules} multiline numberOfLines={3} />
        <TextInput style={styles.input} placeholder="Location (optional)" placeholderTextColor="#666" value={location} onChangeText={setLocation} />
        <TextInput style={styles.input} placeholder="Tags (comma separated)" placeholderTextColor="#666" value={tags} onChangeText={setTags} />

        <TouchableOpacity style={[styles.createBtn, creating && styles.createBtnDisabled]} onPress={handleCreate} disabled={creating}>
          {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create Tribe</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { fontSize: 24, color: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  input: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', marginBottom: 12, borderWidth: 1, borderColor: '#2a2a3e' },
  textArea: { height: 100, textAlignVertical: 'top' },
  label: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 10 },
  catScroll: { marginBottom: 12 },
  catChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#2a2a3e' },
  catChipActive: { borderColor: '#007AFF', backgroundColor: '#0d1b3e' },
  catChipIcon: { fontSize: 16, marginRight: 6 },
  catChipText: { fontSize: 13, color: '#ccc' },
  catChipTextActive: { fontSize: 13, color: '#fff', fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  switchLabel: { fontSize: 15, color: '#fff' },
  feeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  feeInput: { flex: 2, marginBottom: 0 },
  currencyInput: { flex: 1, marginBottom: 0 },
  createBtn: { backgroundColor: '#007AFF', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 10 },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
