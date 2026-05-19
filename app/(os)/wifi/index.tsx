import { View, Text } from "react-native";

export default function WifiScreen() {
  return (
    <View style={{
      flex:1,
      backgroundColor:"#050816",
      justifyContent:"center",
      alignItems:"center"
    }}>
      <Text style={{color:"white",fontSize:22}}>
        WiFi Manager
      </Text>
    </View>
  );
}
