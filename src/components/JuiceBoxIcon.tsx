import { Text } from 'react-native';

interface JuiceBoxIconProps {
  size?: number;
  color?: string;
}

export function JuiceBoxIcon({ size = 16, color = '#f59e0b' }: JuiceBoxIconProps) {
  return (
    <Text style={{ fontSize: size, fontWeight: '500', color }}>
      H₂O
    </Text>
  );
}
