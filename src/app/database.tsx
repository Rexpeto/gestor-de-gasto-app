import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  Download,
  RotateCcw,
  Trash2,
  TriangleAlert,
  Upload
} from 'lucide-react-native/icons';

import { showErrorToast, showSuccessToast } from '@/components/ThemedToast';
import {
  deleteDatabase,
  exportDatabase,
  importDatabase,
  resetDatabase,
} from '@/db/database';
import { showAlert } from '@/store/alert-store';
import { useCategoryStore } from '@/store/category-store';
import { usePreferencesStore } from '@/store/preferences-store';
import { useRateStore } from '@/store/rate-store';
import { useThemeColors } from '@/store/theme-store';
import { useTransactionStore } from '@/store/transaction-store';

// ─── Danger Button ───────────────────────────────────────────────────────────

function DangerButton({
  icon: Icon,
  label,
  description,
  onPress,
  loading,
  colors,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  description: string;
  onPress: () => void;
  loading: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        opacity: pressed || loading ? 0.6 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: `${colors.error}99`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}
      >
        <Icon size={22} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: '600',
            color: loading ? colors.onSurfaceVariant : colors.onSurface,
            marginBottom: 2,
          }}
        >
          {loading ? 'Procesando…' : label}
        </Text>
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 13,
            color: colors.onSurfaceVariant,
            lineHeight: 18,
          }}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Action Button (non-destructive) ──────────────────────────────────────────

function ActionButton({
  icon: Icon,
  label,
  description,
  onPress,
  loading,
  colors,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  description: string;
  onPress: () => void;
  loading: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        opacity: pressed || loading ? 0.6 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: `${colors.primary}99`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}
      >
        <Icon size={22} color={colors.onPrimary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: '600',
            color: loading ? colors.onSurfaceVariant : colors.onSurface,
            marginBottom: 2,
          }}
        >
          {loading ? 'Procesando…' : label}
        </Text>
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 13,
            color: colors.onSurfaceVariant,
            lineHeight: 18,
          }}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function DatabaseScreen() {
  const colors = useThemeColors();
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const reloadAllStores = async () => {
    await Promise.all([
      useCategoryStore.getState().loadCategories(),
      useTransactionStore.getState().loadTransactions(),
      useTransactionStore.getState().loadMonthlySummary(),
      useTransactionStore.getState().loadCategorySummaries(),
      useRateStore.getState().loadRates(),
      usePreferencesStore.getState().loadPreferences(),
    ]);
  };

  const handleReset = () => {
    showAlert(
      'Restablecer Base de Datos',
      '¿Estás seguro? Se eliminarán todas las transacciones, categorías y configuraciones, y se crearán las categorías por defecto.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await resetDatabase();
              await reloadAllStores();
              showSuccessToast('Base de datos restablecida');
            } catch {
              showErrorToast('Error al restablecer la base de datos');
            } finally {
              setResetting(false);
            }
          },
        },
      ],
      'refresh',
    );
  };

  const handleDelete = () => {
    showAlert(
      'Eliminar Base de Datos',
      '¿Estás seguro? Se eliminará TODO el archivo de la base de datos. La aplicación se reiniciará con datos de fábrica.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteDatabase();
              // After deletion, getDatabase() creates a fresh DB
              // Reload all stores from the brand-new database
              await reloadAllStores();
              showSuccessToast('Base de datos eliminada');
            } catch {
              showErrorToast('Error al eliminar la base de datos');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
      'trash',
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await exportDatabase();
      const fileName = `gestor-gastos-${new Date().toISOString().slice(0, 10)}.json`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar datos de Gestor de Gastos',
        });
      } else {
        showSuccessToast('Archivo guardado', filePath);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('cancel')) {
        // User cancelled the share — not an error
        return;
      }
      showErrorToast('Error al exportar datos');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = () => {
    showAlert(
      'Importar datos',
      'Esto reemplazará TODOS los datos actuales con los del archivo seleccionado. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
              });

              if (result.canceled) return;

              const file = result.assets[0];
              if (!file?.uri) return;

              setImporting(true);

              const content = await FileSystem.readAsStringAsync(file.uri, {
                encoding: FileSystem.EncodingType.UTF8,
              });

              await importDatabase(content);
              await reloadAllStores();

              showSuccessToast('Datos importados correctamente');
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'Error al importar datos';
              showErrorToast(message);
            } finally {
              setImporting(false);
            }
          },
        },
      ],
      'upload',
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 96,
        }}
      >
        {/* ── Info card ── */}
        <View
          style={{
            backgroundColor: `${colors.error}66`,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: `${colors.error}99`,
            padding: 16,
            flexDirection: 'row',
            gap: 12,
            marginBottom: 28,
          }}
        >
          <View style={{ marginTop: 1 }}>
            <TriangleAlert size={20} color="#fff" />
          </View>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 13,
              color: colors.onSurfaceVariant,
              lineHeight: 20,
              flex: 1,
            }}
          >
            Estas acciones son irreversibles. Afectan todos los datos almacenados
            localmente en el dispositivo.
          </Text>
        </View>

        {/* ── Actions card ── */}
        <View
          style={{
            backgroundColor: colors.glassSurface ?? colors.surfaceContainer,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.glassBorderStrong ?? `${colors.outlineVariant}99`,
            overflow: 'hidden',
          }}
        >
          <DangerButton
            icon={RotateCcw}
            label="Restablecer"
            description="Borra datos actuales y crea categorías por defecto"
            onPress={handleReset}
            loading={resetting}
            colors={colors}
          />

          <View style={{ height: 1, backgroundColor: `${colors.onSurface}66` }} />

          <DangerButton
            icon={Trash2}
            label="Eliminar"
            description="Borra TODO el archivo de base de datos por completo"
            onPress={handleDelete}
            loading={deleting}
            colors={colors}
          />
        </View>

        {/* ── Transferencia de datos ── */}
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 0.05,
              textTransform: 'uppercase',
              color: `${colors.primary}D9`,
              paddingHorizontal: 4,
              marginBottom: 12,
            }}
          >
            Transferencia de datos
          </Text>
          <View
            style={{
              backgroundColor: colors.glassSurface ?? colors.surfaceContainer,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.glassBorderStrong ?? `${colors.outlineVariant}99`,
              overflow: 'hidden',
            }}
          >
            <ActionButton
              icon={Download}
              label="Exportar datos"
              description="Guardar copia de seguridad en un archivo JSON"
              onPress={handleExport}
              loading={exporting}
              colors={colors}
            />

            <View style={{ height: 1, backgroundColor: `${colors.onSurface}66` }} />

            <ActionButton
              icon={Upload}
              label="Importar datos"
              description="Cargar datos desde un archivo JSON de respaldo"
              onPress={handleImport}
              loading={importing}
              colors={colors}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
