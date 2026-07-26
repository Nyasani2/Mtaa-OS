import React from 'react';
import { FlatList } from 'react-native';
import PropertyCard from './PropertyCard';

export default function PropertyList({ properties, onSelect }: { properties: any[]; onSelect?: (p: any) => void }) {
  return (
    <FlatList
      data={properties}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PropertyCard property={item} onPress={() => onSelect?.(item)} />}
    />
  );
}
