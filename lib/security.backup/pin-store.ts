import AsyncStorage from "@react-native-async-storage/async-storage";

const PIN_KEY = "mtaa_pin_code";

export const pinStore = {
  async setPin(pin: string) {
    await AsyncStorage.setItem(PIN_KEY, pin);
  },

  async getPin() {
    return await AsyncStorage.getItem(PIN_KEY);
  },

  async verifyPin(pin: string) {
    const saved = await AsyncStorage.getItem(PIN_KEY);
    return saved === pin;
  },

  async clearPin() {
    await AsyncStorage.removeItem(PIN_KEY);
  },

  async isPinSet() {
    const pin = await AsyncStorage.getItem(PIN_KEY);
    return !!pin;
  }
};

