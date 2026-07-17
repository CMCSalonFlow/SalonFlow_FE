import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export function SectionCard({ title, subtitle, children, tone = "default" }) {
  return (
    <View style={[styles.card, tone === "soft" && styles.softCard]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  softCard: {
    backgroundColor: colors.surfaceSoft,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: 13,
    lineHeight: 18,
  },
  body: {
    gap: spacing.sm,
  },
});

