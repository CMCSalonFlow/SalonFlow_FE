import { Text } from "react-native";
import { SectionCard } from "../components/SectionCard";

export function CustomerSearchScreen() {
  return (
    <SectionCard
      title="Search"
      subtitle="Search for salons, services, or branch locations."
    >
      <Text>We can later wire this to the same search API used on the web app.</Text>
    </SectionCard>
  );
}

