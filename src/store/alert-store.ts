import { create } from 'zustand';

export type AlertIcon = 'trash' | 'refresh' | 'upload';

export interface AlertButton {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    options: AlertButton[];
    icon: AlertIcon | null;
    showAlert: (
        title: string,
        message: string,
        options?: AlertButton[],
        icon?: AlertIcon | null,
    ) => void;
    closeAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
    visible: false,
    title: '',
    message: '',
    options: [],
    icon: null,

    showAlert: (title, message, options = [{ text: 'Aceptar' }], icon) => {
        set({ visible: true, title, message, options, icon: icon ?? null });
    },

    closeAlert: () => {
        set({ visible: false });
        // Clear options after animation completes
        setTimeout(() => {
            set({ title: '', message: '', options: [], icon: null });
        }, 300);
    },
}));

/**
 * Helper que reemplaza a Alert.alert() de React Native.
 * Uso: showAlert('Título', 'Mensaje', [botones], 'trash')
 */
export const showAlert = (
    title: string,
    message: string,
    options?: AlertButton[],
    icon?: AlertIcon | null,
) => {
    useAlertStore.getState().showAlert(title, message, options, icon);
};
