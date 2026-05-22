import { View, Text, StyleSheet } from 'react-native';
import { EducationIndex } from "@/domains/education/pages/index";

export default function EducationScreen() {
  return (
    <View style={styles.container}>
      <EducationIndex />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 16 },
});
