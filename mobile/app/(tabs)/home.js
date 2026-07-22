import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { ScreenShell } from "../../src/components/ScreenShell";
import { SectionCard } from "../../src/components/SectionCard";

const quickActions = [
  { label: "Book now", href: "/booking" },
  { label: "Find salon", href: "/search" },
  { label: "My visits", href: "/appointments" },
  { label: "Profile", href: "/profile" },
];

export default function HomeScreen() {
  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-4 pb-8 pt-5">
        <View className="mb-4 flex-row items-center gap-3">
          <View className="rounded-full bg-panelSoft px-3 py-1.5">
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-textHigh">Customer</Text>
          </View>
          <Text className="text-lg font-extrabold text-textHigh">SalonFlow Mobile</Text>
        </View>

        <View className="mb-4 rounded-[30px] border border-white/10 bg-panel p-5 shadow-glow">
          <Text className="text-xs font-bold uppercase tracking-[1.8px] text-accent">Mobile first</Text>
          <Text className="mt-3 text-3xl font-black leading-10 text-textHigh">
            Book, track, and manage salon visits in one place.
          </Text>
          <Text className="mt-3 text-[15px] leading-6 text-textMid">
            This customer app is isolated from the web app so both can evolve in parallel
            without breaking the current website.
          </Text>
        </View>

        <SectionCard title="Quick actions" subtitle="The most common customer flows, one tap away.">
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {quickActions.map((item) => (
              <Link key={item.label} href={item.href} asChild>
                <Pressable className="w-[48%] rounded-2xl bg-panelSoft px-4 py-4">
                  <Text className="text-center text-sm font-bold text-textHigh">{item.label}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Today at a glance" subtitle="A small summary that feels useful immediately." tone="soft">
          <Text className="text-2xl font-black text-textHigh">2 upcoming bookings</Text>
          <Text className="mt-1 text-sm text-textMid">Next appointment: Friday, 7:30 PM</Text>
        </SectionCard>

        <SectionCard title="Saved places" subtitle="Branches and salons the customer uses often.">
          <Text className="text-sm leading-6 text-textMid">
            We can surface favorite branches, recent bookings, vouchers, and recommended
            services here later.
          </Text>
        </SectionCard>
      </ScrollView>
    </ScreenShell>
  );
}
