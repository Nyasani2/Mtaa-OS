import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

export default function StorageScreen() {
  const [storage, setStorage] = useState({ used: 0, free: 0 });

  const calculate = async () => {
    const used = 120;
    const free = 800;
    setStorage({ used, free });
  };

  useEffect(() => { calculate(); }, []);

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Storage</Text>

      <Text>Used: {storage.used} MB</Text>
      <Text>Free: {storage.free} MB</Text>

      <TouchableOpacity onPress={calculate}>
        <Text style={{ color: '#6366f1', marginTop: 20 }}>Refresh</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
