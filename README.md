# Gestor de Gastos

Control de finanzas personales: ingresos, gastos, presupuestos y tasas de cambio. App nativa construida con **Expo SDK 57** + **React Native 0.86**.

> Porque llevar la cuenta de tus finanzas no debería ser un dolor de cabeza.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | [Expo SDK 57](https://docs.expo.dev/) |
| Navegación | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| UI | [HeroUI Native](https://heroui.com/) + [Lucide](https://lucide.dev/) icons |
| Estado | [Zustand 5](https://zustand.docs.pmnd.rs/) |
| Base de datos | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (SQLite local) |
| Layouts | [@gorhom/bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/) |
| Fuentes | Inter + Geist |

## Funcionalidades

- **Dashboard** — Resumen del mes: balance, ingresos/gastos, últimas transacciones
- **Registro** — Ingresos y gastos con categorías, teclado numérico custom, selector de método de pago
- **Categorías** — CRUD completo con categorías de ingreso y gasto curadas
- **Presupuestos** — Presupuesto por categoría con seguimiento de porcentaje
- **Estadísticas** — Gráficos de dona, categorías top, comparativa mes anterior
- **Multi-moneda** — Tasas de cambio personalizables (VES/USD/EUR)
- **Tema oscuro** — Interfaz 100% dark mode

## Requisitos

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android Studio (para emulador) o Xcode (para iOS simulator)

## Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npx expo start
```

Para construir el APK de release:

```bash
cd android
./gradlew assembleRelease
```

## Licencia

MIT
