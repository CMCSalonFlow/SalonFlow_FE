import { Link, Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function NotFoundPage() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View className="flex-1 items-center justify-center bg-ink px-6">
        <View className="w-full rounded-[28px] border border-white/10 bg-panel p-6">
          <Text className="text-2xl font-extrabold text-textHigh">Page not found</Text>
          <Text className="mt-2 text-base leading-6 text-textMid">
            The route you opened does not exist in the customer app.
          </Text>
          <Link href="/home" asChild>
            <Pressable className="mt-5 self-start rounded-2xl bg-accent px-4 py-3">
              <Text className="font-bold text-ink">Back to home</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </>
  );
}
