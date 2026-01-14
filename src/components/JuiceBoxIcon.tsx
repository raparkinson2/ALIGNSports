import Svg, { Path, Rect, Line } from 'react-native-svg';

interface JuiceBoxIconProps {
  size?: number;
  color?: string;
}

export function JuiceBoxIcon({ size = 24, color = '#f59e0b' }: JuiceBoxIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Straw */}
      <Line
        x1="14"
        y1="2"
        x2="12"
        y2="8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Cup lid */}
      <Path
        d="M6 8h12l-0.5 2H6.5L6 8z"
        fill={color}
        opacity={0.8}
      />
      {/* Cup body - tapered */}
      <Path
        d="M6.5 10h11L16 21H8L6.5 10z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Decorative stripe */}
      <Path
        d="M7.2 14h9.6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M7.5 17h9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
