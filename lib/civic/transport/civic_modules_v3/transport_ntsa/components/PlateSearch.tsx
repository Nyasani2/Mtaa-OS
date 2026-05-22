import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import VehicleCard from './VehicleCard';
import { useTransport } from '../controllers/useTransport';

const PlateSearch: React.FC = () => {
  const [plate, setPlate] = useState('');
  const { searchPlate, selectedItem, isLoading, error } = useTransport();

  const handleSearch = async () => {
    if (!plate.trim()) return;
    await searchPlate(plate);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter plate number"
        value={plate}
        onChangeText={setPlate}
      />
      <Button title={isLoading ? 'Searching...' : 'Search'} onPress={handleSearch} disabled={isLoading} />
      {error && <Text style={styles.error}>{error}</Text>}
      {selectedItem && <VehicleCard vehicle={selectedItem} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  error: { color: '#ef4444', marginTop: 12 },
});

export default PlateSearch;
