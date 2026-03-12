import { Audio } from "expo-av";

export async function startVoiceInput(onResult: (text: string) => void) {
  // 1️⃣ Ask microphone permission
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    alert("Microphone permission required");
    return;
  }

  // 2️⃣ Prepare recording
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );

  await recording.startAsync();

  alert("🎙️ Recording started. Speak now...");

  // 3️⃣ Stop after 5 seconds (demo purpose)
  setTimeout(async () => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log("Recorded file:", uri);

    // ⚠️ For now: mock STT result
    onResult("100 kg rice stubble in Medak");
  }, 5000);
}

