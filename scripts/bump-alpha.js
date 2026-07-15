/**
 * Script para actualizar sufijos de alpha hex a valores más altos
 * en toda la app.
 *
 * Mapeo: UNA SOLA PASADA — cada valor original → su destino final.
 *   0D (5%)  → 1A (10%)   — divisores
 *   0A (4%)  → 14 (8%)    — gradient mínimo
 *   12 (7%)  → 33 (20%)   — error bg
 *   14 (8%)  → 33 (20%)   — icon bg suave
 *   1A (10%) → 33 (20%)   — fondo tint, icon bg
 *   1F (12%) → 4D (30%)   — danger bg
 *   26 (15%) → 4D (30%)   — glow decoración
 *   33 (20%) → 4D (30%)   — icon bg, border
 *   4D (30%) → 66 (40%)   — border
 *   66 (40%) → 99 (60%)   — chevron, border high
 *   B3 (70%) → CC (80%)   — section header
 *   CC (80%) → D9 (85%)   — texto strong
 *
 * Cada valor original mapea DIRECTAMENTE a su destino.
 * NO hay encadenamiento (33 → 4D → 66 → 99).
 *
 * Solo reemplaza patrones que coincidan con `${colors.XXXXX}SUFIJO`
 * para no afectar otros usos de estos hex.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src');

const ALPHA_MAP = {
  '0D': '1A',
  '0A': '14',
  '12': '33',
  '14': '33',
  '1A': '33',
  '1F': '4D',
  '26': '4D',
  '33': '4D',
  '4D': '66',
  '66': '99',
  'B3': 'CC',
  'CC': 'D9',
};

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      files.push(...walk(full));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const regex = /(\$\{colors\.\w+\})([0-9A-Fa-f]{2})/g;

  let modified = false;
  const result = content.replace(regex, (match, prefix, suffix) => {
    const upperSuffix = suffix.toUpperCase();
    const target = ALPHA_MAP[upperSuffix];
    if (target) {
      modified = true;
      // Preserve original casing — lowercase stays lowercase
      const finalSuffix = suffix === suffix.toLowerCase() ? target.toLowerCase() : target.toUpperCase();
      return `${prefix}${finalSuffix}`;
    }
    return match;
  });

  if (modified) {
    console.log(`  updated ${path.relative(SRC, filePath)}`);
    fs.writeFileSync(filePath, result, 'utf-8');
  }
}

console.log('Scanning source files...');
const files = walk(SRC);
console.log(`Found ${files.length} source files.`);
let updatedCount = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf-8');
  const regex = /(\$\{colors\.\w+\})([0-9A-Fa-f]{2})/g;
  if (regex.test(before)) {
    replaceInFile(file);
    updatedCount++;
  }
}
console.log(`Updated ${updatedCount} files.`);
