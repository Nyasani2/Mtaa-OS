import React from 'react';
import { View, Text, Image, FlatList, StyleSheet } from 'react-native';
import { TribeMember } from '../types';

interface Props {
  members: TribeMember[];
}

export const TribeMemberList: React.FC<Props> = ({ members }) => (
  <FlatList
    data={members}
    keyExtractor={item => item.id}
    renderItem={({ item }) => (
      <View style={styles.row}>
        <Image source={{ uri: item.profile?.avatar_url || 'https://via.placeholder.com/40' }} style={styles.avatar} />
        <View>
          <Text style={styles.name}>{item.profile?.full_name || 'Member'}</Text>
          <Text style={styles.role}>{item.role} • {item.membership_status}</Text>
        </View>
      </View>
    )}
  />
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  name: { color: '#fff', fontWeight: 'bold' },
  role: { color: '#a0a0a0', fontSize: 12, marginTop: 2 }
});
