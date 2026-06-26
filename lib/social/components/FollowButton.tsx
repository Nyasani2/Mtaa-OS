import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFollow } from '../hooks/useFollow';

interface FollowButtonProps {
  targetProfileId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'outline';
}

export function FollowButton({ targetProfileId, size = 'md', variant = 'primary' }: FollowButtonProps) {
  const { isFollowing, isPending, loading, follow, unfollow, checkFollowStatus } = useFollow(targetProfileId);

  useEffect(() => { checkFollowStatus(); }, [checkFollowStatus]);

  const handlePress = () => {
    if (isFollowing) unfollow();
    else follow();
  };

  const sizeStyles = {
    sm: { paddingVertical: 4, paddingHorizontal: 12, fontSize: 12 },
    md: { paddingVertical: 8, paddingHorizontal: 20, fontSize: 14 },
    lg: { paddingVertical: 12, paddingHorizontal: 28, fontSize: 16 },
  };

  const variantStyles = {
    primary: { backgroundColor: isFollowing ? '#6B7280' : '#3B82F6', color: '#fff' },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: isFollowing ? '#6B7280' : '#3B82F6', color: isFollowing ? '#6B7280' : '#3B82F6' },
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading}
      style={[styles.button, sizeStyles[size], variantStyles[variant]]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? '#3B82F6' : '#fff'} />
      ) : (
        <Text style={[styles.text, { color: variantStyles[variant].color, fontSize: sizeStyles[size].fontSize }]}>
          {isFollowing ? 'Following' : isPending ? 'Pending' : 'Follow'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  text: { fontWeight: '600' },
});
