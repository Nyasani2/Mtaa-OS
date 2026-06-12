import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
  icon?: string;
  style?: any;
}

export default function Card({ title, children, onPress, icon, style }: CardProps) {
  const content = (
    <View style={[styles.card, style]}>
      {title && (
        <View style={styles.header}>
          {icon && <FontAwesome5 name={icon} size={16} color="#666" style={styles.icon} />}
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      <View style={styles.body}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  body: {
    flex: 1,
  },
});
