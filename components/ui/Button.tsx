import React, { useState, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconRight?: boolean;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; active: string }> = {
  primary: { bg: '#1E40AF', text: '#FFFFFF', active: '#1E3A8A' },
  secondary: { bg: '#F1F5F9', text: '#334155', active: '#E2E8F0' },
  danger: { bg: '#DC2626', text: '#FFFFFF', active: '#B91C1C' },
  ghost: { bg: 'transparent', text: '#1E40AF', active: '#EFF6FF' },
  success: { bg: '#059669', text: '#FFFFFF', active: '#047857' },
};

const sizeStyles: Record<ButtonSize, { padding: number; fontSize: number; iconSize: number }> = {
  sm: { padding: 8, fontSize: 12, iconSize: 12 },
  md: { padding: 12, fontSize: 14, iconSize: 14 },
  lg: { padding: 14, fontSize: 16, iconSize: 16 },
};

export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary', size = 'md', icon, iconRight = false, loading = false, disabled = false, fullWidth = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const handlePress = useCallback(async () => {
    if (disabled || loading || isLoading) return;
    setIsLoading(true);
    try { await onPress(); } finally { setIsLoading(false); }
  }, [onPress, disabled, loading, isLoading]);

  const isDisabled = disabled || loading || isLoading;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: isPressed && !isDisabled ? v.active : v.bg }, { paddingVertical: s.padding, paddingHorizontal: s.padding * 1.5 }, fullWidth && styles.fullWidth, isDisabled && styles.disabled]}
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {(loading || isLoading) ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon && !iconRight && <FontAwesome5 name={icon} size={s.iconSize} color={v.text} style={styles.iconLeft} />}
          <Text style={[styles.label, { color: v.text, fontSize: s.fontSize }]}>{label}</Text>
          {icon && iconRight && <FontAwesome5 name={icon} size={s.iconSize} color={v.text} style={styles.iconRight} />}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, gap: 8 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  label: { fontWeight: '700' },
  iconLeft: { marginRight: 4 },
  iconRight: { marginLeft: 4 },
});
