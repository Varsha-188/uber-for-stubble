import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { onValue, push, ref } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { db } from "../../src/firebase";
import { startVoiceInput } from "../../src/speechToText";

type Listing = {
  id: string;
  quantity: string;
  location: string;
  cropType: string;
  status: "pending" | "assigned" | "accepted" | "rejected";
  farmerId?: string;
};

export default function FarmerScreen() {
  const router = useRouter();

  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [cropType, setCropType] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const prevStatusesRef = useRef<Record<string, string>>({});

  const [lastGeoTime, setLastGeoTime] = useState(0);

  const [farmerCoords, setFarmerCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // ✅ Auto detect farmer location (with throttle)
  const autoDetectLocation = async () => {
    setLoadingLocation(true);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Location access required");
      setLoadingLocation(false);
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});

    const lat = loc.coords.latitude;
    const lng = loc.coords.longitude;

    setFarmerCoords({ lat, lng });

    try {
      const now = Date.now();

      // reverse geocode only once per 10 seconds
      if (now - lastGeoTime > 10000) {
        setLastGeoTime(now);

        const address = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });

        if (address.length > 0) {
          setLocation(`${address[0].city || ""}, ${address[0].region || ""}`);
        }
      }
    } catch (err) {
      console.log("Reverse geocode failed:", err);
      setLocation("Unknown Location");
    }

    setLoadingLocation(false);
  };

  // ✅ Submit listing to Firebase
  const submitListing = async () => {
    if (!quantity || !cropType) {
      alert("Please fill quantity and crop type");
      return;
    }

    if (!farmerCoords) {
      alert("Please auto-detect your location first!");
      return;
    }

    const farmerId = "farmer_123";

    const listingsRef = ref(db, "listings");

    await push(listingsRef, {
      quantity,
      cropType,
      location: location || "Unknown Location",
      farmerId,
      status: "pending",
      createdAt: Date.now(),
      urgencyLevel: 3,
      lat: farmerCoords.lat,
      lng: farmerCoords.lng,
    });

    alert("Listing submitted successfully!");

    // clear inputs
    setQuantity("");
    setCropType("");
  };

  // ✅ Reset form
  const resetListing = () => {
    setQuantity("");
    setLocation("");
    setCropType("");
    setFarmerCoords(null);
  };

  // ✅ Voice input demo
  const handleVoiceInput = async () => {
    await startVoiceInput(() => {
      setQuantity("100 kg");
      setCropType("Rice");
      setLocation("Medak");
    });
  };

  // ✅ Fetch listings
  useEffect(() => {
    const listingsRef = ref(db, "listings");

    const unsubscribe = onValue(listingsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setListings([]);
        return;
      }

      const formatted: Listing[] = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));

      setListings(formatted);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Notify farmer when status changes
  useEffect(() => {
    const listingsRef = ref(db, "listings");

    const unsubscribe = onValue(listingsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const newStatuses: Record<string, string> = {};

      Object.entries(data).forEach(([id, listing]: any) => {
        newStatuses[id] = listing.status;

        const prev = prevStatusesRef.current[id];

        if (prev && prev !== listing.status) {
          if (listing.status === "assigned" || listing.status === "accepted") {
            Alert.alert("✅ Listing Accepted", "Collector accepted your listing");
          }
          if (listing.status === "rejected") {
            Alert.alert("❌ Listing Rejected", "Collector rejected your listing");
          }
        }
      });

      prevStatusesRef.current = newStatuses;
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Farmer Dashboard 🌾</Text>

      <TouchableOpacity onPress={handleVoiceInput} style={styles.voiceBtn}>
        <Text style={styles.btnText}>🎤 Speak Listing</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={autoDetectLocation}
        disabled={loadingLocation}
      >
        <Text style={styles.buttonText}>
          {loadingLocation ? "Detecting..." : "Auto Detect Location"}
        </Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Enter quantity (e.g., 100 kg)"
        placeholderTextColor="#666"
        value={quantity}
        onChangeText={setQuantity}
        style={styles.input}
      />

      <TextInput
        placeholder="Enter crop type (e.g., Wheat, Rice)"
        placeholderTextColor="#666"
        value={cropType}
        onChangeText={setCropType}
        style={styles.input}
      />

      <TextInput
        placeholder="Location auto-filled"
        placeholderTextColor="#666"
        value={location}
        editable={false}
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.submitBtn, !farmerCoords && { opacity: 0.5 }]}
        disabled={!farmerCoords}
        onPress={submitListing}
      >
        <Text style={styles.btnText}>Submit Listing</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetButton} onPress={resetListing}>
        <Text style={styles.btnText}>New Listing</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/live-location")}
        style={styles.mapBtn}
      >
        <Text style={styles.btnText}>Show Live Location on Map</Text>
      </TouchableOpacity>

      <Text style={styles.subTitle}>My Listings</Text>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>Crop: {item.cropType}</Text>
            <Text>Quantity: {item.quantity}</Text>
            <Text>Location: {item.location}</Text>
            <Text>Status: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#E3F2FD",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  mapBtn: {
    backgroundColor: "#9C27B0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  voiceBtn: {
    backgroundColor: "#607D8B",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
});
