
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  type TextInputProps,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AppText from "./AppText";
import { useTranslated } from "../../hooks/useTranslated";

type FieldIcon = "email" | "password";

interface InputFieldProps extends TextInputProps {
  icon:        FieldIcon;
  isPassword?: boolean;
  error?:      string;        
}

const ICON_SIZE = 20;

export default function InputField({
  icon,
  isPassword = false,
  error,
  placeholder,
  ...rest
}: InputFieldProps) {
  const [visible, setVisible] = useState(false);
  const translatedPlaceholder = useTranslated(placeholder ?? '');

  return (
    <View className="mb-0.5">
      <View
        className={[
          "flex-row items-center bg-brand-bgInput rounded-input h-[50px] px-3.5 border",
          error ? "border-red-500" : "border-transparent",
        ].join(" ")}
      >
        <View className="mr-2.5" pointerEvents="none">
          <MaterialIcons
            name={icon === "email" ? "mail-outline" : "lock-outline"}
            size={ICON_SIZE}
            color={error ? "#EF4444" : "#64748B"}
          />
        </View>

        <TextInput
          className="flex-1 text-body-lg text-brand-textInput font-sans py-0 mb-1"
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword && !visible}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          selectionColor="#A855F7"
          underlineColorAndroid="transparent"
          style={Platform.OS === "android" ? { includeFontPadding: false } : undefined}
          placeholder={translatedPlaceholder}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setVisible(v => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="ml-2 p-0.5"
            activeOpacity={0.7}
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            accessibilityRole="button"
          >
            <MaterialIcons
              name={visible ? "visibility-off" : "visibility"}
              size={ICON_SIZE}
              color={visible ? "#A855F7" : "#64748B"}
            />
          </TouchableOpacity>
        )}
      </View>


      {error ? (
        <AppText className="text-red-500 text-xs font-sans mt-1 ml-1">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}