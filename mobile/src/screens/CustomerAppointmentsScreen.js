import { Text } from "react-native";
import { SectionCard } from "../components/SectionCard";

export function CustomerAppointmentsScreen() {
  return (
    <SectionCard
      title="Your appointments"
      subtitle="Keep a clean timeline of upcoming and past salon visits."
      tone="soft"
    >
      <Text>Upcoming visits, reschedule actions, and payment status can live here.</Text>
    </SectionCard>
  );
}

