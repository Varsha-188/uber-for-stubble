import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function RoleSelectionScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Uber for Stubble 🌾</Text>
      <Text style={styles.subtitle}>Select your role</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/farmer")}
      >
        <Text style={styles.buttonText}>I am a Farmer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/collector")}
      >
        <Text style={styles.buttonText}>I am a Collector</Text>
      </TouchableOpacity>

      {/* ✅ Live Location Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#1E90FF" }]}
        onPress={() => router.push("/live-location")}
      >
        <Text style={styles.buttonText}>Show Live Location on Map</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#2E7D32",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginVertical: 10,
    width: 260,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});
