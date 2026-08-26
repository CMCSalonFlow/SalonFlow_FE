import { ScrollView, Text, TextInput, View } from "react-native";

import { ScreenShell } from "../../src/components/ScreenShell";
import { SectionCard } from "../../src/components/SectionCard";

const filters = ["Hair", "Nails", "Spa", "Barber"];

export default function SearchScreen() {
  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-4 pb-8 pt-5">
        <Text className="text-sm font-bold uppercase tracking-[1.8px] text-accent">Search</Text>
        <Text className="mt-2 text-3xl font-black text-textHigh">Find salons and services</Text>
        <Text className="mt-2 text-[15px] leading-6 text-textMid">
          Search by branch, service, or what the customer wants to book.
        </Text>

        <View className="mt-5 rounded-[24px] border border-white/10 bg-panel px-4 py-3">
          <TextInput
            placeholder="Search services, branches..."
            placeholderTextColor="#7E8BB0"
            className="text-base text-textHigh"
          />
        </View>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {filters.map((item) => (
            <View key={item} className="rounded-full bg-panelSoft px-4 py-2">
              <Text className="text-sm font-bold text-textHigh">{item}</Text>
            </View>
          ))}
        </View>

        <SectionCard title="Recommended results" subtitle="A preview of how search results can feel on mobile.">
          <View className="rounded-2xl bg-panelSoft p-4">
            <Text className="text-base font-bold text-textHigh">Aurora Hair Studio</Text>
            <Text className="mt-1 text-sm text-textMid">District 1, Ho Chi Minh City</Text>
          </View>
          <View className="rounded-2xl bg-panelSoft p-4">
            <Text className="text-base font-bold text-textHigh">Luxe Nail Lab</Text>
            <Text className="mt-1 text-sm text-textMid">Available today and tomorrow</Text>
          </View>
        </SectionCard>
      </ScrollView>
    </ScreenShell>
  );
}

