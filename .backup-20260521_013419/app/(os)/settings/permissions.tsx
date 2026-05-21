import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';

export default function PermissionsScreen() {
  const [perms, setPerms] = useState({
    notifications: false,
    location: false,
    camera: false,
  });

  useEffect(() => {
    setPerms({
      notifications: true,
      location: true,
      camera: false,
    });
  }, []);

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Permissions</Text>

      <Text>Notifications: {String(perms.notifications)}</Text>
      <Text>Location: {String(perms.location)}</Text>
      <Text>Camera: {String(perms.camera)}</Text>
    </ScrollView>
  );
}
