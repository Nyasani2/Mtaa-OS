import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/lib/stores/auth-store';

export function withRoleGuard(
  WrappedComponent: any,
  allowedRoles: string[] = []
) {
  return function GuardedComponent(props: any) {
    const router = useRouter();

    const { role, accountType } = useAuthStore();

    const isAllowed =
      allowedRoles.length === 0 ||
      allowedRoles.includes(role || '') ||
      accountType === 'government';

    useEffect(() => {
      if (!isAllowed) {
        router.replace('/(auth)/login');
      }
    }, [isAllowed]);

    if (!isAllowed) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#0A0A0A',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 20,
              fontWeight: 'bold',
              marginBottom: 12,
            }}
          >
            Access Restricted
          </Text>

          <Text
            style={{
              color: '#888',
              textAlign: 'center',
            }}
          >
            You do not have permission to access this module.
          </Text>
        </View>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
