import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native'

import { router } from 'expo-router'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth-store'

interface SecuritySettings {
  two_factor_enabled: boolean
  biometric_enabled: boolean
  pin_enabled: boolean
  session_timeout: number
  login_alerts: boolean
  transaction_confirm: boolean
}

export default function SecurityScreen() {
  const { user, signOut } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    biometric_enabled: false,
    pin_enabled: false,
    session_timeout: 30,
    login_alerts: true,
    transaction_confirm: true,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.log(error)
      }

      if (data) {
        setSettings({
          two_factor_enabled: data.two_factor_enabled || false,
          biometric_enabled: data.biometric_enabled || false,
          pin_enabled: data.pin_enabled || false,
          session_timeout: data.session_timeout || 30,
          login_alerts: data.login_alerts !== false,
          transaction_confirm: data.transaction_confirm !== false,
        })
      }
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (key: keyof SecuritySettings) => {
    if (!user?.id) return

    const newValue = !settings[key]

    setSettings((prev) => ({
      ...prev,
      [key]: newValue,
    }))

    setSaving(true)

    try {
      const { error } = await supabase
        .from('security_settings')
        .upsert({
          user_id: user.id,
          [key]: newValue,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        throw error
      }
    } catch (err: any) {
      Alert.alert('Save Failed', err.message)

      setSettings((prev) => ({
        ...prev,
        [key]: !newValue,
      }))
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()

      signOut()

      router.replace('/login')
    } catch (err: any) {
      Alert.alert('Logout Failed', err.message)
    }
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Security</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>
            Two-Factor Authentication
          </Text>

          <Switch
            value={settings.two_factor_enabled}
            onValueChange={() =>
              handleToggle('two_factor_enabled')
            }
            trackColor={{
              false: '#333',
              true: '#6366f1',
            }}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>
            Biometric Login
          </Text>

          <Switch
            value={settings.biometric_enabled}
            onValueChange={() =>
              handleToggle('biometric_enabled')
            }
            trackColor={{
              false: '#333',
              true: '#6366f1',
            }}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>
            PIN Protection
          </Text>

          <Switch
            value={settings.pin_enabled}
            onValueChange={() =>
              handleToggle('pin_enabled')
            }
            trackColor={{
              false: '#333',
              true: '#6366f1',
            }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Session & Alerts
        </Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>
            Login Alerts
          </Text>

          <Switch
            value={settings.login_alerts}
            onValueChange={() =>
              handleToggle('login_alerts')
            }
            trackColor={{
              false: '#333',
              true: '#6366f1',
            }}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>
            Confirm Transactions
          </Text>

          <Switch
            value={settings.transaction_confirm}
            onValueChange={() =>
              handleToggle('transaction_confirm')
            }
            trackColor={{
              false: '#333',
              true: '#6366f1',
            }}
          />
        </View>
      </View>

      {saving && (
        <Text style={styles.saving}>
          Saving settings...
        </Text>
      )}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>
          ← Back
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  loader: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 30,
  },

  section: {
    marginBottom: 30,
  },

  sectionTitle: {
    color: '#666',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    paddingHorizontal: 20,
    textTransform: 'uppercase',
  },

  row: {
    backgroundColor: '#111',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },

  rowLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  saving: {
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 20,
  },

  logoutButton: {
    backgroundColor: '#dc2626',
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },

  logoutText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },

  backButton: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 50,
  },

  backText: {
    color: '#888',
    fontSize: 14,
  },
})
