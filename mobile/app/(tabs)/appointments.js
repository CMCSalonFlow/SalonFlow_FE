import { ScrollView, Text, View } from "react-native";

import { ScreenShell } from "../../src/components/ScreenShell";
import { SectionCard } from "../../src/components/SectionCard";

const items = [
  { title: "Friday 7:30 PM", subtitle: "Haircut at Aurora Hair Studio" },
  { title: "Sun 10:00 AM", subtitle: "Nail refill at Luxe Nail Lab" },
];

export default function AppointmentsScreen() {
  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-4 pb-8 pt-5">
        <Text className="text-sm font-bold uppercase tracking-[1.8px] text-accent">Visits</Text>
        <Text className="mt-2 text-3xl font-black text-textHigh">Appointments timeline</Text>
        <Text className="mt-2 text-[15px] leading-6 text-textMid">
          Upcoming bookings, reschedules, and past visits can live here.
        </Text>

        <SectionCard title="Upcoming" subtitle="Your next customer visits in one list." tone="soft">
          {items.map((item) => (
            <View key={item.title} className="mb-3 rounded-2xl bg-panel p-4 last:mb-0">
              <Text className="text-base font-bold text-textHigh">{item.title}</Text>
              <Text className="mt-1 text-sm text-textMid">{item.subtitle}</Text>
            </View>
          ))}
        </SectionCard>
      </ScrollView>
    </ScreenShell>
  );
}

