import { View, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export function AppScreen({ children }) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

