import { Text, View } from "react-native";

export function SectionCard({ title, subtitle, children, tone = "default" }) {
  return (
    <View
      className={[
        "mb-4 rounded-[28px] border p-5",
        tone === "soft" ? "border-white/10 bg-panelSoft" : "border-white/10 bg-panel",
      ].join(" ")}
    >
      <View className="mb-3">
        <View>
          <Text className="mb-1 text-lg font-extrabold text-textHigh">{title}</Text>
          {subtitle ? <Text className="text-sm leading-5 text-textMid">{subtitle}</Text> : null}
        </View>
      </View>
      <View className="gap-3">{children}</View>
    </View>
  );
}
