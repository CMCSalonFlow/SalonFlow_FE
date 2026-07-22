import { Text } from "react-native";
import { SectionCard } from "../components/SectionCard";

export function CustomerProfileScreen() {
  return (
    <SectionCard
      title="Profile"
      subtitle="Account details, saved branches, vouchers, and preferences belong here."
    >
      <Text>We can connect this to the same backend auth as the web version.</Text>
    </SectionCard>
  );
}

