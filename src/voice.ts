import * as Speech from "expo-speech";

export const speak = (text: string, language = "en-IN") => {
  Speech.speak(text, {
    language,
    rate: 0.9,
  });
};
