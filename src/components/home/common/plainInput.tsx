import { TextInput } from "react-native";

export default function PlainInput({
    value,
    onChangeText,
    placeholder,
    accentColor,
    multiline = false,
    keyboardType,
    editable = true,
  }: {
    value: string;
    onChangeText: (v: string) => void;
    placeholder: string;
    accentColor: string;
    multiline?: boolean;
    keyboardType?: 'default' | 'numeric';
    editable?: boolean;
  }) {
    return (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#4A5568"
        multiline={multiline}
        editable={editable}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
        style={{
          minHeight: multiline ? 90 : 36,
          color: '#F1F5F9',
          fontSize: 15,
          lineHeight: 22,
          fontFamily: 'sans',
          opacity: editable ? 1 : 0.7,
        }}
        selectionColor={accentColor}
      />
    );
  }