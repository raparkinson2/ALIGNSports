import { useWindowDimensions } from 'react-native';

// Breakpoints for responsive design
const BREAKPOINTS = {
  // Phone (small)
  sm: 0,
  // Phone (large) / iPad mini portrait
  md: 428,
  // iPad portrait
  lg: 768,
  // iPad landscape / iPad Pro portrait
  xl: 1024,
  // iPad Pro landscape
  '2xl': 1366,
} as const;

// Minimum width to consider device as tablet
const TABLET_MIN_WIDTH = 768;

export interface ResponsiveInfo {
  // Dimensions
  width: number;
  height: number;

  // Device type
  isTablet: boolean;
  isPhone: boolean;

  // Orientation
  isLandscape: boolean;
  isPortrait: boolean;

  // Breakpoint helpers
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;

  // Grid helpers
  columns: 1 | 2 | 3 | 4;
  containerPadding: number;
  gap: number;
}

/**
 * Hook for responsive design that detects iPad/tablet and provides layout helpers
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  // Device detection - consider both dimensions for tablets that might be in portrait
  const maxDimension = Math.max(width, height);
  const isTablet = maxDimension >= TABLET_MIN_WIDTH;
  const isPhone = !isTablet;

  // Orientation
  const isLandscape = width > height;
  const isPortrait = !isLandscape;

  // Breakpoint checks (based on current width)
  const isSm = width < BREAKPOINTS.md;
  const isMd = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isLg = width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl;
  const isXl = width >= BREAKPOINTS.xl && width < BREAKPOINTS['2xl'];
  const is2xl = width >= BREAKPOINTS['2xl'];

  // Grid columns based on width
  let columns: 1 | 2 | 3 | 4 = 1;
  if (width >= BREAKPOINTS['2xl']) {
    columns = 4;
  } else if (width >= BREAKPOINTS.xl) {
    columns = 3;
  } else if (width >= BREAKPOINTS.lg) {
    columns = 2;
  }

  // Container padding scales with screen size
  let containerPadding = 16;
  if (isTablet) {
    containerPadding = isLandscape ? 32 : 24;
  }

  // Gap between items
  let gap = 12;
  if (isTablet) {
    gap = 16;
  }

  return {
    width,
    height,
    isTablet,
    isPhone,
    isLandscape,
    isPortrait,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    columns,
    containerPadding,
    gap,
  };
}

/**
 * Get responsive value based on device type
 */
export function responsiveValue<T>(phone: T, tablet: T, isTablet: boolean): T {
  return isTablet ? tablet : phone;
}

/**
 * Calculate item width for grid layouts
 */
export function getGridItemWidth(
  containerWidth: number,
  columns: number,
  gap: number,
  padding: number
): number {
  const totalGaps = (columns - 1) * gap;
  const totalPadding = padding * 2;
  const availableWidth = containerWidth - totalGaps - totalPadding;
  return availableWidth / columns;
}
