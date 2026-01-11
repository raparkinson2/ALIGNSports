import Svg, { Path, Rect, Line } from 'react-native-svg';

interface JuiceBoxIconProps {
  size?: number;
  color?: string;
}

export function JuiceBoxIcon({ size = 24, color = '#f59e0b' }: JuiceBoxIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Juice box body */}
      <Rect
        x="6"
        y="6"
        width="12"
        height="15"
        rx="1"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      {/* Top fold/cap area */}
      <Path
        d="M6 6L9 3H15L18 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Straw */}
      <Line
        x1="14"
        y1="1"
        x2="14"
        y2="8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Straw hole */}
      <Path
        d="M13 5.5L15 5.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
