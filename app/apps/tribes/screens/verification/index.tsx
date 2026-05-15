import { ScrollView, Text, View } from "react-native";

export default function VerificationScreen() {
  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: "#0A0A0A",
        padding: 16,
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 24,
          fontWeight: "700",
        }}
      >
        Verified Elders & Historians
      </Text>

      <View
        style={{
          marginTop: 20,
          backgroundColor: "#151515",
          padding: 16,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: "#00D26A", fontSize: 18 }}>
          Elder Verification
        </Text>

        <Text
          style={{
            color: "#CCCCCC",
            marginTop: 12,
            lineHeight: 24,
          }}
        >
          Trusted historians, elders, linguists, cultural leaders,
          and researchers can receive verified status to preserve
          historical integrity.
        </Text>
      </View>
    </ScrollView>
  );
}
