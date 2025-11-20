const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, '..', 'package.json.backup');
const pkgPath = path.join(__dirname, '..', 'package.json');

if (fs.existsSync(backupPath)) {
  fs.copyFileSync(backupPath, pkgPath);
  fs.unlinkSync(backupPath);
  console.log('✓ Restored package.json from backup');
} else {
  console.log('⚠ No backup found');
}
