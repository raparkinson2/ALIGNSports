import Svg, { Path, Line } from 'react-native-svg';

interface JuiceBoxIconProps {
  size?: number;
  color?: string;
}

export function JuiceBoxIcon({ size = 24, color = '#f59e0b' }: JuiceBoxIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Crown cap with ridges */}
      <Path
        d="M9 1.5L9.5 1L10 1.5L10.5 1L11 1.5L11.5 1L12 1.5L12.5 1L13 1.5L13.5 1L14 1.5L14.5 1L15 1.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Cap bottom */}
      <Line x1="9" y1="1.5" x2="9" y2="2.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1="15" y1="1.5" x2="15" y2="2.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1="9" y1="2.5" x2="15" y2="2.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />

      {/* Neck - tapers outward */}
      <Path
        d="M9 2.5L8 6L7 8"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M15 2.5L16 6L17 8"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Shoulder line */}
      <Line x1="7" y1="8" x2="17" y2="8" stroke={color} strokeWidth={1.5} strokeLinecap="round" />

      {/* Upper body curves in slightly */}
      <Path
        d="M7 8C6.5 10 6.5 11 7 12"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M17 8C17.5 10 17.5 11 17 12"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />

      {/* Middle label area lines */}
      <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth={1.5} strokeLinecap="round" />

      {/* Lower body - pinches then flares */}
      <Path
        d="M7 12C6 14 5.5 17 5.5 19C5.5 21 6 22 7 23"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M17 12C18 14 18.5 17 18.5 19C18.5 21 18 22 17 23"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />

      {/* Bottom */}
      <Line x1="7" y1="23" x2="17" y2="23" stroke={color} strokeWidth={1.5} strokeLinecap="round" />

      {/* Vertical ridges on lower section */}
      <Line x1="9" y1="13" x2="8" y2="22" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Line x1="12" y1="12.5" x2="12" y2="22.5" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Line x1="15" y1="13" x2="16" y2="22" stroke={color} strokeWidth={1} strokeLinecap="round" />

      {/* Neck ridges */}
      <Line x1="8.5" y1="4" x2="9.5" y2="4" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Line x1="14.5" y1="4" x2="15.5" y2="4" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Line x1="8" y1="6" x2="9" y2="6" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Line x1="15" y1="6" x2="16" y2="6" stroke={color} strokeWidth={1} strokeLinecap="round" />
    </Svg>
  );
}
