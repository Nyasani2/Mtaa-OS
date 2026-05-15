import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CreditCard,
  Car,
  Users,
  ShoppingBag,
  Shield,
} from 'lucide-react-native';

import { Colors } from '@/constants/Colors';

export default function HomeScreen() {
  const router = useRouter();

  const apps = [
    {
      label: 'Wallet',
      icon: <CreditCard size={22} color={Colors.primary} />,
    },
    {
      label: 'MTaxi',
      icon: <Car size={22} color={Colors.primary} />,
      route: '/(os)/mtaxi',
    },
    {
      label: 'Tribes',
      icon: <Users size={22} color={Colors.primary} />,
      route: '/(os)/tribes',
    },
    {
      label: 'Market',
      icon: <ShoppingBag size={22} color={Colors.primary} />,
      route: '/(os)/market',
    },
    {
      label: 'Civic',
      icon: <Shield size={22} color={Colors.primary} />,
      route: '/(os)/civic',
    },
  ];

  return (
    <ImageBackground
      source={require('@/assets/images/mtaa_home.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.container}>
        <Text style={styles.title}>MTAA OS</Text>
        <Text style={styles.subtitle}>Unified Civic Runtime</Text>

        <View style={styles.grid}>
          {apps.map((app) => (
            <TouchableOpacity
              key={app.label}
              style={styles.card}
              onPress={() => router.push(app.route as any)}
            >
              {app.icon}
              <Text style={styles.label}>{app.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  container: {
    flex: 1,
    padding: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginTop: 20,
  },

  subtitle: {
    fontSize: 14,
    color: '#ddd',
    marginBottom: 20,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  card: {
    width: '30%',
    backgroundColor: 'rgba(20,20,20,0.75)',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  label: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
