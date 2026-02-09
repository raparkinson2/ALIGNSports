import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { Player, getPlayerInitials } from '@/lib/store';

interface PlayerAvatarProps {
  player: Player | null | undefined;
  size: number;
  borderWidth?: number;
  borderColor?: string;
}

export function PlayerAvatar({ player, size, borderWidth = 0, borderColor = 'transparent' }: PlayerAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = player ? getPlayerInitials(player) : '';
  const fontSize = size * 0.38;

  // Reset error state when player or avatar changes
  useEffect(() => {
    setImageError(false);
  }, [player?.id, player?.avatar]);

  // Check if avatar is a valid image URI (http, https, file, or data URI)
  const hasValidAvatar = player?.avatar &&
    (player.avatar.startsWith('http') ||
     player.avatar.startsWith('file://') ||
     player.avatar.startsWith('data:'));

  // Show initials if no avatar, invalid avatar, or image failed to load
  if (!hasValidAvatar || imageError) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth,
          borderColor,
          backgroundColor: '#334155',
        }}
        className="items-center justify-center"
      >
        <Text
          style={{ fontSize }}
          className="text-slate-300 font-semibold"
        >
          {initials || '-'}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: player.avatar }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth,
        borderColor,
      }}
      contentFit="cover"
      onError={() => setImageError(true)}
    />
  );
}
