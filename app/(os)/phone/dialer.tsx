import { View, Text, StyleSheet, Pressable, TextInput, Platform, Linking, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DialerScreen() {
  const router = useRouter();
  const [number, setNumber] = useState('');

  const dial = (digit: string) => setNumber((prev) => prev + digit);
  const clear = () => setNumber((prev) => prev.slice(0, -1));
  
  const makeCall = () => {
    if (!number) return;
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Calling requires a physical phone with a SIM card.');
      return;
    }
    // This opens the native Android/iOS dialer, which handles the SIM connection and gives you speaker/mute controls
    Linking.openURL(`tel:${number}`);
  };

  const makeVideoCall = () => {
    if (!number) return;
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Video calling requires a physical phone.');
      return;
    }
    // Opens a secure, free Jitsi Meet room for this number
    const cleanNumber = number.replace(/[^0-9]/g, '');
    Linking.openURL(`https://meet.jit.si/MTAA-${cleanNumber}`);
  };

  const keys = ['1','2','3','4','5','6','7','8','9','*','0','#'];

  return (
    <View style={styles.container}>
      {/* Top Display Area */}
      <View style={styles.displayContainer}>
        <TextInput
          style={styles.display}
          value={number}
          editable={false}
          placeholder="Enter number"
          placeholderTextColor="#666"
        />
        {number.length > 0 && (
          <Pressable style={styles.backspaceBtn} onPress={clear}>
            <Ionicons name="backspace-outline" size={28} color="#fff" />
          </Pressable>
        )}
      </View>
      
      {/* Bottom Keypad Area */}
      <View style={styles.padContainer}>
        <View style={styles.pad}>
          {keys.map((k) => (
            <Pressable key={k} style={styles.key} onPress={() => dial(k)}>
              <Text style={styles.keyText}>{k}</Text>
            </Pressable>
          ))}
        </View>
        
        <View style={styles.actions}>
          <Pressable style={styles.videoBtn} onPress={makeVideoCall}>
            <Ionicons name="videocam" size={24} color="#fff" />
            <Text style={styles.actionText}>Video</Text>
          </Pressable>
          <Pressable style={styles.callBtn} onPress={makeCall}>
            <Ionicons name="call" size={24} color="#000" />
            <Text style={styles.callText}>Call</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0d1117', 
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  display: { 
    color: '#fff', 
    fontSize: 32, 
    textAlign: 'center', 
    flex: 1,
  },
  backspaceBtn: {
    padding: 10,
  },
  padContainer: {
    alignItems: 'center',
  },
  pad: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    width: 280,
    marginBottom: 30,
  },
  key: { 
    width: 70, 
    height: 70, 
    backgroundColor: '#1c2128', 
    margin: 6, 
    borderRadius: 35, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  keyText: { 
    color: '#fff', 
    fontSize: 28,
    fontWeight: '300',
  },
  actions: { 
    flexDirection: 'row', 
    gap: 20, 
    justifyContent: 'center',
    width: '100%',
  },
  callBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#34d399', 
    paddingVertical: 16, 
    paddingHorizontal: 40, 
    borderRadius: 30,
  },
  callText: { 
    color: '#000', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  }
});
