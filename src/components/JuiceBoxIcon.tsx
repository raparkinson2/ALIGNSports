import { Text } from 'react-native';

interface JuiceBoxIconProps {
  size?: number;
  color?: string;
}

export function JuiceBoxIcon({ size = 14, color = '#f59e0b' }: JuiceBoxIconProps) {
  return (
    <Text style={{ fontSize: size, fontWeight: 'bold', color }}>
      H₂O
    </Text>
  );
}
