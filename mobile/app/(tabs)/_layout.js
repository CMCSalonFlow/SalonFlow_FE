import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const tabIconMap = {
  home: "home-outline",
  search: "search-outline",
  booking: "create-outline",
  appointments: "calendar-outline",
  profile: "person-outline",
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#F6C453",
        tabBarInactiveTintColor: "#B6C2E2",
        tabBarStyle: {
          backgroundColor: "#111C33",
          borderTopColor: "rgba(255,255,255,0.08)",
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIconMap[route.name] ?? "ellipse-outline"} size={size ?? 22} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="booking" options={{ title: "Book" }} />
      <Tabs.Screen name="appointments" options={{ title: "Visits" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

