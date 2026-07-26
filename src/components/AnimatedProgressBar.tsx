import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

interface AnimatedProgressBarProps {
  /** Target width percentage (0–100) */
  percentage: number;
  /** Bar fill color */
  color: string;
  /** Track background color */
  trackColor?: string;
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Animation duration (ms) */
  duration?: number;
  /** Bar height in px */
  height?: number;
  /** Border radius for the bar */
  radius?: number;
}

/**
 * A progress bar that animates its width from 0 to `percentage` on mount.
 * Uses layout animation (non-native driver) — necessary because `width`
 * is not a native-animated property.
 */
export function AnimatedProgressBar({
  percentage,
  color,
  trackColor = 'rgba(255,255,255,0.08)',
  delay = 0,
  duration = 600,
  height = 8,
  radius = 4,
}: AnimatedProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <Animated.View
      style={{
        height,
        borderRadius: radius,
        backgroundColor: trackColor,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius: radius,
          backgroundColor: color,
          width: widthAnim.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </Animated.View>
  );
}
