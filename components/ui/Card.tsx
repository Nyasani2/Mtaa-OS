import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  footer?: React.ReactNode;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title, subtitle, icon, iconColor = '#1E40AF', iconBg = '#EFF6FF', onPress, children, badge, badgeColor = '#10B981', footer, disabled = false,
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, disabled, activeOpacity: 0.8 } : {};
  return (
    <Wrapper style={[styles.container, disabled && styles.disabled]} {...wrapperProps}>
      {(title || icon) && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {icon && <View style={[styles.iconBox, { backgroundColor: iconBg }]}><FontAwesome5 name={icon} size={16} color={iconColor} /></View>}
            <View style={styles.headerText}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
          {badge && <View style={[styles.badge, { backgroundColor: badgeColor + '15' }]}><Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text></View>}
        </View>
      )}
      {children && <View style={styles.body}>{children}</View>}
      {footer && <View style={styles.footer}>{footer}</View>}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  disabled: { opacity: 0.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#334155' },
  subtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  body: { marginTop: 4 },
  footer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
});
