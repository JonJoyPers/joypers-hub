// Tiny ad-hoc YAML linter for the .maestro flows.
// Run with: node .maestro/_validate.mjs
// (Maestro itself does the real validation when it executes flows; this
// just catches syntax mistakes before you bother booting a simulator.)
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

let yaml;
try {
  // js-yaml is CJS — its dynamic-import shape is { default: { load, loadAll } }
  const mod = await import('js-yaml');
  yaml = mod.default || mod;
} catch {
  console.log('js-yaml not installed — skipping validation. (npm i -D js-yaml to enable)');
  process.exit(0);
}

const root = new URL('.', import.meta.url).pathname;
const dirs = ['flows', 'subflows'];
let failed = 0;

for (const dir of dirs) {
  const full = join(root, dir);
  for (const name of readdirSync(full)) {
    if (!name.endsWith('.yaml')) continue;
    const path = join(full, name);
    try {
      const raw = readFileSync(path, 'utf8');
      const docs = yaml.loadAll(raw);
      console.log(`✓ ${dir}/${name} — ${docs.length} doc${docs.length > 1 ? 's' : ''}`);
    } catch (e) {
      console.log(`✗ ${dir}/${name} — ${e.message}`);
      failed++;
    }
  }
}

try {
  const raw = readFileSync(join(root, 'config.yaml'), 'utf8');
  yaml.load(raw);
  console.log('✓ config.yaml');
} catch (e) {
  console.log(`✗ config.yaml — ${e.message}`);
  failed++;
}

if (failed) {
  console.error(`\n${failed} file(s) failed YAML parse.`);
  process.exit(1);
}
console.log('\nAll Maestro flows parse cleanly.');
