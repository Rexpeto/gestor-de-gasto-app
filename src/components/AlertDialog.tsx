import { useCallback, useEffect, useRef } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    Text,
    View,
} from 'react-native';

import { RotateCcw, Trash2, Upload } from 'lucide-react-native/icons';

import { useAlertStore } from '@/store/alert-store';
import type { AlertIcon } from '@/store/alert-store';
import { useThemeColors } from '@/store/theme-store';

const ICON_MAP: Record<AlertIcon, React.FC<{ size: number; color: string }>> = {
    trash: Trash2,
    refresh: RotateCcw,
    upload: Upload,
};

export function AlertDialog() {
    const colors = useThemeColors();
    const { visible, title, message, options, icon, closeAlert } = useAlertStore();
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.92)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    damping: 18,
                    stiffness: 260,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            opacity.setValue(0);
            scale.setValue(0.92);
        }
    }, [visible, opacity, scale]);

    const handlePress = useCallback(
        (btn: (typeof options)[number]) => {
            closeAlert();
            // Pequeño delay para que la animación de cierre se vea
            setTimeout(() => btn.onPress?.(), 200);
        },
        [closeAlert],
    );

    const handleBackdrop = useCallback(() => {
        const cancelBtn = options.find((o) => o.style === 'cancel');
        if (cancelBtn) {
            cancelBtn.onPress?.();
            closeAlert();
        }
    }, [options, closeAlert]);

    // Si no hay opciones, mostramos un botón por defecto
    const buttons =
        options.length === 0
            ? [{ text: 'Aceptar' as const, style: 'default' as const }]
            : options;

    const hasCancel = buttons.some((o) => o.style === 'cancel');
    const HeaderIcon = icon ? ICON_MAP[icon] : null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleBackdrop}
            statusBarTranslucent
        >
            {/*
             * Backdrop touch → cierra si hay botón cancel
             * El Pressable ocupa toda la pantalla
             */}
            <Pressable
                onPress={hasCancel ? handleBackdrop : undefined}
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.55)',
                }}
            >
                {/*
                 * Card — detenemos la propagación del Pressable
                 * para que tocar dentro del diálogo NO cierre
                 */}
                <Pressable onPress={() => {}}>
                    <Animated.View
                        style={{
                            width: 300,
                            backgroundColor: colors.surfaceContainerHigh,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: colors.glassBorder,
                            padding: 24,
                            gap: 16,
                            opacity,
                            transform: [{ scale }],
                        }}
                    >
                        {/* Icono de cabecera */}
                        {HeaderIcon ? (
                            <View
                                style={{
                                    alignSelf: 'center',
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    backgroundColor: `${colors.danger}20`,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 4,
                                }}
                            >
                                <HeaderIcon size={24} color={colors.danger} />
                            </View>
                        ) : null}

                        {/* Título */}
                        {title ? (
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 18,
                                    fontWeight: '700',
                                    color: colors.onSurface,
                                    textAlign: 'center',
                                }}
                            >
                                {title}
                            </Text>
                        ) : null}

                        {/* Mensaje */}
                        {message ? (
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 14,
                                    fontWeight: '400',
                                    color: colors.onSurfaceVariant,
                                    textAlign: 'center',
                                    lineHeight: 20,
                                }}
                            >
                                {message}
                            </Text>
                        ) : null}

                        {/* Botones */}
                        <View
                            style={{
                                flexDirection: 'row',
                                gap: 10,
                                marginTop: buttons.length > 1 ? 8 : 0,
                            }}
                        >
                            {buttons.map((btn, i) => {
                                const isDestructive = btn.style === 'destructive';
                                const isCancel = btn.style === 'cancel';

                                let bg: string;
                                let txt: string;

                                if (isDestructive) {
                                    bg = colors.danger; // #ef4444 — rojo fijo en ambos modos
                                    txt = '#ffffff';
                                } else if (isCancel) {
                                    bg = 'transparent';
                                    txt = colors.onSurfaceVariant;
                                } else {
                                    bg = colors.primary;
                                    txt = colors.onPrimary;
                                }

                                return (
                                    <Pressable
                                        key={i}
                                        onPress={() => handlePress(btn)}
                                        style={({ pressed }) => ({
                                            flex: 1,
                                            backgroundColor: isCancel
                                                ? pressed
                                                    ? `${colors.outline}26`
                                                    : 'transparent'
                                                : pressed
                                                  ? `${bg}cc`
                                                  : bg,
                                            paddingVertical: 12,
                                            paddingHorizontal: 18,
                                            borderRadius: 10,
                                            borderWidth: isCancel ? 1 : 0,
                                            borderColor: isCancel
                                                ? colors.outline
                                                : 'transparent',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        })}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: 'Inter',
                                                fontSize: 14,
                                                fontWeight: '600',
                                                color: txt,
                                            }}
                                        >
                                            {btn.text}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </Animated.View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
