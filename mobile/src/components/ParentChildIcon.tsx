import Svg, { Circle, Path } from 'react-native-svg';

interface ParentChildIconProps {
  size?: number;
  color?: string;
}

export function ParentChildIcon({ size = 20, color = '#ec4899' }: ParentChildIconProps) {
  // Scale factor based on size (designed at 24px)
  const scale = size / 24;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Parent figure (left, larger) */}
      {/* Parent head */}
      <Circle cx="8" cy="6" r="3" fill={color} />
      {/* Parent body */}
      <Path
        d="M8 10c-3 0-5 2-5 4.5v4.5h10v-4.5c0-2.5-2-4.5-5-4.5z"
        fill={color}
      />

      {/* Child figure (right, smaller) */}
      {/* Child head */}
      <Circle cx="17" cy="9" r="2.2" fill={color} />
      {/* Child body */}
      <Path
        d="M17 12c-2.2 0-4 1.5-4 3.3V19h8v-3.7c0-1.8-1.8-3.3-4-3.3z"
        fill={color}
      />
    </Svg>
  );
}
