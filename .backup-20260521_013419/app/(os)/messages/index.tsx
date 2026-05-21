import { View, Text } from "react-native";

export default function MessagesScreen() {
  return (
    <View style={{
      flex:1,
      backgroundColor:"#050816",
      justifyContent:"center",
      alignItems:"center"
    }}>
      <Text style={{color:"white",fontSize:22}}>
        SIM Messages
      </Text>
    </View>
  );
}
