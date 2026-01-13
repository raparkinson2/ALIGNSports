import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Player, getPlayerInitials } from '@/lib/store';

interface PlayerAvatarProps {
  player: Player | null | undefined;
  size: number;
  borderWidth?: number;
  borderColor?: string;
}

export function PlayerAvatar({ player, size, borderWidth = 0, borderColor = 'transparent' }: PlayerAvatarProps) {
  const initials = player ? getPlayerInitials(player) : '';
  const fontSize = size * 0.38;

  if (player?.avatar) {
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
      />
    );
  }

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
