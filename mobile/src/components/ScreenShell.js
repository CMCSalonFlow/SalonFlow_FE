import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";

export function ScreenShell({ children }) {
  return (
    <SafeAreaView className="flex-1 bg-ink">
      <View className="flex-1 bg-ink">{children}</View>
    </SafeAreaView>
  );
}

