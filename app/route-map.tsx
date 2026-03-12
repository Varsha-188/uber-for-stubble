import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

function distanceKm(a: any, b: any) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(x));
}

// ✅ Greedy AI-like route planner
function planRoute(stops: any[]) {
  if (stops.length <= 1) return stops;

  const remaining = [...stops];
  const route: any[] = [];

  // Start from first selected stop
  let current = remaining.shift();
  route.push(current);

  while (remaining.length > 0) {
    remaining.sort((a, b) => {
      const da = distanceKm(current, a);
      const db = distanceKm(current, b);

      // Priority + nearest combo
      const scoreA = (a.priorityScore ?? 0) * 2 - da;
      const scoreB = (b.priorityScore ?? 0) * 2 - db;

      return scoreB - scoreA;
    });

    const next = remaining.shift();
    route.push(next);
    current = next;
  }

  return route;
}

export default function RouteMapScreen() {
  const params = useLocalSearchParams();
  const stops = params.stops ? JSON.parse(params.stops as string) : [];

  const route = useMemo(() => planRoute(stops), [stops]);

  const polylineCoords = route.map((s: any) => ({
    latitude: s.lat,
    longitude: s.lng,
  }));

  const initialRegion = {
    latitude: route[0]?.lat || 17.385,
    longitude: route[0]?.lng || 78.4867,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛣️ Optimized Pickup Route</Text>

      <MapView style={styles.map} initialRegion={initialRegion}>
        {route.map((stop: any, index: number) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.lat, longitude: stop.lng }}
            title={`Stop ${index + 1}`}
            description={`Qty: ${stop.quantity}`}
          />
        ))}

        {polylineCoords.length > 1 && (
          <Polyline coordinates={polylineCoords} strokeWidth={4} />
        )}
      </MapView>

      <View style={styles.bottom}>
        <Text style={styles.bottomText}>
          Total Stops: {route.length}
        </Text>
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
  bottom: {
    padding: 12,
    backgroundColor: "#fff",
  },
  bottomText: {
    fontWeight: "bold",
  },
});
