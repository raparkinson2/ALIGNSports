import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Camera, Plus, ImageIcon } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTeamStore, Photo } from '@/lib/store';

const { width } = Dimensions.get('window');
const imageSize = (width - 48) / 3;

// Sample photos to show the gallery
const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=400',
  'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=400',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400',
  'https://images.unsplash.com/photo-1552831388-6a0b3575b32a?w=400',
  'https://images.unsplash.com/photo-1546608235-3310a2571c52?w=400',
  'https://images.unsplash.com/photo-1570498839593-e565b39455fc?w=400',
];

export default function PhotosScreen() {
  const photos = useTeamStore((s) => s.photos);
  const addPhoto = useTeamStore((s) => s.addPhoto);
  const games = useTeamStore((s) => s.games);

  // Combine store photos with sample photos for demo
  const [localPhotos, setLocalPhotos] = useState<string[]>(SAMPLE_PHOTOS);

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setLocalPhotos([uri, ...localPhotos]);

      // Also add to store
      const newPhoto: Photo = {
        id: Date.now().toString(),
        gameId: games[0]?.id || '',
        uri,
        uploadedBy: '1',
        uploadedAt: new Date().toISOString(),
      };
      addPhoto(newPhoto);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setLocalPhotos([uri, ...localPhotos]);

      // Also add to store
      const newPhoto: Photo = {
        id: Date.now().toString(),
        gameId: games[0]?.id || '',
        uri,
        uploadedBy: '1',
        uploadedAt: new Date().toISOString(),
      };
      addPhoto(newPhoto);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.delay(50)}
          className="flex-row items-center justify-between px-5 pt-2 pb-4"
        >
          <View>
            <Text className="text-slate-400 text-sm font-medium">Team</Text>
            <Text className="text-white text-3xl font-bold">Photos</Text>
          </View>
          <View className="flex-row">
            <Pressable
              onPress={takePhoto}
              className="bg-slate-800 w-10 h-10 rounded-full items-center justify-center mr-2 active:bg-slate-700"
            >
              <Camera size={20} color="#67e8f9" />
            </Pressable>
            <Pressable
              onPress={pickImage}
              className="bg-cyan-500 w-10 h-10 rounded-full items-center justify-center active:bg-cyan-600"
            >
              <Plus size={24} color="white" />
            </Pressable>
          </View>
        </Animated.View>

        {localPhotos.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="bg-slate-800/50 rounded-full p-6 mb-4">
              <ImageIcon size={48} color="#475569" />
            </View>
            <Text className="text-white text-xl font-semibold mb-2">No Photos Yet</Text>
            <Text className="text-slate-400 text-center">
              Take photos during games or add from your camera roll to share with the team.
            </Text>
            <Pressable
              onPress={pickImage}
              className="bg-cyan-500 mt-6 px-6 py-3 rounded-xl active:bg-cyan-600"
            >
              <Text className="text-white font-semibold">Add First Photo</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Photo Grid */}
            <View className="flex-row flex-wrap">
              {localPhotos.map((uri, index) => (
                <Animated.View
                  key={uri + index}
                  entering={FadeInDown.delay(index * 50).springify()}
                  className="p-1"
                >
                  <Pressable className="active:opacity-80">
                    <Image
                      source={{ uri }}
                      style={{
                        width: imageSize,
                        height: imageSize,
                        borderRadius: 12,
                      }}
                      contentFit="cover"
                    />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
