const fs = require('fs');
const path = require('path');

// Read package.json
const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Only keep packages needed at runtime in main process
const runtimeDeps = {
  'better-sqlite3': pkg.dependencies['better-sqlite3'],
  'electron-store': pkg.dependencies['electron-store'],
  'electron-updater': pkg.dependencies['electron-updater'],
  'electron-localshortcut': pkg.dependencies['electron-localshortcut']
};

// Create backup
const backupPath = path.join(__dirname, '..', 'package.json.backup');
fs.writeFileSync(backupPath, JSON.stringify(pkg, null, 2));

// Update package.json
pkg.dependencies = runtimeDeps;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

console.log('✓ Optimized package.json for build');
console.log('  Runtime dependencies:', Object.keys(runtimeDeps).join(', '));
console.log('  Backup saved to: package.json.backup');
