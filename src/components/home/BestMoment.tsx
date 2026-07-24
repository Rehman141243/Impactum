import { Pencil } from "lucide-react-native";
import { Image, Pressable } from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import AppText from "../common/AppText";
import { PendingImage } from "./Momentimagepicker";

export function ExistingImagePreview({ uri }: { uri: string }) {
    return (
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    );
  }
  
 export  function ReplacePhotoButton({
    accentColor,
    onPicked,
  }: {
    accentColor: string;
    onPicked: (img: PendingImage) => void;
  }) {
    const pick = async () => {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
      if (result.didCancel || !result.assets || !result.assets[0]) return;
      const asset = result.assets[0];
      if (!asset.uri) return;
      const ext = asset.fileName?.split('.').pop() ?? asset.uri.split('.').pop() ?? 'jpg';
      onPicked({
        uri: asset.uri,
        name: asset.fileName ?? `moment.${ext}`,
        type: asset.type ?? `image/${ext}`,
      });
    };
    return (
      <Pressable
        onPress={pick}
        style={{
          flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
          paddingVertical: 10, borderRadius: 12,
          backgroundColor: accentColor + '1A', borderWidth: 1, borderColor: accentColor + '55',
        }}>
        <Pencil size={14} color={accentColor} />
        <AppText style={{ fontSize: 13, color: accentColor, fontFamily: 'sansMedium' }}>
          Replace Photo
        </AppText>
      </Pressable>
    );
  }