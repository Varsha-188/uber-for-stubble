import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { onValue, ref, set, update } from "firebase/database";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { db } from "../../src/firebase";

type Listing = {
  id: string;
  quantity: string;
  location: string;
  cropType: string;
  status?: string;
  farmerId?: string;
  lat?: number;
  lng?: number;
  createdAt?: number;
  urgencyLevel?: number;
};

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CollectorScreen() {
  const router = useRouter();
  const collectorId = "collector_456";
  const [selectedStops, setSelectedStops] = useState<any[]>([]);

  const [listings, setListings] = useState<Listing[]>([]);
  const [collectorLocation, setCollectorLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // ✅ 1) Fetch listings
  useEffect(() => {
    const listingsRef = ref(db, "listings");

    const unsubscribe = onValue(listingsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setListings([]);
        return;
      }

      const arr: Listing[] = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));

      setListings(arr);
    });

    return () => unsubscribe();
  }, []);

  // ✅ 2) Get collector live location + save to Firebase
  useEffect(() => {
    const startCollectorLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        alert("Location permission denied!");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      setCollectorLocation({ lat, lng });

      // save to Firebase
      await set(ref(db, `collectors/${collectorId}/location`), {
        lat,
        lng,
        updatedAt: Date.now(),
      });
    };

    startCollectorLocation();
  }, []);

  // ✅ 3) AI-like priority scoring + sorting
  const aiSortedListings = useMemo(() => {
    if (!collectorLocation) return listings;

    const scored = listings
      .filter((l) => l.lat && l.lng) // avoid crashes
      .map((l) => {
        const dist = distanceKm(
          collectorLocation.lat,
          collectorLocation.lng,
          l.lat as number,
          l.lng as number
        );

        const quantity = Number(l.quantity || 0);
        const urgency = Number(l.urgencyLevel || 1);
        const ageHours = l.createdAt
          ? (Date.now() - l.createdAt) / (1000 * 60 * 60)
          : 0;

        // ✅ AI-like score (you can replace later with ML)
        const score =
          0.35 * quantity +
          0.30 * urgency * 10 +
          0.20 * ageHours -
          0.15 * dist;

        return {
          ...l,
          distanceKm: dist,
          priorityScore: score,
        };
      });

    scored.sort((a: any, b: any) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));
    return scored;
  }, [listings, collectorLocation]);

  // ✅ Update status
  const updateStatus = async (id: string, status: string) => {
    const listingRef = ref(db, `listings/${id}`);
    await update(listingRef, { status });
  };

  // ✅ Accept listing
  const acceptListing = async (listingId: string, farmerId: string) => {
    await set(ref(db, `requests/${listingId}`), {
      listingId,
      farmerId,
      collectorId,
      status: "accepted",
      acceptedAt: Date.now(),
    });

    await update(ref(db, `listings/${listingId}`), {
      status: "assigned",
      collectorId,
    });

    alert("Accepted! Now you can track live.");
    router.push("/tracking");
  };
  const toggleStop = (item: any) => {
  setSelectedStops((prev) => {
    const exists = prev.find((x) => x.id === item.id);
    if (exists) return prev.filter((x) => x.id !== item.id);
    return [...prev, item];
  });
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Collector Dashboard 🚚</Text>
      <TouchableOpacity
  style={{ backgroundColor: "#2196F3", padding: 12, borderRadius: 8, marginBottom: 10 }}
  onPress={() => router.push("/demand-map")}
>
  <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>
    View Demand Prediction Map 🔥
  </Text>
</TouchableOpacity>
<TouchableOpacity
  style={styles.routeBtn}
  onPress={() => {
    if (selectedStops.length < 2) {
      alert("Select at least 2 stops to build route");
      return;
    }
    router.push({
      pathname: "/route-map",
      params: { stops: JSON.stringify(selectedStops) },
    });
  }}
>
  <Text style={styles.btnText}>
    Build Route 🚚 ({selectedStops.length})
  </Text>
</TouchableOpacity>

      {!collectorLocation ? (
        <Text>Getting your live location...</Text>
      ) : aiSortedListings.length === 0 ? (
        <Text>No stubble listings available</Text>
      ) : (
        <FlatList
          data={aiSortedListings as any}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: any) => (
            <View style={styles.card}>
              <Text style={styles.bold}>Quantity: {item.quantity}</Text>
              <Text>Crop: {item.cropType}</Text>
              <Text>Location: {item.location}</Text>
              <Text>Status: {item.status}</Text>

              <Text>Distance: {item.distanceKm?.toFixed(1)} km</Text>
              <Text>Priority Score: {item.priorityScore?.toFixed(2)}</Text>
               <TouchableOpacity
  style={[
    styles.selectBtn,
    selectedStops.some((s) => s.id === item.id) && styles.selectedBtn,
  ]}
  onPress={() => toggleStop(item)}
>
  <Text style={styles.btnText}>
    {selectedStops.some((s) => s.id === item.id) ? "Selected ✅" : "Select Stop"}
  </Text>
</TouchableOpacity>

              {item.status === "pending" && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => {
                      if (!item.farmerId) {
                        alert("Farmer ID missing in this listing!");
                        return;
                      }
                      acceptListing(item.id, item.farmerId);
                    }}
                  >
                    <Text style={styles.btnText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => updateStatus(item.id, "rejected")}
                  >
                    <Text style={styles.btnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
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
    marginBottom: 15,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  bold: {
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  acceptBtn: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 5,
  },
  rejectBtn: {
    backgroundColor: "#F44336",
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginLeft: 5,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  routeBtn: {
  backgroundColor: "#673AB7",
  padding: 12,
  borderRadius: 8,
  marginBottom: 10,
},
selectBtn: {
  backgroundColor: "#607D8B",
  padding: 10,
  borderRadius: 6,
  marginTop: 10,
},
selectedBtn: {
  backgroundColor: "#4CAF50",
},
});

