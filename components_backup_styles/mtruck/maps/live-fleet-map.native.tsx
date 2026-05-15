import { useEffect, useState } from "react";
import MapView, { Marker } from "react-native-maps";
import {
  getFleetVehicles,
  subscribeFleetMap,
  FleetVehicle,
} from "../../../lib/mtruck/maps/live-fleet-map-engine";

export default function LiveFleetMap() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);

  useEffect(() => {
    load();

    const channel = subscribeFleetMap((updated) => {
      setVehicles(updated);
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  async function load() {
    const data = await getFleetVehicles();
    setVehicles(data);
  }

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
      {vehicles.map((truck) => (
        <Marker
          key={truck.truck_id}
          coordinate={{
            latitude: truck.lat,
            longitude: truck.lng,
          }}
          title={`Truck ${truck.truck_id}`}
          description={`Speed: ${truck.speed || 0} km/h`}
        />
      ))}
    </MapView>
  );
}
