import { onValue, ref } from "firebase/database";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";

import { getDemandZones } from "../src/demandPrediction";
import { db } from "../src/firebase";

type Listing = {
  id: string;
  lat?: number;
  lng?: number;
  quantity?: string;
  createdAt?: number;
};

export default function DemandMapScreen() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const listingsRef = ref(db, "listings");

    const unsub = onValue(listingsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setListings([]);
        return;
      }

      const arr = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));

      setListings(arr);
    });

    return () => unsub();
  }, []);

  const zones = useMemo(() => getDemandZones(listings), [listings]);

  const topZones = zones.slice(0, 5);

  const initialRegion = {
    latitude: topZones[0]?.lat || 17.385,
    longitude: topZones[0]?.lng || 78.4867,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Demand Prediction Heat Zones</Text>

      <MapView style={styles.map} initialRegion={initialRegion}>
        {topZones.map((z, idx) => {
          // bigger radius = higher demand
          const radius = Math.min(3000, 800 + z.score * 5);

          return (
            <View key={idx}>
              <Circle
                center={{ latitude: z.lat, longitude: z.lng }}
                radius={radius}
                strokeWidth={2}
              />

              <Marker
                coordinate={{ latitude: z.lat, longitude: z.lng }}
                title={`Zone Demand: ${z.score.toFixed(0)}`}
                description={`Listings: ${z.count}, Qty: ${z.totalQty.toFixed(0)}`}
              />
            </View>
          );
        })}
      </MapView>

      <View style={styles.bottomBox}>
        {topZones.length === 0 ? (
          <Text>No listings available for prediction</Text>
        ) : (
          <Text style={styles.bottomText}>
            Recommended Zone: {topZones[0].lat}, {topZones[0].lng} (Score:{" "}
            {topZones[0].score.toFixed(0)})
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    padding: 12,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#fff",
  },
  map: { flex: 1 },
  bottomBox: {
    padding: 12,
    backgroundColor: "#fff",
  },
  bottomText: {
    fontWeight: "bold",
  },
});
