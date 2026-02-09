import { View, Text, ScrollView, Pressable, Dimensions, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Camera, Plus, ImageIcon, Trash2, X } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTeamStore, Photo } from '@/lib/store';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GAP = 4;
const PADDING = 16;
const imageSize = (screenWidth - PADDING * 2 - GAP * 2) / 3;

export default function PhotosScreen() {
  const storePhotos = useTeamStore((s) => s.photos);
  const addPhoto = useTeamStore((s) => s.addPhoto);
  const removePhoto = useTeamStore((s) => s.removePhoto);
  const games = useTeamStore((s) => s.games);

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewerPhoto, setViewerPhoto] = useState<Photo | null>(null);

  const handlePhotoPress = (photo: Photo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewerPhoto(photo);
  };

  const closeViewer = () => {
    setViewerPhoto(null);
  };

  const handleLongPress = (photo: Photo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedPhoto(photo);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (selectedPhoto) {
      removePhoto(selectedPhoto.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowDeleteModal(false);
    setSelectedPhoto(null);
  };

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
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
          className="flex-row items-end justify-between px-5 pt-2 pb-4"
        >
          <View>
            <View className="flex-row items-center">
              <ImageIcon size={20} color="#67e8f9" />
              <Text className="text-cyan-400 text-sm font-medium ml-2">Photos</Text>
            </View>
            <Text className="text-white text-3xl font-bold">Team Photos</Text>
          </View>
          <View className="flex-row items-center">
            <Pressable
              onPress={takePhoto}
              className="bg-slate-800 w-10 h-10 rounded-full items-center justify-center mr-2 active:bg-slate-700"
            >
              <Camera size={20} color="#67e8f9" />
            </Pressable>
            <Pressable
              onPress={pickImage}
              className="bg-green-500 w-10 h-10 rounded-full items-center justify-center active:bg-green-600"
            >
              <Plus size={20} color="white" />
            </Pressable>
          </View>
        </Animated.View>

        {storePhotos.length === 0 ? (
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
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: PADDING }}
          >
            {/* Photo Grid - 3 columns */}
            <View className="flex-row flex-wrap" style={{ gap: GAP }}>
              {storePhotos.map((photo, index) => (
                <Animated.View
                  key={photo.id}
                  entering={FadeInDown.delay(Math.min(index * 50, 300)).springify()}
                >
                  <Pressable
                    className="active:opacity-80"
                    onPress={() => handlePhotoPress(photo)}
                    onLongPress={() => handleLongPress(photo)}
                    delayLongPress={300}
                  >
                    <Image
                      source={{ uri: photo.uri }}
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

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <Pressable
            className="flex-1 bg-black/70 items-center justify-center"
            onPress={() => setShowDeleteModal(false)}
          >
            <Pressable className="bg-slate-800 rounded-2xl p-6 mx-8 w-72">
              <View className="items-center mb-4">
                <View className="bg-red-500/20 rounded-full p-3 mb-3">
                  <Trash2 size={28} color="#ef4444" />
                </View>
                <Text className="text-white text-lg font-semibold">Delete Photo?</Text>
                <Text className="text-slate-400 text-center mt-2">
                  This action cannot be undone.
                </Text>
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowDeleteModal(false)}
                  className="flex-1 bg-slate-700 py-3 rounded-xl active:bg-slate-600"
                >
                  <Text className="text-white text-center font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  className="flex-1 bg-red-500 py-3 rounded-xl active:bg-red-600"
                >
                  <Text className="text-white text-center font-semibold">Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Fullscreen Image Viewer Modal */}
        <Modal
          visible={viewerPhoto !== null}
          transparent
          animationType="none"
          onRequestClose={closeViewer}
          statusBarTranslucent
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="flex-1 bg-black"
          >
            <Pressable
              className="flex-1 items-center justify-center"
              onPress={closeViewer}
            >
              {viewerPhoto && (
                <Animated.View
                  entering={ZoomIn.duration(250).springify()}
                  exiting={ZoomOut.duration(200)}
                >
                  <Image
                    source={{ uri: viewerPhoto.uri }}
                    style={{
                      width: screenWidth,
                      height: screenWidth,
                    }}
                    contentFit="contain"
                  />
                </Animated.View>
              )}
            </Pressable>

            {/* Close button */}
            <SafeAreaView
              edges={['top']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
            >
              <View className="flex-row justify-end px-4 pt-2">
                <Pressable
                  onPress={closeViewer}
                  className="bg-black/50 w-10 h-10 rounded-full items-center justify-center active:bg-black/70"
                >
                  <X size={24} color="white" />
                </Pressable>
              </View>
            </SafeAreaView>
          </Animated.View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
