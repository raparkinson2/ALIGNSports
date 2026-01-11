import Svg, { Path, Line } from 'react-native-svg';

interface JuiceBoxIconProps {
  size?: number;
  color?: string;
}

export function JuiceBoxIcon({ size = 24, color = '#f59e0b' }: JuiceBoxIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Juice box body - front face */}
      <Path
        d="M3 9V23H14V9"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Bottom edge */}
      <Line
        x1="3"
        y1="23"
        x2="14"
        y2="23"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Top surface - 3D perspective */}
      <Path
        d="M3 9L7 6H18L14 9"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Triangular fold on top left */}
      <Path
        d="M3 9L7 6L7 9Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Vertical crease line on box */}
      <Line
        x1="5"
        y1="12"
        x2="5"
        y2="20"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
      />
      {/* Bent straw - vertical part going into box */}
      <Line
        x1="12"
        y1="8"
        x2="12"
        y2="5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Bent straw - bend/elbow */}
      <Path
        d="M12 5Q13 4 14 4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Bent straw - angled upper part */}
      <Line
        x1="14"
        y1="4"
        x2="19"
        y2="1"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
