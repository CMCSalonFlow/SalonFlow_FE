import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export function BottomTabBar({ tabs, activeTab, onChange }) {
  return (
    <View style={styles.shell}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              active && styles.tabActive,
              pressed && styles.tabPressed,
            ]}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: 8,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 18,
  },
  tabActive: {
    backgroundColor: colors.surfaceSoft,
  },
  tabPressed: {
    opacity: 0.85,
  },
  icon: {
    fontSize: 18,
    color: colors.secondaryText,
  },
  iconActive: {
    color: colors.primaryText,
  },
  label: {
    fontSize: 11,
    color: colors.secondaryText,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.primaryText,
  },
});

