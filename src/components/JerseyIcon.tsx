import Svg, { Path } from 'react-native-svg';

interface JerseyIconProps {
  size?: number;
  color: string;
  strokeColor?: string;
}

export function JerseyIcon({ size = 16, color, strokeColor = 'rgba(255,255,255,0.3)' }: JerseyIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Jersey shape - sleeves, body, neck */}
      <Path
        d="M6 2 L1 7 L1 10 L5 10 L5 22 L19 22 L19 10 L23 10 L23 7 L18 2 L15 2 C15 3.5 13.5 5 12 5 C10.5 5 9 3.5 9 2 L6 2 Z"
        fill={color}
        stroke={strokeColor}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
