import Svg, { Path, Line, Circle } from 'react-native-svg';

interface JuiceBoxIconProps {
  size?: number;
  color?: string;
}

export function JuiceBoxIcon({ size = 24, color = '#f59e0b' }: JuiceBoxIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Faucet spout */}
      <Path
        d="M4 8H14C15 8 16 9 16 10V11H4V8Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Faucet neck/pipe going up */}
      <Line
        x1="6"
        y1="8"
        x2="6"
        y2="4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* Handle */}
      <Line
        x1="3"
        y1="4"
        x2="9"
        y2="4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* Water drops coming out */}
      <Circle cx="15" cy="14" r="1" fill={color} />
      <Circle cx="14" cy="17" r="1" fill={color} />
      <Circle cx="16" cy="20" r="1" fill={color} />
      <Circle cx="13" cy="21" r="0.8" fill={color} />
    </Svg>
  );
}
