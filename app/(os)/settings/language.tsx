import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'sw' | 'fr' | 'am' | 'zu' | 'yo' | 'ig' | 'ha';

export default function LanguageScreen() {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('mtaa_language');
      if (saved) setCurrentLang(saved as Language);
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  const handleSelect = async (lang: Language) => {
    setCurrentLang(lang);
    try {
      await AsyncStorage.setItem('mtaa_language', lang);
    } catch (e) {
      // ignore
    }
  };

  const languages: { id: Language; name: string; native: string; flag: string }[] = [
    { id: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { id: 'sw', name: 'Swahili', native: 'Kiswahili', flag: '🇰🇪' },
    { id: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
    { id: 'am', name: 'Amharic', native: 'አማርኛ', flag: '🇪🇹' },
    { id: 'zu', name: 'Zulu', native: 'isiZulu', flag: '🇿🇦' },
    { id: 'yo', name: 'Yoruba', native: 'Yorùbá', flag: '🇳🇬' },
    { id: 'ig', name: 'Igbo', native: 'Igbo', flag: '🇳🇬' },
    { id: 'ha', name: 'Hausa', native: 'Hausa', flag: '🇳🇬' },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Language</Text>
      <Text style={styles.subtitle}>Select your preferred language</Text>

      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.id}
          style={[
            styles.langCard,
            currentLang === lang.id && styles.langCardActive
          ]}
          onPress={() => handleSelect(lang.id)}
        >
          <Text style={styles.langFlag}>{lang.flag}</Text>
          <View style={styles.langInfo}>
            <Text style={styles.langName}>{lang.name}</Text>
            <Text style={styles.langNative}>{lang.native}</Text>
          </View>
          {currentLang === lang.id && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      ))}

      <Text style={styles.note}>
        More languages coming soon. Contact support to request your language.
      </Text>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  subtitle: { fontSize: 14, color: '#888', paddingHorizontal: 16, marginBottom: 24 },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  langCardActive: { borderColor: '#6366f1' },
  langFlag: { fontSize: 28, marginRight: 16 },
  langInfo: { flex: 1 },
  langName: { color: '#fff', fontSize: 16, fontWeight: '500' },
  langNative: { color: '#888', fontSize: 13, marginTop: 2 },
  checkmark: { color: '#22c55e', fontSize: 18, fontWeight: 'bold' },
  note: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 24, paddingHorizontal: 32 },
  backButton: { marginTop: 24, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
