import { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { tabs } from "./src/navigation/tabs";
import { colors } from "./src/theme/colors";
import { spacing } from "./src/theme/spacing";
import { BottomTabBar } from "./src/components/BottomTabBar";
import { AppScreen } from "./src/components/AppScreen";
import { CustomerHomeScreen } from "./src/screens/CustomerHomeScreen";
import { CustomerSearchScreen } from "./src/screens/CustomerSearchScreen";
import { CustomerBookingScreen } from "./src/screens/CustomerBookingScreen";
import { CustomerAppointmentsScreen } from "./src/screens/CustomerAppointmentsScreen";
import { CustomerProfileScreen } from "./src/screens/CustomerProfileScreen";

const screenMap = {
  home: CustomerHomeScreen,
  search: CustomerSearchScreen,
  booking: CustomerBookingScreen,
  appointments: CustomerAppointmentsScreen,
  profile: CustomerProfileScreen,
};

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const ActiveScreen = useMemo(() => screenMap[activeTab] ?? CustomerHomeScreen, [activeTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.backdrop} />
      <AppScreen>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>Customer</Text>
            </View>
            <Text style={styles.brandTitle}>SalonFlow Mobile</Text>
          </View>

          <View style={styles.hero}>
            <Text style={styles.heroKicker}>Mobile first customer journey</Text>
            <Text style={styles.heroTitle}>Book, track, and manage salon visits in one place.</Text>
            <Text style={styles.heroBody}>
              This mobile source lives separately from the web app so we can keep the
              current customer website intact while shipping a native mobile experience.
            </Text>
          </View>

          <ActiveScreen />

          <View style={styles.tabSpacer} />
        </ScrollView>

        <BottomTabBar
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </AppScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  brandBadge: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  brandBadgeText: {
    color: colors.primaryText,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontSize: 12,
  },
  brandTitle: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: "800",
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroKicker: {
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  heroTitle: {
    color: colors.primaryText,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    marginBottom: spacing.sm,
  },
  heroBody: {
    color: colors.secondaryText,
    fontSize: 15,
    lineHeight: 22,
  },
  tabSpacer: {
    height: spacing.xl,
  },
});

