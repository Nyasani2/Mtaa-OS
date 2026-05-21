import AsyncStorage from "@react-native-async-storage/async-storage";

const PIN_KEY = "mtaa_secure_pin_hash";
const PIN_ENABLED_KEY = "mtaa_pin_enabled";

function hash(pin: string) {
  return `hash_${pin}`;
}

export const PinStore = {
  async setPin(pin: string) {
    if (pin.length !== 6) {
      throw new Error("PIN must be 6 digits");
    }

    const hashed = hash(pin);

    await AsyncStorage.setItem(
      PIN_KEY,
      hashed
    );

    await AsyncStorage.setItem(
      PIN_ENABLED_KEY,
      "true"
    );
  },

  async verifyPin(pin: string): Promise<boolean> {
    const storedHash =
      await AsyncStorage.getItem(PIN_KEY);

    if (!storedHash) {
      return false;
    }

    return storedHash === hash(pin);
  },

  async isEnabled(): Promise<boolean> {
    const enabled =
      await AsyncStorage.getItem(
        PIN_ENABLED_KEY
      );

    return enabled === "true";
  },

  async hasPin(): Promise<boolean> {
    return this.isEnabled();
  },

  async disable() {
    await AsyncStorage.removeItem(
      PIN_KEY
    );

    await AsyncStorage.setItem(
      PIN_ENABLED_KEY,
      "false"
    );
  },
};
