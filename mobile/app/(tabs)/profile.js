import { ScrollView, Text, View } from "react-native";

import { ScreenShell } from "../../src/components/ScreenShell";
import { SectionCard } from "../../src/components/SectionCard";

const rows = [
  ["Account", "Name, phone, email"],
  ["Vouchers", "Saved promo codes"],
  ["Preferences", "Language, reminders"],
];

export default function ProfileScreen() {
  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-4 pb-8 pt-5">
        <Text className="text-sm font-bold uppercase tracking-[1.8px] text-accent">Profile</Text>
        <Text className="mt-2 text-3xl font-black text-textHigh">Customer account</Text>
        <Text className="mt-2 text-[15px] leading-6 text-textMid">
          Use the same backend auth, but keep mobile storage and session handling separate from web.
        </Text>

        <SectionCard title="Account settings" subtitle="Profile data and preferences.">
          {rows.map(([title, subtitle]) => (
            <View key={title} className="mb-3 rounded-2xl bg-panelSoft p-4 last:mb-0">
              <Text className="text-base font-bold text-textHigh">{title}</Text>
              <Text className="mt-1 text-sm text-textMid">{subtitle}</Text>
            </View>
          ))}
        </SectionCard>
      </ScrollView>
    </ScreenShell>
  );
}

