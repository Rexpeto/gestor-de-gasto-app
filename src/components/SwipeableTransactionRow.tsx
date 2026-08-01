import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Pencil, Trash2 } from 'lucide-react-native/icons';

import { showAlert } from '@/store/alert-store';
import { useThemeColors } from '@/store/theme-store';

interface SwipeableTransactionRowProps {
    transactionId: number;
    onEdit: (transactionId: number) => void;
    onDelete: (transactionId: number) => void;
    children: React.ReactNode;
}

const ACTION_WIDTH = 80;

/**
 * Custom swipe-to-reveal using Gesture API + Reanimated.
 *
 * Structure:
 *   <container>
 *     <LeftAction />    (zIndex: 0, positioned left)
 *     <RightAction />   (zIndex: 0, positioned right)
 *     <Content />       (zIndex: 1, slides via translateX — always on top)
 *   </container>
 *
 * The content slides OVER the actions. When content moves left,
 * the right action is revealed. When content moves right,
 * the left action is revealed.
 */
export function SwipeableTransactionRow({
    transactionId,
    onEdit,
    onDelete,
    children,
}: SwipeableTransactionRowProps) {
    const colors = useThemeColors();
    const translateX: SharedValue<number> = useSharedValue(0);

    const close = useCallback(() => {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
    }, [translateX]);

    const gesture = Gesture.Pan()
        .onUpdate((event) => {
            'worklet';
            // Clamp: negative = left swipe, positive = right swipe
            const clamped = Math.max(-ACTION_WIDTH, Math.min(ACTION_WIDTH, event.translationX));
            translateX.value = clamped;
        })
        .onEnd(() => {
            'worklet';
            if (translateX.value < -ACTION_WIDTH / 2) {
                translateX.value = withSpring(-ACTION_WIDTH, { damping: 20, stiffness: 300 });
            } else if (translateX.value > ACTION_WIDTH / 2) {
                translateX.value = withSpring(ACTION_WIDTH, { damping: 20, stiffness: 300 });
            } else {
                translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
            }
        });

    const contentStyle = useAnimatedStyle(() => {
        const isSwiping = Math.abs(translateX.value) > 2;
        return {
            transform: [{ translateX: translateX.value }],
            backgroundColor: isSwiping ? colors.surface : colors.glassSurface,
        };
    });

    const rightActionStyle = useAnimatedStyle(() => ({
        opacity: translateX.value < -5 ? 1 : 0,
    }));

    const leftActionStyle = useAnimatedStyle(() => ({
        opacity: translateX.value > 5 ? 1 : 0,
    }));

    return (
        <View style={{ position: 'relative' }}>
            {/* Right action (Editar) — fixed at right, behind content */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: ACTION_WIDTH,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: colors.primary,
                        borderTopRightRadius: 12,
                        borderBottomRightRadius: 12,
                    },
                    rightActionStyle,
                ]}
            >
                <Pressable
                    onPress={() => {
                        close();
                        onEdit(transactionId);
                    }}
                    style={{
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Pencil size={20} color="white" />
                    <Text
                        style={{
                            color: 'white',
                            fontSize: 11,
                            fontWeight: '600',
                            fontFamily: 'Inter',
                            marginTop: 4,
                        }}
                    >
                        Editar
                    </Text>
                </Pressable>
            </Animated.View>

            {/* Left action (Eliminar) — fixed at left, behind content */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: ACTION_WIDTH,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#ef4444',
                        borderTopLeftRadius: 12,
                        borderBottomLeftRadius: 12,
                    },
                    leftActionStyle,
                ]}
            >
                <Pressable
                    onPress={() => {
                        close();
                        showAlert(
                            'Eliminar transacción',
                            '¿Eliminar esta transacción? Esta acción no se puede deshacer.',
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                {
                                    text: 'Eliminar',
                                    style: 'destructive',
                                    onPress: () => onDelete(transactionId),
                                },
                            ],
                            'trash',
                        );
                    }}
                    style={{
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Trash2 size={20} color="white" />
                    <Text
                        style={{
                            color: 'white',
                            fontSize: 11,
                            fontWeight: '600',
                            fontFamily: 'Inter',
                            marginTop: 4,
                        }}
                    >
                        Eliminar
                    </Text>
                </Pressable>
            </Animated.View>

            {/* Content — slides on top of the actions */}
            <GestureDetector gesture={gesture}>
                <Animated.View
                    style={[
                        {
                            zIndex: 1,
                            borderRadius: 12,
                        },
                        contentStyle,
                    ]}
                >
                    {children}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}
