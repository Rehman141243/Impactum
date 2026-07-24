
import { KeyboardAvoidingView, Modal ,Platform,Pressable,ScrollView,View} from "react-native";
import AppText from "../../common/AppText";
import { X } from "lucide-react-native";

export default function EditSheet({
    visible,
    onClose,
    title,
    icon,
    children,
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }}>
            <View
              style={{
                backgroundColor: '#0A0E17',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderWidth: 1,
                borderColor: '#1A2535',
                padding: 24,
                maxHeight: '85%',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {icon}
                  <AppText className="font-sansMedium" style={{ fontSize: 16, color: '#E2E8F0' }}>
                    {title}
                  </AppText>
                </View>
                <Pressable
                  onPress={onClose}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#1A2535',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <X size={16} color="#64748B" />
                </Pressable>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {children}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }