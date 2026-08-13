import { useEffect, useState } from "react";
import MapView, { Marker } from "react-native-maps";

export default function LiveFleetMap() {
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    setVehicles([]);
  }, []);

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: -1.2921,
        longitude: 36.8219,
        latitudeDelta: 0.4,
        longitudeDelta: 0.4,
      }}
    >
      {vehicles.map((v: any) => (
        <Marker
          key={v.id}
          coordinate={{ latitude: v.lat, longitude: v.lng }}
          title={`Truck ${v.id}`}
        />
      ))}
    </MapView>
  );
}
