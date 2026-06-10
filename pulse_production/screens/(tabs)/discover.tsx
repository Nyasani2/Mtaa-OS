import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { usePulseSearch } from '@/domains/pulse/hooks/usePulseHome';

export default function DiscoverScreen() {
  const { query, results, suggestions, isLoading, setQuery, search, getSuggestions } = usePulseSearch();
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Pulse..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            getSuggestions(text);
            setShowSuggestions(text.length > 0);
          }}
          onSubmitEditing={() => { search(query); setShowSuggestions(false); }}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setShowSuggestions(false); }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={i} style={styles.suggestion} onPress={() => { setQuery(s); search(s); setShowSuggestions(false); }}>
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.results}>
        {isLoading && <ActivityIndicator color="#FF6B35" style={{ marginTop: 40 }} />}
        {results.map((result) => (
          <TouchableOpacity key={result.id} style={styles.resultCard}>
            <Text style={styles.resultType}>{result.entity_type}</Text>
            <Text style={styles.resultTitle}>{result.title}</Text>
            {result.description && <Text style={styles.resultDesc}>{result.description}</Text>}
          </TouchableOpacity>
        ))}
        {!isLoading && !results.length && query.length > 0 && (
          <Text style={styles.empty}>No results for "{query}"</Text>
        )}
        {!query && (
          <Text style={styles.empty}>Search for people, creators, businesses, jobs, events...</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', margin: 16, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 4 },
  clearIcon: { color: 'rgba(255,255,255,0.5)', fontSize: 16, padding: 4 },
  suggestions: { backgroundColor: '#1a1a2e', marginHorizontal: 16, borderRadius: 8, marginTop: -8, marginBottom: 8 },
  suggestion: { padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  suggestionText: { color: '#fff', fontSize: 14 },
  results: { flex: 1, padding: 16 },
  resultCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, marginBottom: 8 },
  resultType: { fontSize: 11, color: '#FF6B35', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  resultTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  resultDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  empty: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 },
});
