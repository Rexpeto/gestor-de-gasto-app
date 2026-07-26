import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useThemeColors } from '@/store/theme-store';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: object;
}

/**
 * Animated skeleton placeholder with shimmer effect.
 * Pulses opacity between 0.3 and 0.6.
 */
export function Skeleton({ width, height = 16, borderRadius = 8, style }: SkeletonProps) {
    const colors = useThemeColors();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.6,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: colors.outline,
                    opacity,
                },
                style,
            ]}
        />
    );
}

interface CalendarSkeletonProps {
    height?: number;
}

/**
 * Full skeleton for the RateCalendar — replaces the calendar grid + legend + inputs.
 */
export function CalendarSkeleton({ height = 300 }: CalendarSkeletonProps) {
    const colors = useThemeColors();

    return (
        <View>
            {/* Month header skeleton */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Skeleton width={140} height={20} borderRadius={6} />
                <Skeleton width={100} height={14} borderRadius={4} />
            </View>

            {/* Legend skeleton */}
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Skeleton width={8} height={8} borderRadius={4} />
                    <Skeleton width={110} height={11} borderRadius={4} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Skeleton width={8} height={8} borderRadius={4} />
                    <Skeleton width={40} height={11} borderRadius={4} />
                </View>
            </View>

            {/* Calendar grid skeleton — rows of day circles */}
            <View style={{ gap: 8 }}>
                {Array.from({ length: 5 }).map((_, rowIdx) => (
                    <View key={rowIdx} style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                        {Array.from({ length: 7 }).map((_, colIdx) => (
                            <Skeleton
                                key={colIdx}
                                width={36}
                                height={36}
                                borderRadius={18}
                            />
                        ))}
                    </View>
                ))}
            </View>

            {/* Selected day section skeleton */}
            <View
                style={{
                    marginTop: 16,
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: colors.glassSurface,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    gap: 10,
                }}
            >
                <Skeleton width={120} height={18} borderRadius={6} />
                <Skeleton width="100%" height={44} borderRadius={10} />
                <Skeleton width="100%" height={44} borderRadius={10} />
                <Skeleton width="100%" height={44} borderRadius={10} />
            </View>
        </View>
    );
}
