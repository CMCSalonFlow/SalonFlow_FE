import { StyleSheet, Text, View } from "react-native";
import { SectionCard } from "../components/SectionCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export function CustomerHomeScreen() {
  return (
    <View>
      <SectionCard
        title="Quick actions"
        subtitle="A few high-value customer actions for day one."
      >
        <View style={styles.quickGrid}>
          <ActionChip label="Book now" />
          <ActionChip label="Find salon" />
          <ActionChip label="My visits" />
          <ActionChip label="Profile" />
        </View>
      </SectionCard>

      <SectionCard
        title="Today at a glance"
        subtitle="A mobile home should feel immediate and useful."
        tone="soft"
      >
        <Text style={styles.metric}>2 upcoming bookings</Text>
        <Text style={styles.helper}>Next appointment: Friday, 7:30 PM</Text>
      </SectionCard>
    </View>
  );
}

function ActionChip({ label }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    width: "48%",
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  chipLabel: {
    color: colors.primaryText,
    fontWeight: "800",
    fontSize: 14,
  },
  metric: {
    color: colors.primaryText,
    fontSize: 22,
    fontWeight: "900",
  },
  helper: {
    color: colors.secondaryText,
    fontSize: 14,
    marginTop: 4,
  },
});

