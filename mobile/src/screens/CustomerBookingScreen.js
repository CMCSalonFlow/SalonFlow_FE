import { Text } from "react-native";
import { SectionCard } from "../components/SectionCard";

export function CustomerBookingScreen() {
  return (
    <SectionCard
      title="Booking flow"
      subtitle="This screen is the natural place to rebuild the customer booking flow for mobile."
    >
      <Text>We can move the web booking steps into a mobile-friendly wizard here.</Text>
    </SectionCard>
  );
}

