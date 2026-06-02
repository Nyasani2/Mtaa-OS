/**
 * ASISActionButtons Component
 * Renders suggestion chips and quick action buttons
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ChatTheme, LIGHT_THEME } from '../types';

interface ASISActionButtonsProps {
  suggestions: string[];
  onPress: (suggestion: string) => void;
  theme?: ChatTheme;
}

export const ASISActionButtons: React.FC<ASISActionButtonsProps> = ({
  suggestions,
  onPress,
  theme = LIGHT_THEME,
}) => {
  if (suggestions.length === 0) return null;

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessibilityLabel="Suggested actions"
        accessibilityRole="scrollbar"
      >
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion}-${index}`}
            style={styles.chip}
            onClick={() => onPress(suggestion)}
            accessibilityLabel={suggestion}
            accessibilityRole="button"
          >
            <Text style={styles.chipText}>{suggestion}</Text>
          </button>
        ))}
      </ScrollView>
    </View>
  );
};

const Text: React.FC<any> = ({ style, children }) => (
  <span style={style}>{children}</span>
);

const createStyles = (theme: ChatTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingVertical: theme.spacing.sm,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    chip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.2s',
    },
    chipText: {
      fontSize: theme.typography.sizeSm,
      color: theme.colors.primary,
      fontWeight: '500',
    },
  });

export default ASISActionButtons;
