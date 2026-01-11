import Svg, { Text as SvgText } from 'react-native-svg';

interface JuiceBoxIconProps {
  size?: number;
  color?: string;
}

export function JuiceBoxIcon({ size = 24, color = '#f59e0b' }: JuiceBoxIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <SvgText
        x="12"
        y="17"
        fontSize="18"
        fontWeight="bold"
        fill={color}
        textAnchor="middle"
      >
        H₂O
      </SvgText>
    </Svg>
  );
}
