import Svg, { Path, Ellipse } from 'react-native-svg';

interface JuiceBoxIconProps {
  size?: number;
  color?: string;
}

export function JuiceBoxIcon({ size = 24, color = '#f59e0b' }: JuiceBoxIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Classic Coca-Cola bottle silhouette */}
      <Path
        d="M9 1
           L9 2.5
           C9 3 8.5 3.5 8 4
           L7 5
           C6 6 5.5 7 5.5 8.5
           L5.5 10
           C5.5 11 6 12 7 13
           C8 14 8.5 15 8.5 16
           L8.5 20
           C8.5 21.5 7.5 22 6 22.5
           L6 23
           L18 23
           L18 22.5
           C16.5 22 15.5 21.5 15.5 20
           L15.5 16
           C15.5 15 16 14 17 13
           C18 12 18.5 11 18.5 10
           L18.5 8.5
           C18.5 7 18 6 17 5
           L16 4
           C15.5 3.5 15 3 15 2.5
           L15 1
           Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Bottle cap */}
      <Ellipse
        cx="12"
        cy="1.5"
        rx="3"
        ry="0.8"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      {/* Middle curve detail - the signature Coke pinch */}
      <Path
        d="M7 13.5C8 12.5 8 11.5 7.5 10"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M17 13.5C16 12.5 16 11.5 16.5 10"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
