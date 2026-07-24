import { View } from "react-native";

function FormCard({
    children,
    accentColor,
  }: {
    children: React.ReactNode;
    accentColor: string;
  }) {
    return (
      <View
        className="bg-brand-bgCardSoft rounded-2xl border p-4"
        style={{ borderColor: accentColor + '44' }}>
        {children}
      </View>
    );
  }
  