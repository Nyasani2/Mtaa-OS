import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ImageBackground,
  StatusBar,
  Animated,
} from 'react-native'

import { Ionicons } from '@expo/vector-icons'
import { getInstalledApps } from './app-runtime/registry'
import { launchApp } from './_kernel/runtime/OSSystemBridge'

export default function Launcher() {
  const [time, setTime] = useState('')
  const [launchingApp, setLaunchingApp] =
    useState<string | null>(null)

  const apps = getInstalledApps()

  const scaleAnim = useRef(
    new Animated.Value(1)
  ).current

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()

      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      )
    }

    updateTime()

    const interval = setInterval(
      updateTime,
      1000
    )

    return () => clearInterval(interval)
  }, [])

  const runMorph = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 120,
        useNativeDriver: true,
      }),

      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const handleLaunch = (item: any) => {
    setLaunchingApp(item.id)

    runMorph()

    setTimeout(() => {
      launchApp(item.id, item.route)

      setLaunchingApp(null)
    }, 180)
  }

  return (
    <ImageBackground
      source={require('@/assets/images/mtaa_home.jpg')}
      resizeMode="cover"
      style={styles.background}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View style={styles.overlay} />

      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              {
                scale: scaleAnim,
              },
            ],
          },
        ]}
      >
        {/* TOP BAR */}

        <View style={styles.topBar}>
          <Text style={styles.time}>
            {time}
          </Text>

          <View style={styles.icons}>
            <Ionicons
              name="wifi"
              size={18}
              color="#fff"
            />

            <Ionicons
              name="cellular"
              size={18}
              color="#fff"
            />

            <Ionicons
              name="battery-full"
              size={20}
              color="#fff"
            />
          </View>
        </View>

        {/* HEADER */}

        <View style={styles.header}>
          <Text style={styles.title}>
            MTAA OS
          </Text>

          <Text style={styles.subtitle}>
            Sovereign African Operating System
          </Text>
        </View>

        {/* GRID */}

        <FlatList
          data={apps}
          keyExtractor={(item) => item.id}
          numColumns={4}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const isLaunching =
              launchingApp === item.id

            return (
              <Pressable
                style={[
                  styles.app,
                  isLaunching && {
                    transform: [
                      { scale: 1.12 },
                    ],
                    opacity: 0.55,
                  },
                ]}
                onPress={() =>
                  handleLaunch(item)
                }
              >
                <View style={styles.iconBox}>
                  <Ionicons
                    name={item.icon as any}
                    size={30}
                    color="#fff"
                  />
                </View>

                <Text style={styles.label}>
                  {item.name}
                </Text>
              </Pressable>
            )
          }}
        />
      </Animated.View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      'rgba(0,0,0,0.28)',
  },

  container: {
    flex: 1,
    paddingTop: 58,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    paddingHorizontal: 18,
  },

  time: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  icons: {
    flexDirection: 'row',
    gap: 10,
  },

  header: {
    paddingHorizontal: 18,
    marginTop: 24,
  },

  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
  },

  subtitle: {
    color: '#ccc',
    marginTop: 4,
    fontSize: 13,
  },

  grid: {
    paddingTop: 40,
    paddingHorizontal: 12,
  },

  app: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 28,
  },

  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor:
      'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  label: {
    color: '#fff',
    fontSize: 11,
    marginTop: 8,
  },
})
