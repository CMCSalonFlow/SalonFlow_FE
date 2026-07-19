import { ScrollView, Text, View } from "react-native";

import { ScreenShell } from "../../src/components/ScreenShell";
import { SectionCard } from "../../src/components/SectionCard";

const steps = [
  "Choose salon or branch",
  "Pick service",
  "Select date and time",
  "Confirm and pay",
];

export default function BookingScreen() {
  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-4 pb-8 pt-5">
        <Text className="text-sm font-bold uppercase tracking-[1.8px] text-accent">Booking</Text>
        <Text className="mt-2 text-3xl font-black text-textHigh">Build the booking flow for mobile</Text>
        <Text className="mt-2 text-[15px] leading-6 text-textMid">
          This screen is where we will rebuild the web booking steps into a phone-friendly flow.
        </Text>

        <SectionCard title="Recommended flow" subtitle="A simple wizard usually works best on mobile.">
          {steps.map((step, index) => (
            <View key={step} className="mb-3 flex-row items-center rounded-2xl bg-panelSoft px-4 py-3 last:mb-0">
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-accent">
                <Text className="font-black text-ink">{index + 1}</Text>
              </View>
              <Text className="flex-1 text-sm font-semibold text-textHigh">{step}</Text>
            </View>
          ))}
        </SectionCard>

        <SectionCard title="API ready" subtitle="The screen can talk to the same backend endpoints as web.">
          <Text className="text-sm leading-6 text-textMid">
            We will connect this to customer booking endpoints using the new mobile API helper,
            not the web axios interceptor.
          </Text>
        </SectionCard>
      </ScrollView>
    </ScreenShell>
  );
}

