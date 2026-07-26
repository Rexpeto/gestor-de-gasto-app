import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

import type {
    Category,
    DailyRates,
    MonthlyRates,
    Transaction,
    TransactionType,
} from '@/types';

const DB_NAME = 'gestor-gastos.db';

let db: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let _reconnectPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function _createConnection(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync(DB_NAME);
  if (!database) throw new Error('openDatabaseAsync returned null');
  return database;
}

/** Wait for native SQLite to fully release the old handle. */
function _sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function _reconnect(): Promise<SQLite.SQLiteDatabase> {
  // If a reconnect is already in progress, share it
  if (_reconnectPromise) return _reconnectPromise;

  _reconnectPromise = (async () => {
    db = null;
    dbPromise = null;
    await _sleep(500);
    const database = await _createConnection();
    await runMigrations(database);
    db = database;
    dbPromise = Promise.resolve(database);
    return database;
  })();

  try {
    return await _reconnectPromise;
  } finally {
    _reconnectPromise = null;
  }
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const database = await _createConnection();
      await runMigrations(database);
      db = database;
      return database;
    })();
  }

  try {
    const database = await dbPromise;
    // Health check: if the native handle is broken (e.g. after closeAsync on Android),
    // a simple PRAGMA will throw. Detect this and force reconnect.
    await database.getFirstAsync('PRAGMA journal_mode');
    return database;
  } catch {
    // Connection is dead — reconnect once, all concurrent callers share the same promise
    return _reconnect();
  }
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'circle-question-mark',
      color TEXT NOT NULL DEFAULT '#6366f1',
      type TEXT NOT NULL CHECK(type IN ('income', 'expense'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category_id INTEGER NOT NULL,
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'bsc',
      exchange_rate REAL NOT NULL DEFAULT 0,
      price_original REAL NOT NULL DEFAULT 0,
      price_calculated REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  `);

  // Seed default categories if empty
  const count = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );

  if (count?.count === 0) {
    await seedDefaultCategories(database);
    // Fresh seed already has curated income categories — mark v2 as done
    await database.runAsync(
      'INSERT OR REPLACE INTO _migrations (version) VALUES (2)'
    );
  }

  // Migration v2: replace income categories with curated set
  const currentVersion = await database.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM _migrations'
  );
  if (!currentVersion?.version || currentVersion.version < 2) {
    await migrateIncomeCategoriesV2(database);
    await database.runAsync(
      'INSERT OR REPLACE INTO _migrations (version) VALUES (2)'
    );
  }

  // Migration v3: replace emoji icons with Lucide icon names
  const currentVersionV3 = await database.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM _migrations'
  );
  if (!currentVersionV3?.version || currentVersionV3.version < 3) {
    await migrateEmojiToLucideIconsV3(database);
    await database.runAsync(
      'INSERT OR REPLACE INTO _migrations (version) VALUES (3)'
    );
  }

  // Migration v4: monthly exchange rates table
  const currentVersionV4 = await database.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM _migrations'
  );
  if (!currentVersionV4?.version || currentVersionV4.version < 4) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS monthly_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        p2p_rate REAL NOT NULL DEFAULT 0,
        bcv_usd_rate REAL NOT NULL DEFAULT 0,
        bcv_eur_rate REAL NOT NULL DEFAULT 0,
        UNIQUE(month, year)
      )
    `);
    await database.runAsync(
      'INSERT OR REPLACE INTO _migrations (version) VALUES (4)'
    );
  }

  // Migration v5: persistent key-value settings (monthlyBudget, etc.)
  const currentVersionV5 = await database.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM _migrations'
  );
  if (!currentVersionV5?.version || currentVersionV5.version < 5) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      )
    `);
    await database.runAsync(
      'INSERT OR REPLACE INTO _migrations (version) VALUES (5)'
    );
  }

  // Migration v6: add currency column to transactions
  const currentVersionV6 = await database.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM _migrations'
  );
  if (!currentVersionV6?.version || currentVersionV6.version < 6) {
    // Check if column already exists (CREATE TABLE may include it)
    const cols = await database.getAllAsync<{ name: string }>(
      "PRAGMA table_info(transactions)"
    );
    const hasCurrency = cols.some((c) => c.name === 'currency');
    if (!hasCurrency) {
      await database.execAsync(`
        ALTER TABLE transactions ADD COLUMN currency TEXT NOT NULL DEFAULT 'bsc'
      `);
    }
    await database.runAsync(
      'INSERT OR REPLACE INTO _migrations (version) VALUES (6)'
    );
  }

  // Migration v7: daily exchange rates table
  const currentVersionV7 = await database.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM _migrations'
  );
  if (!currentVersionV7?.version || currentVersionV7.version < 7) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_rates (
        date TEXT PRIMARY KEY NOT NULL,
        p2p_rate REAL NOT NULL DEFAULT 0,
        bcv_usd_rate REAL NOT NULL DEFAULT 0,
        bcv_eur_rate REAL NOT NULL DEFAULT 0
      )
    `);
    await database.runAsync(
      'INSERT OR REPLACE INTO _migrations (version) VALUES (7)'
    );
  }

  // Migration v8: exchange_rate column on transactions
  const currentVersionV8 = await database.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM _migrations'
  );
  if (!currentVersionV8?.version || currentVersionV8.version < 8) {
    const cols = await database.getAllAsync<{ name: string }>(
      "PRAGMA table_info(transactions)"
    );
    const hasExchangeRate = cols.some((c) => c.name === 'exchange_rate');
    if (!hasExchangeRate) {
      await database.execAsync(`
        ALTER TABLE transactions ADD COLUMN exchange_rate REAL NOT NULL DEFAULT 0
      `);
    }
    await database.runAsync(
      'INSERT OR REPLACE INTO _migrations (version) VALUES (8)'
    );
  }

  // Migration v9: price_original + price_calculated columns
  const currentVersionV9 = await database.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM _migrations'
  );
  if (!currentVersionV9?.version || currentVersionV9.version < 9) {
    const cols = await database.getAllAsync<{ name: string }>(
      "PRAGMA table_info(transactions)"
    );
    const hasPriceOriginal = cols.some((c) => c.name === 'price_original');
    const hasPriceCalculated = cols.some((c) => c.name === 'price_calculated');

    if (!hasPriceOriginal) {
      await database.execAsync(`
        ALTER TABLE transactions ADD COLUMN price_original REAL NOT NULL DEFAULT 0
      `);
    }
    if (!hasPriceCalculated) {
      await database.execAsync(`
        ALTER TABLE transactions ADD COLUMN price_calculated REAL NOT NULL DEFAULT 0
      `);
    }

    // Backfill: price_original = amount, price_calculated = amount × exchange_rate
    await database.execAsync(`
      UPDATE transactions
      SET price_original = amount,
          price_calculated = CASE
            WHEN exchange_rate > 0 THEN amount * exchange_rate
            WHEN currency = 'bs' THEN amount
            ELSE 0
          END
      WHERE price_original = 0
    `);

    await database.runAsync(
      'INSERT OR REPLACE INTO _migrations (version) VALUES (9)'
    );
  }
}

const CURATED_INCOME_CATEGORIES: Array<{
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}> = [
  { name: 'Salario', icon: 'briefcase', color: '#22c55e', type: 'income' },
  { name: 'Freelance', icon: 'laptop', color: '#3b82f6', type: 'income' },
  { name: 'Ventas', icon: 'store', color: '#f59e0b', type: 'income' },
  { name: 'Inversiones', icon: 'trending-up', color: '#8b5cf6', type: 'income' },
  { name: 'Otros ingresos', icon: 'arrow-down-left', color: '#06b6d4', type: 'income' },
];

async function seedDefaultCategories(database: SQLite.SQLiteDatabase): Promise<void> {
  const defaultCategories: Array<{
    name: string;
    icon: string;
    color: string;
    type: TransactionType;
  }> = [
    // Income — curated
    ...CURATED_INCOME_CATEGORIES,
    // Expenses
    { name: 'Alimentación', icon: 'utensils-crossed', color: '#ef4444', type: 'expense' },
    { name: 'Transporte', icon: 'car', color: '#f97316', type: 'expense' },
    { name: 'Vivienda', icon: 'house', color: '#eab308', type: 'expense' },
    { name: 'Servicios', icon: 'zap', color: '#a855f7', type: 'expense' },
    { name: 'Salud', icon: 'heart-pulse', color: '#ec4899', type: 'expense' },
    { name: 'Entretenimiento', icon: 'gamepad-2', color: '#14b8a6', type: 'expense' },
    { name: 'Compras', icon: 'shopping-bag', color: '#f43f5e', type: 'expense' },
    { name: 'Educación', icon: 'book-open', color: '#6366f1', type: 'expense' },
    { name: 'Otros gastos', icon: 'ellipsis', color: '#78716c', type: 'expense' },
  ];

  for (const cat of defaultCategories) {
    await database.runAsync(
      'INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?)',
      [cat.name, cat.icon, cat.color, cat.type]
    );
  }
}

async function migrateIncomeCategoriesV2(database: SQLite.SQLiteDatabase): Promise<void> {
  // 1. Collect old income category IDs before making any changes
  const oldIncomeRows = await database.getAllAsync<{ id: number }>(
    "SELECT id FROM categories WHERE type = 'income'",
  );
  const oldIncomeIds = oldIncomeRows.map((r) => r.id);

  if (oldIncomeIds.length === 0) return; // nothing to migrate

  // 2. Create the new curated income categories (they get fresh IDs)
  for (const cat of CURATED_INCOME_CATEGORIES) {
    await database.runAsync(
      'INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?)',
      [cat.name, cat.icon, cat.color, cat.type],
    );
  }

  // 3. Find the new "Otros ingresos" ID to use as reassignment target
  const otrosRow = await database.getFirstAsync<{ id: number }>(
    "SELECT id FROM categories WHERE name = 'Otros ingresos' AND type = 'income' ORDER BY id DESC LIMIT 1",
  );
  const otrosId = otrosRow!.id;

  // 4. Reassign old income transactions to "Otros ingresos"
  const placeholders = oldIncomeIds.map(() => '?').join(',');
  await database.runAsync(
    `UPDATE transactions SET category_id = ? WHERE category_id IN (${placeholders})`,
    [otrosId, ...oldIncomeIds],
  );

  // 5. Delete old income categories (no transactions reference them anymore)
  await database.runAsync(
    `DELETE FROM categories WHERE id IN (${placeholders})`,
    oldIncomeIds,
  );
}

async function migrateEmojiToLucideIconsV3(
  database: SQLite.SQLiteDatabase
): Promise<void> {
  const EMOJI_TO_LUCIDE: Record<string, string> = {
    '💰': 'briefcase',
    '💻': 'laptop',
    '🛒': 'store',
    '📈': 'trending-up',
    '📥': 'arrow-down-left',
    '🍽️': 'utensils-crossed',
    '🚗': 'car',
    '🏠': 'house',
    '💡': 'zap',
    '🏥': 'heart-pulse',
    '🎬': 'gamepad-2',
    '🛍️': 'shopping-bag',
    '📚': 'book-open',
    '📤': 'ellipsis',
    '🎮': 'gamepad-2',
    '☕': 'coffee',
    '✈️': 'plane',
    '👕': 'shirt',
    '💊': 'pill',
    '🎓': 'graduation-cap',
    '🏋️': 'dumbbell',
    '🐾': 'paw-print',
    '🎁': 'gift',
    '💎': 'gem',
  };

  for (const [emoji, lucide] of Object.entries(EMOJI_TO_LUCIDE)) {
    await database.runAsync(
      'UPDATE categories SET icon = ? WHERE icon = ?',
      [lucide, emoji]
    );
  }
}

// ─── Transaction Queries ───────────────────────────────────────

export async function getAllTransactions(): Promise<Transaction[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    amount: number;
    type: string;
    category_id: number;
    description: string;
    date: string;
    currency: string;
    price_original: number;
    price_calculated: number;
    created_at: string;
  }>(
    'SELECT t.* FROM transactions t ORDER BY t.date DESC, t.created_at DESC'
  );

  return rows.map(mapTransaction);
}

export async function getTransactionsByMonth(
  year: number,
  month: number
): Promise<Transaction[]> {
  const database = await getDatabase();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const rows = await database.getAllAsync<{
    id: number;
    amount: number;
    type: string;
    category_id: number;
    description: string;
    date: string;
    currency: string;
    price_original: number;
    price_calculated: number;
    created_at: string;
  }>(
    "SELECT t.* FROM transactions t WHERE t.date LIKE ? ORDER BY t.date DESC, t.created_at DESC",
    [`${prefix}%`]
  );

  return rows.map(mapTransaction);
}

export async function getTransactionsByDateRange(
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    amount: number;
    type: string;
    category_id: number;
    description: string;
    date: string;
    currency: string;
    price_original: number;
    price_calculated: number;
    created_at: string;
  }>(
    "SELECT t.* FROM transactions t WHERE t.date BETWEEN ? AND ? ORDER BY t.date DESC, t.created_at DESC",
    [startDate, endDate]
  );

  return rows.map(mapTransaction);
}

export async function createTransaction(params: {
  amount: number;
  type: TransactionType;
  categoryId: number;
  description: string;
  date: string;
  currency?: string;
  priceOriginal?: number;
  priceCalculated?: number;
}): Promise<Transaction> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO transactions (amount, type, category_id, description, date, currency, price_original, price_calculated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      params.amount,
      params.type,
      params.categoryId,
      params.description,
      params.date,
      params.currency ?? 'bsc',
      params.priceOriginal ?? params.amount,
      params.priceCalculated ?? params.amount,
    ]
  );

  const row = await database.getFirstAsync<{
    id: number;
    amount: number;
    type: string;
    category_id: number;
    description: string;
    date: string;
    currency: string;
    price_original: number;
    price_calculated: number;
    created_at: string;
  }>('SELECT * FROM transactions WHERE id = ?', [result.lastInsertRowId]);

  if (!row) throw new Error('Failed to create transaction');
  return mapTransaction(row);
}

export async function updateTransaction(
  id: number,
  params: Partial<{
    amount: number;
    type: TransactionType;
    categoryId: number;
    description: string;
    date: string;
    currency?: string;
    priceOriginal?: number;
    priceCalculated?: number;
  }>
): Promise<void> {
  const database = await getDatabase();

  if (Object.keys(params).length === 0) return;

  const sets: string[] = [];
  const bindings: (string | number)[] = [];

  if (params.amount !== undefined) {
    sets.push('amount = ?');
    bindings.push(params.amount);
  }
  if (params.type !== undefined) {
    sets.push('type = ?');
    bindings.push(params.type);
  }
  if (params.categoryId !== undefined) {
    sets.push('category_id = ?');
    bindings.push(params.categoryId);
  }
  if (params.description !== undefined) {
    sets.push('description = ?');
    bindings.push(params.description);
  }
  if (params.date !== undefined) {
    sets.push('date = ?');
    bindings.push(params.date);
  }
  if (params.currency !== undefined) {
    sets.push('currency = ?');
    bindings.push(params.currency);
  }
  if (params.priceOriginal !== undefined) {
    sets.push('price_original = ?');
    bindings.push(params.priceOriginal);
  }
  if (params.priceCalculated !== undefined) {
    sets.push('price_calculated = ?');
    bindings.push(params.priceCalculated);
  }

  bindings.push(id);
  await database.runAsync(
    `UPDATE transactions SET ${sets.join(', ')} WHERE id = ?`,
    bindings
  );
}

export async function deleteTransaction(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export async function getMonthlySummary(
  year: number,
  month: number
): Promise<{ totalIncome: number; totalExpense: number }> {
  const database = await getDatabase();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  const row = await database.getFirstAsync<{
    totalIncome: number;
    totalExpense: number;
  }>(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense
    FROM transactions WHERE date LIKE ?`,
    [`${prefix}%`]
  );

  return {
    totalIncome: row?.totalIncome ?? 0,
    totalExpense: row?.totalExpense ?? 0,
  };
}

export async function getCategorySummary(
  year: number,
  month: number,
  type: TransactionType
): Promise<
  Array<{
    categoryId: number;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    total: number;
    percentage: number;
  }>
> {
  const database = await getDatabase();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  const totalRow = await database.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ? AND date LIKE ?",
    [type, `${prefix}%`]
  );
  const grandTotal = totalRow?.total ?? 0;

  const rows = await database.getAllAsync<{
    categoryId: number;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    total: number;
  }>(
    `SELECT
      c.id as categoryId,
      c.name as categoryName,
      c.icon as categoryIcon,
      c.color as categoryColor,
      COALESCE(SUM(t.amount), 0) as total
    FROM categories c
    LEFT JOIN transactions t ON c.id = t.category_id AND t.date LIKE ?
    WHERE c.type = ?
    GROUP BY c.id
    ORDER BY total DESC`,
    [`${prefix}%`, type]
  );

  return rows.map((r) => ({
    ...r,
    percentage: grandTotal > 0 ? Math.round((r.total / grandTotal) * 100) : 0,
  }));
}

// ─── Category Queries ──────────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    name: string;
    icon: string;
    color: string;
    type: string;
  }>('SELECT * FROM categories ORDER BY type, name');

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    type: r.type as TransactionType,
  }));
}

export async function getCategoriesByType(
  type: TransactionType
): Promise<Category[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    name: string;
    icon: string;
    color: string;
    type: string;
  }>('SELECT * FROM categories WHERE type = ? ORDER BY name', [type]);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    type: r.type as TransactionType,
  }));
}

export async function createCategory(params: {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}): Promise<Category> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?)',
    [params.name, params.icon, params.color, params.type]
  );

  const row = await database.getFirstAsync<{
    id: number;
    name: string;
    icon: string;
    color: string;
    type: string;
  }>('SELECT * FROM categories WHERE id = ?', [result.lastInsertRowId]);

  if (!row) throw new Error('Failed to create category');
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type as TransactionType,
  };
}

export async function updateCategory(
  id: number,
  params: Partial<{ name: string; icon: string; color: string }>
): Promise<void> {
  const database = await getDatabase();

  if (Object.keys(params).length === 0) return;

  const sets: string[] = [];
  const bindings: (string | number)[] = [];

  if (params.name !== undefined) {
    sets.push('name = ?');
    bindings.push(params.name);
  }
  if (params.icon !== undefined) {
    sets.push('icon = ?');
    bindings.push(params.icon);
  }
  if (params.color !== undefined) {
    sets.push('color = ?');
    bindings.push(params.color);
  }

  bindings.push(id);
  await database.runAsync(
    `UPDATE categories SET ${sets.join(', ')} WHERE id = ?`,
    bindings
  );
}

export async function deleteCategory(id: number): Promise<void> {
  const database = await getDatabase();
  // Check if category has transactions
  const count = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?',
    id
  );

  if (count && count.count > 0) {
    throw new Error(
      `No se puede eliminar: ${count.count} transacción(es) usan esta categoría`
    );
  }

  await database.runAsync('DELETE FROM categories WHERE id = ?', id);
}

// ─── Monthly Rates ─────────────────────────────────────────────

export async function getMonthlyRates(
    month: number,
    year: number,
): Promise<MonthlyRates | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync<{
        p2p_rate: number;
        bcv_usd_rate: number;
        bcv_eur_rate: number;
    }>(
        'SELECT p2p_rate, bcv_usd_rate, bcv_eur_rate FROM monthly_rates WHERE month = ? AND year = ?',
        [month, year],
    );

    if (!row) return null;

    return {
        month,
        year,
        p2pRate: row.p2p_rate,
        bcvUsdRate: row.bcv_usd_rate,
        bcvEurRate: row.bcv_eur_rate,
    };
}

export async function upsertMonthlyRates(
    month: number,
    year: number,
    rates: { p2pRate: number; bcvUsdRate: number; bcvEurRate: number },
): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
        `INSERT INTO monthly_rates (month, year, p2p_rate, bcv_usd_rate, bcv_eur_rate)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(month, year) DO UPDATE SET
           p2p_rate = excluded.p2p_rate,
           bcv_usd_rate = excluded.bcv_usd_rate,
           bcv_eur_rate = excluded.bcv_eur_rate`,
        [month, year, rates.p2pRate, rates.bcvUsdRate, rates.bcvEurRate],
    );
}

export async function getAllMonthlyRates(): Promise<MonthlyRates[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<{
        month: number;
        year: number;
        p2p_rate: number;
        bcv_usd_rate: number;
        bcv_eur_rate: number;
    }>('SELECT * FROM monthly_rates ORDER BY year DESC, month DESC');

    return rows.map((r) => ({
        month: r.month,
        year: r.year,
        p2pRate: r.p2p_rate,
        bcvUsdRate: r.bcv_usd_rate,
        bcvEurRate: r.bcv_eur_rate,
    }));
}

// ─── Daily Rates ──────────────────────────────────────────────

type DailyRateRow = {
  p2p_rate: number;
  bcv_usd_rate: number;
  bcv_eur_rate: number;
};

function mapDailyRate(row: DailyRateRow): {
  p2pRate: number;
  bcvUsdRate: number;
  bcvEurRate: number;
} {
  return {
    p2pRate: row.p2p_rate,
    bcvUsdRate: row.bcv_usd_rate,
    bcvEurRate: row.bcv_eur_rate,
  };
}

export async function upsertDailyRate(
  date: string,
  rates: { p2pRate: number; bcvUsdRate: number; bcvEurRate: number },
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO daily_rates (date, p2p_rate, bcv_usd_rate, bcv_eur_rate)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       p2p_rate = excluded.p2p_rate,
       bcv_usd_rate = excluded.bcv_usd_rate,
       bcv_eur_rate = excluded.bcv_eur_rate`,
    [date, rates.p2pRate, rates.bcvUsdRate, rates.bcvEurRate],
  );
}

export async function getDailyRateForDate(
  date: string,
): Promise<{ p2pRate: number; bcvUsdRate: number; bcvEurRate: number } | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<DailyRateRow>(
    'SELECT p2p_rate, bcv_usd_rate, bcv_eur_rate FROM daily_rates WHERE date = ?',
    [date],
  );
  return row ? mapDailyRate(row) : null;
}

export async function getDailyRatesForMonth(
  year: number,
  month: number,
): Promise<Map<string, { p2pRate: number; bcvUsdRate: number; bcvEurRate: number }>> {
  const database = await getDatabase();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const rows = await database.getAllAsync<
    DailyRateRow & { date: string }
  >(
    'SELECT date, p2p_rate, bcv_usd_rate, bcv_eur_rate FROM daily_rates WHERE date LIKE ?',
    [`${prefix}%`],
  );

  const map = new Map<string, { p2pRate: number; bcvUsdRate: number; bcvEurRate: number }>();
  for (const row of rows) {
    map.set(row.date, mapDailyRate(row));
  }
  return map;
}

export async function upsertDailyRates(
  rates: Array<{
    date: string;
    p2pRate: number;
    bcvUsdRate: number;
    bcvEurRate: number;
  }>,
): Promise<void> {
  const database = await getDatabase();
  for (const r of rates) {
    await database.runAsync(
      `INSERT INTO daily_rates (date, p2p_rate, bcv_usd_rate, bcv_eur_rate)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         p2p_rate = excluded.p2p_rate,
         bcv_usd_rate = excluded.bcv_usd_rate,
         bcv_eur_rate = excluded.bcv_eur_rate`,
      [r.date, r.p2pRate, r.bcvUsdRate, r.bcvEurRate],
    );
  }
}

// ─── Settings ─────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value],
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function mapTransaction(row: {
  id: number;
  amount: number;
  type: string;
  category_id: number;
  description: string;
  date: string;
  currency: string;
  price_original: number;
  price_calculated: number;
  created_at: string;
}): Transaction {
  return {
    id: row.id,
    amount: row.amount,
    type: row.type as TransactionType,
    categoryId: row.category_id,
    description: row.description ?? '',
    date: row.date,
    currency: row.currency,
    priceOriginal: row.price_original ?? row.amount,
    priceCalculated: row.price_calculated ?? 0,
    createdAt: row.created_at,
  };
}

// ─── Database Reset ──────────────────────────────────────────

/**
 * Drops all tables and recreates them from scratch within the same connection.
 * More reliable than deleting the DB file (avoids WAL/locking issues).
 *
 * This runs table creation + seed directly, skipping migration logic
 * (migrations are only for upgrading existing databases).
 */
export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();

  // Drop all tables (order matters: transactions first due to FK)
  await database.execAsync(`
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS monthly_rates;
    DROP TABLE IF EXISTS daily_rates;
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS _migrations;
  `);

  // Re-create tables (same as in runMigrations)
  await database.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'circle-question-mark',
      color TEXT NOT NULL DEFAULT '#6366f1',
      type TEXT NOT NULL CHECK(type IN ('income', 'expense'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category_id INTEGER NOT NULL,
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'bsc',
      exchange_rate REAL NOT NULL DEFAULT 0,
      price_original REAL NOT NULL DEFAULT 0,
      price_calculated REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

    CREATE TABLE IF NOT EXISTS monthly_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      p2p_rate REAL NOT NULL DEFAULT 0,
      bcv_usd_rate REAL NOT NULL DEFAULT 0,
      bcv_eur_rate REAL NOT NULL DEFAULT 0,
      UNIQUE(month, year)
    );

    CREATE TABLE IF NOT EXISTS daily_rates (
      date TEXT PRIMARY KEY NOT NULL,
      p2p_rate REAL NOT NULL DEFAULT 0,
      bcv_usd_rate REAL NOT NULL DEFAULT 0,
      bcv_eur_rate REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  // Seed categories from scratch (includes curated income categories)
  await seedDefaultCategories(database);
}

// ─── Database File Management ──────────────────────────────────

/**
 * Deletes the entire database file from disk.
 *
 * WARNING: On Android, expo-sqlite closeAsync() permanently breaks the
 * native handle for the DB name within the process. Do NOT call closeAsync().
 * If the file must be deleted, the app should be restarted afterward.
 */
export async function deleteDatabase(): Promise<void> {
  // NEVER call db.closeAsync() — it breaks the native handle on Android.
  // Just null the references so getDatabase() creates a fresh connection.
  db = null;
  dbPromise = null;

  // Delete DB file + WAL/SHM sidecar files
  const documentDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  const basePath = `${documentDir}SQLite/${DB_NAME}`;
  const filesToDelete = [basePath, `${basePath}-wal`, `${basePath}-shm`];
  for (const filePath of filesToDelete) {
    try {
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists) {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }
    } catch {
      // ignore
    }
  }
}

// ─── Export / Import ────────────────────────────────────────────

export interface ExportData {
  version: number;
  exportedAt: string;
  categories: Array<{
    id?: number; // optional — import assigns new IDs
    name: string;
    icon: string;
    color: string;
    type: TransactionType;
  }>;
  transactions: Array<{
    amount: number;
    type: TransactionType;
    categoryName: string; // matched by name on import
    description: string;
    date: string;
    createdAt: string;
    currency?: string; // optional for backward-compatible exports
  }>;
  monthlyRates: Array<{
    month: number;
    year: number;
    p2pRate: number;
    bcvUsdRate: number;
    bcvEurRate: number;
  }>;
  dailyRates: Array<{
    date: string;
    p2pRate: number;
    bcvUsdRate: number;
    bcvEurRate: number;
  }>;
  settings: Array<{
    key: string;
    value: string;
  }>;
}

/**
 * Exports all data as a JSON string.
 */
export async function exportDatabase(): Promise<string> {
  const database = await getDatabase();

  const categories = await database.getAllAsync<{
    id: number;
    name: string;
    icon: string;
    color: string;
    type: string;
  }>('SELECT * FROM categories ORDER BY id');

  const transactions = await database.getAllAsync<{
    id: number;
    amount: number;
    type: string;
    category_id: number;
    description: string;
    date: string;
    currency: string;
    created_at: string;
  }>('SELECT * FROM transactions ORDER BY id');

  const monthlyRates = await database.getAllAsync<{
    month: number;
    year: number;
    p2p_rate: number;
    bcv_usd_rate: number;
    bcv_eur_rate: number;
  }>('SELECT * FROM monthly_rates ORDER BY year, month');

  const dailyRates = await database.getAllAsync<{
    date: string;
    p2p_rate: number;
    bcv_usd_rate: number;
    bcv_eur_rate: number;
  }>('SELECT * FROM daily_rates ORDER BY date');

  const settings = await database.getAllAsync<{
    key: string;
    value: string;
  }>('SELECT * FROM settings');

  // Build category-name lookup for transactions
  const catMap = new Map<number, string>();
  for (const c of categories) {
    catMap.set(c.id, c.name);
  }

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      type: c.type as TransactionType,
    })),
    transactions: transactions.map((t) => ({
      amount: t.amount,
      type: t.type as TransactionType,
      categoryName: catMap.get(t.category_id) ?? 'Otros gastos',
      description: t.description ?? '',
      date: t.date,
      createdAt: t.created_at,
      currency: t.currency,
    })),
    monthlyRates: monthlyRates.map((r) => ({
      month: r.month,
      year: r.year,
      p2pRate: r.p2p_rate,
      bcvUsdRate: r.bcv_usd_rate,
      bcvEurRate: r.bcv_eur_rate,
    })),
    dailyRates: dailyRates.map((r) => ({
      date: r.date,
      p2pRate: r.p2p_rate,
      bcvUsdRate: r.bcv_usd_rate,
      bcvEurRate: r.bcv_eur_rate,
    })),
    settings: settings.map((s) => ({
      key: s.key,
      value: s.value,
    })),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Imports data from a JSON string — replaces ALL current data.
 */
export async function importDatabase(json: string): Promise<void> {
  const database = await getDatabase();
  const data: ExportData = JSON.parse(json);

  // Clear existing data (order: transactions first due to FK)
  await database.execAsync(`
    DELETE FROM transactions;
    DELETE FROM categories;
    DELETE FROM monthly_rates;
    DELETE FROM daily_rates;
    DELETE FROM settings;
  `);

  // Insert categories and build name → new-id map
  const catNameToId = new Map<string, number>();
  for (const cat of data.categories) {
    const result = await database.runAsync(
      'INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?)',
      [cat.name, cat.icon, cat.color, cat.type],
    );
    catNameToId.set(cat.name, Number(result.lastInsertRowId));
  }

  // Insert transactions
  for (const tx of data.transactions) {
    const categoryId = catNameToId.get(tx.categoryName);
    if (!categoryId) continue; // skip if category not found
    await database.runAsync(
      'INSERT INTO transactions (amount, type, category_id, description, date, currency, price_original, price_calculated, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tx.amount, tx.type, categoryId, tx.description, tx.date, tx.currency ?? 'bsc', tx.amount, 0, tx.createdAt],
    );
  }

  // Insert monthly rates
  for (const r of data.monthlyRates) {
    await database.runAsync(
      `INSERT INTO monthly_rates (month, year, p2p_rate, bcv_usd_rate, bcv_eur_rate)
       VALUES (?, ?, ?, ?, ?)`,
      [r.month, r.year, r.p2pRate, r.bcvUsdRate, r.bcvEurRate],
    );
  }

  // Insert daily rates
  for (const r of data.dailyRates ?? []) {
    await database.runAsync(
      `INSERT INTO daily_rates (date, p2p_rate, bcv_usd_rate, bcv_eur_rate)
       VALUES (?, ?, ?, ?)`,
      [r.date, r.p2pRate, r.bcvUsdRate, r.bcvEurRate],
    );
  }

  // Insert settings
  for (const s of data.settings) {
    await database.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [s.key, s.value],
    );
  }
}
