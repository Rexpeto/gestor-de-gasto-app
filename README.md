<p align="center">
  <img src="assets/thumbnail.png" alt="Gestor de Gastos" width="100%" />
</p>

# Gestor de Gastos

Control de finanzas personales: ingresos, gastos, presupuestos y tasas de cambio. App nativa construida con **Expo SDK 57** + **React Native 0.86**.

> Porque llevar la cuenta de tus finanzas no debería ser un dolor de cabeza.

---

## Funcionalidades

- **Dashboard** — Resumen mensual con tarjeta de crédito virtual: balance, ingresos/gastos, conversión multi-moneda
- **Registro** — Ingresos y gastos con teclado numérico custom, categorías y selector de método de pago ($ BCV, € BCV, USDT, Bs)
- **Categorías** — CRUD completo con iconos Lucide, colores personalizados y separación de ingresos/gastos
- **Presupuestos** — Presupuesto por categoría con toggle, montos multi-moneda y tracking de progreso
- **Estadísticas** — Gráfico de dona, comparativa por periodo (semanal/mensual/anual), categorías top con barras de progreso
- **Tasas de cambio** — Calendario de tasas BCV (USD/EUR) por día, tasa P2P USDT/Bs, auto-carga desde dolarapi.com
- **Multi-moneda** — Conversión automática Bs ↔ $/€/USDT con tasas diarias guardadas en base de datos
- **Tema** — Modo claro/oscuro/sistema con colores de acento personalizables
- **Base de datos** — SQLite local con export/import, backup completo

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | [Expo SDK 57](https://docs.expo.dev/) |
| Navegación | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| UI | NativeWind + [Lucide](https://lucide.dev/) icons |
| Estado | [Zustand 5](https://zustand.docs.pmnd.rs/) |
| Base de datos | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (SQLite local) |
| HTTP | [Axios](https://axios-http.com/) + [React Query](https://tanstack.com/query) |
| Animaciones | [Reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/) |
| Fuentes | Inter + Geist |
| Bottom Sheets | [@gorhom/bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/) |

---

## Arquitectura

```
src/
├── app/                    # Rutas Expo Router (file-based)
│   ├── (tabs)/             # Screens principales (Dashboard, Historial, Stats, Ajustes)
│   ├── fiscal.tsx          # Configuración fiscal y tasas de cambio
│   ├── budget.tsx          # Presupuesto por categoría
│   ├── categories.tsx      # Gestión de categorías
│   ├── add-transaction.tsx # Modal para agregar transacción
│   └── add-category.tsx    # Modal para agregar categoría
├── components/             # Componentes reutilizables
│   ├── credit-card/        # Tarjeta de crédito virtual (descompuesta)
│   ├── stats/              # Componentes de estadísticas
│   ├── settings/           # Componentes de ajustes (GlassCard, NavRow)
│   └── fiscal/             # Calendario de tasas de cambio
├── store/                  # Estado global (Zustand)
│   ├── transaction-store.ts
│   ├── rate-store.ts
│   ├── preferences-store.ts
│   └── category-store.ts
├── db/                     # Base de datos SQLite
│   └── database.ts         # Conexión, migraciones, queries
├── services/               # Servicios externos
│   └── bcv-rates.ts        # Fetch de tasas BCV desde dolarapi.com
├── hooks/                  # Custom hooks
├── types/                  # Definiciones TypeScript
└── utils/                  # Utilidades (currency, currency-format)
```

---

## Modelo de datos

Cada transacción almacena:
- `priceOriginal` — Monto ingresado por el usuario
- `priceCalculated` — Equivalente en Bs al momento de guardar (amount × rate)

Los totales siempre suman `priceCalculated` (ya en Bs), eliminando conversiones al momento de leer.

Las tasas de cambio se guardan por día en la tabla `daily_rates`, con fallback a tasas mensuales y al presupuesto configurado.

---

## Requisitos

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android Studio (para APK o emulador)

---

## Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npx expo start

# Ejecutar en emulador Android
npx expo run:android
```

---

## Compilar APK

### Opción 1: Script de npm

```bash
npm run apk
```

Esto ejecuta `assembleRelease` solo para arquitectura `arm64-v8a` (la más común en dispositivos actuales).

### Opción 2: Manual

```bash
# 1. Generar el directorio android/ (si no existe)
npx expo prebuild --platform android

# 2. Compilar APK de release
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

### Opción 3: Desarrollo (con Expo Go o dev build)

```bash
# Dev client (recomendado para desarrollo)
npx expo run:android

# O con Expo Go
npx expo start
# Escanear QR con Expo Go
```

### Ubicación del APK

El APK generado se encuentra en:

```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Variables de entorno

No se requieren variables de entorno. La app consume:
- **dolarapi.com** — Para tasas de cambio BCV (USD/EUR)
- Todo lo demás es almacenamiento local (SQLite)

---

## Licencia

MIT
