import { onValue, ref } from "firebase/database";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { db } from "../src/firebase";

type LatLng = { latitude: number; longitude: number };

export default function TrackingScreen() {
  const [farmerLoc, setFarmerLoc] = useState<LatLng | null>(null);
  const [collectorLoc, setCollectorLoc] = useState<LatLng | null>(null);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const farmerRef = ref(db, "locations/farmer_123");
    const collectorRef = ref(db, "locations/collector_456");

    const unsub1 = onValue(farmerRef, (snap) => {
      const d = snap.val();
      if (d?.latitude && d?.longitude) {
        setFarmerLoc({ latitude: d.latitude, longitude: d.longitude });
      }
    });

    const unsub2 = onValue(collectorRef, (snap) => {
      const d = snap.val();
      if (d?.latitude && d?.longitude) {
        setCollectorLoc({ latitude: d.latitude, longitude: d.longitude });
      }
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  if (!farmerLoc && !collectorLoc) {
    return (
      <View style={styles.center}>
        <Text>Waiting for live locations...</Text>
      </View>
    );
  }

  const initial = farmerLoc || collectorLoc!;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: initial.latitude,
          longitude: initial.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {farmerLoc && <Marker coordinate={farmerLoc} title="Farmer" />}
        {collectorLoc && <Marker coordinate={collectorLoc} title="Collector" />}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
