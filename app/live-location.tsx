import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import { onValue, ref, set } from "firebase/database";
import { db } from "../src/firebase"; // ✅ correct path

type LatLng = {
  latitude: number;
  longitude: number;
};

export default function LiveLocation() {
  const [myLocation, setMyLocation] = useState<LatLng | null>(null);
  const [farmerLocation, setFarmerLocation] = useState<LatLng | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);

  const myId = "collector_456"; // change based on role
  const farmerId = "farmer_123";

  // ✅ 1) Track MY location and save to Firebase
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission denied. Please allow location access.");
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 2,
        },
        async (loc) => {
          const { latitude, longitude } = loc.coords;

          const newLoc = { latitude, longitude };
          setMyLocation(newLoc);

          const region: Region = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          mapRef.current?.animateToRegion(region, 800);

          // ✅ Save my live location in Firebase
          await set(ref(db, `locations/${myId}`), {
            latitude,
            longitude,
            updatedAt: Date.now(),
          });
        }
      );
    };

    startTracking();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  // ✅ 2) Read FARMER live location from Firebase
  useEffect(() => {
    const farmerRef = ref(db, `locations/${farmerId}`);

    const unsubscribe = onValue(farmerRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.latitude && data?.longitude) {
        setFarmerLocation({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{errorMsg}</Text>
      </View>
    );
  }

  if (!myLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Fetching live location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: myLocation.latitude,
          longitude: myLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
      >
        {/* My Marker */}
        <Marker coordinate={myLocation} title="Me" />

        {/* Farmer Marker */}
        {farmerLocation && (
          <Marker coordinate={farmerLocation} title="Farmer Live Location" />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
