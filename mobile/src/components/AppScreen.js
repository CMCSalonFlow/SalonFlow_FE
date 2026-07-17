import { View } from "react-native";

export function AppScreen({ children }) {
  return <View className="flex-1 bg-ink">{children}</View>;
}
