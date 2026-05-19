import { View, Text } from "react-native";

export default function ClockScreen() {
  return (
    <View style={{
      flex:1,
      backgroundColor:"#050816",
      justifyContent:"center",
      alignItems:"center"
    }}>
      <Text style={{color:"white",fontSize:22}}>
        MTAA Clock
      </Text>
    </View>
  );
}
