import { View, Text } from "react-native";

export default function SimScreen() {
  return (
    <View style={{
      flex:1,
      backgroundColor:"#050816",
      justifyContent:"center",
      alignItems:"center"
    }}>
      <Text style={{color:"white",fontSize:22}}>
        SIM Network Reader
      </Text>
    </View>
  );
}
