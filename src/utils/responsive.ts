import { useWindowDimensions } from 'react-native';

const BASE_WIDTH = 390;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const scale = Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.2);
  const isSmallScreen = width < 360;
  const isLargeScreen = width >= 428;

  const horizontalPadding = Math.max(width * 0.06, 16);
  const toastWidth = width - horizontalPadding * 2;

  return {
    width,
    height,
    scale,
    isSmallScreen,
    isLargeScreen,
    horizontalPadding,
    toastWidth: Math.min(toastWidth, 420),
    toastFontSize: isSmallScreen ? 14 : isLargeScreen ? 16 : 15,
    toastLineHeight: isSmallScreen ? 19 : isLargeScreen ? 22 : 20,
    toastPaddingV: Math.round(10 * scale),
    toastPaddingH: Math.round(14 * scale),
    toastMinHeight: Math.round(46 * scale),
    iconSize: Math.round(26 * scale),
    iconGlyphSize: Math.round(14 * scale),
    triangleSize: Math.round(28 * scale),
  };
}
