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
        x="5"
        y="7"
        width="11"
        height="14"
        rx="1"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      {/* Top of box */}
      <Path
        d="M5 7L7.5 4H13.5L16 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Straw - angled sticking out */}
      <Line
        x1="13"
        y1="6"
        x2="19"
        y2="1"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
