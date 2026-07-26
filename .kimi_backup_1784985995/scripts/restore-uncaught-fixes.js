const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BACKUP_DIR = path.join(ROOT, '.uncaught_fix_backups_v2');

if (!fs.existsSync(BACKUP_DIR)) {
  console.error('No backup found');
  process.exit(1);
}

let restored = 0;
for (const file of fs.readdirSync(BACKUP_DIR)) {
  const backupPath = path.join(BACKUP_DIR, file);
  const targetPath = path.join(ROOT, file.replace(/_/g, '/'));
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, targetPath);
    restored++;
    console.log(`✅ RESTORED: ${targetPath}`);
  }
}
console.log(`\nRestored: ${restored} files`);
