import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import {
  TriangleAlert,
  Trash2,
  RotateCcw,
  ChevronLeft,
  Download,
  Upload,
} from 'lucide-react-native/icons';

import {
  deleteDatabase,
  resetDatabase,
  exportDatabase,
  importDatabase,
} from '@/db/database';
import { showErrorToast, showSuccessToast } from '@/components/ThemedToast';
import { useCategoryStore } from '@/store/category-store';
import { useTransactionStore } from '@/store/transaction-store';
import { useRateStore } from '@/store/rate-store';
import { usePreferencesStore } from '@/store/preferences-store';
import { useThemeColors } from '@/store/theme-store';

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
        <Icon size={22} color={colors.error} />
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
        <Icon size={22} color={colors.primary} />
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
    Alert.alert(
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
    );
  };

  const handleDelete = () => {
    Alert.alert(
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
    Alert.alert(
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
        {/* ── Header ── */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${colors.onSurface}66`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={22} color={colors.onSurface} />
            </Pressable>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 24,
                fontWeight: '700',
                color: colors.onSurface,
              }}
            >
              Base de Datos
            </Text>
          </View>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 14,
              color: colors.onSurfaceVariant,
              marginLeft: 52,
            }}
          >
            Administración de almacenamiento local
          </Text>
        </View>

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
            <TriangleAlert size={20} color={colors.error} />
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
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: `${colors.onSurface}66`,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 12,
                fontWeight: '600',
                letterSpacing: 0.05,
                textTransform: 'uppercase',
                color: `${colors.error}D9`,
              }}
            >
              Acciones
            </Text>
          </View>

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

        {/* ── What each does ── */}
        <View
          style={{
            backgroundColor: colors.glassSurface ?? colors.surfaceContainer,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.glassBorderStrong ?? `${colors.outlineVariant}99`,
            padding: 16,
            marginTop: 16,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 14, marginBottom: 14 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: `${colors.primary}99`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RotateCcw size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.onSurface,
                  marginBottom: 2,
                }}
              >
                Restablecer
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: colors.onSurfaceVariant,
                  lineHeight: 18,
                }}
              >
                Vuelve a crear las tablas y las categorías desde cero.
                Los datos existentes se pierden.
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: `${colors.error}99`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={18} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.onSurface,
                  marginBottom: 2,
                }}
              >
                Eliminar
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: colors.onSurfaceVariant,
                  lineHeight: 18,
                }}
              >
                Remueve físicamente el archivo .db del dispositivo.
                Equivalente a empezar desde una instalación limpia.
              </Text>
            </View>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: `${colors.onSurface}66`,
              marginVertical: 14,
            }}
          />

          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: `${colors.primary}99`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Download size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.onSurface,
                  marginBottom: 2,
                }}
              >
                Exportar
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: colors.onSurfaceVariant,
                  lineHeight: 18,
                }}
              >
                Guarda una copia de todos los datos en un archivo JSON
                para respaldo o transferencia.
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 14, marginTop: 14 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: `${colors.primary}99`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Upload size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.onSurface,
                  marginBottom: 2,
                }}
              >
                Importar
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: colors.onSurfaceVariant,
                  lineHeight: 18,
                }}
              >
                Reemplaza los datos actuales con los de un archivo JSON
                previamente exportado.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
