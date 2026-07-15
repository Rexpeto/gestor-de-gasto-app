import { useEffect, useRef } from 'react';
import { Animated, Easing, type ViewProps } from 'react-native';

interface AnimatedSectionProps extends ViewProps {
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Animation duration (ms) */
  duration?: number;
  /** Slide direction: 'up' (default) or 'down' */
  direction?: 'up' | 'down';
  /** Distance to slide in pixels */
  distance?: number;
}

/**
 * Wraps children with a fade-in + slide entrance animation.
 * Uses native driver — zero jank, 60fps.
 */
export function AnimatedSection({
  children,
  delay = 0,
  duration = 500,
  direction = 'up',
  distance = 28,
  style,
  ...props
}: AnimatedSectionProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(
    new Animated.Value(direction === 'down' ? -distance : distance),
  ).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[{ opacity, transform: [{ translateY }] }, style]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}
