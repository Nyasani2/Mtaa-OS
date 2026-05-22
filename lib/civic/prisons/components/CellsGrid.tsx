import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCells } from '../hooks/useCells';

interface Props {
  facilityId: string;
}

export default function CellsGrid({ facilityId }: Props) {
  const { cells, loading } = useCells(facilityId);

  if (loading) return <Text>Loading cells...</Text>;

  return (
    <View style={styles.grid}>
      {cells.map((cell: any) => {
        const occupancy = cell.current_occupancy || 0;
        const capacity = cell.capacity || 1;
        const isFull = occupancy >= capacity;
        return (
          <View key={cell.id} style={[styles.cell, isFull ? styles.full : styles.available]}>
            <Text style={styles.cellNumber}>Cell {cell.cell_number}</Text>
            <Text>{occupancy}/{capacity}</Text>
            <Text style={styles.type}>{cell.cell_type}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 8 },
  cell: { width: '30%', padding: 12, borderRadius: 8, alignItems: 'center' },
  available: { backgroundColor: '#e8f5e9' },
  full: { backgroundColor: '#ffebee' },
  cellNumber: { fontWeight: '600', fontSize: 14 },
  type: { fontSize: 10, color: '#666', marginTop: 4 }
});
