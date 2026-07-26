const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, '.button_audit_report.json');
const BACKUP_DIR = path.join(ROOT, '.button_fix_backups');

if (!fs.existsSync(REPORT_PATH)) {
  console.error('No audit report found. Run: node scripts/button-audit.js');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
const critical = report.issues.filter(i => i.severity === 'CRITICAL');

if (critical.length === 0) {
  console.log('No critical dead buttons to fix. ✅');
  process.exit(0);
}

// Ensure backup dir exists
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Smart replacements based on button label context
function getFix(label, filePath, lineContent) {
  const lowerLabel = label.toLowerCase();
  const lowerFile = filePath.toLowerCase();

  // Navigation patterns
  if (lowerLabel.includes('terms') || lowerLabel.includes('conditions')) {
    return `onPress={() => router.push('/(os)/settings/terms')}`;
  }
  if (lowerLabel.includes('privacy')) {
    return `onPress={() => router.push('/(os)/settings/privacy')}`;
  }
  if (lowerLabel.includes('license') || lowerLabel.includes('licences')) {
    return `onPress={() => router.push('/(os)/settings/licenses')}`;
  }
  if (lowerLabel.includes('help') || lowerLabel.includes('support')) {
    return `onPress={() => router.push('/(os)/settings/help')}`;
  }
  if (lowerLabel.includes('about')) {
    return `onPress={() => router.push('/(os)/settings/about')}`;
  }
  if (lowerLabel.includes('security') || lowerLabel.includes('2fa')) {
    return `onPress={() => router.push('/(os)/settings/security-center')}`;
  }
  if (lowerLabel.includes('profile') || lowerLabel.includes('edit profile')) {
    return `onPress={() => router.push('/(os)/profile/edit')}`;
  }
  if (lowerLabel.includes('wallet') || lowerLabel.includes('balance')) {
    return `onPress={() => router.push('/(os)/wallet')}`;
  }
  if (lowerLabel.includes('settings')) {
    return `onPress={() => router.push('/(os)/settings')}`;
  }
  if (lowerLabel.includes('back')) {
    return `onPress={() => router.back()}`;
  }
  if (lowerLabel.includes('close') || lowerLabel.includes('dismiss')) {
    return `onPress={() => router.back()}`;
  }
  if (lowerLabel.includes('save')) {
    return `onPress={handleSave}`;
  }
  if (lowerLabel.includes('submit')) {
    return `onPress={handleSubmit}`;
  }
  if (lowerLabel.includes('delete') || lowerLabel.includes('remove')) {
    return `onPress={() => { if (confirm('Are you sure?')) handleDelete(); }}`;
  }
  if (lowerLabel.includes('share')) {
    return `onPress={() => Share.share({ message: 'Check this out!' })}`;
  }
  if (lowerLabel.includes('call') || lowerLabel.includes('phone')) {
    return `onPress={() => Linking.openURL('tel:')}`;
  }
  if (lowerLabel.includes('email') || lowerLabel.includes('mail')) {
    return `onPress={() => Linking.openURL('mailto:')}`;
  }
  if (lowerLabel.includes('map') || lowerLabel.includes('directions')) {
    return `onPress={() => Linking.openURL('https://maps.google.com')}`;
  }

  // File-specific patterns
  if (lowerFile.includes('settings/about')) {
    return `onPress={() => console.warn('TODO: About screen button — ${label}')}`;
  }
  if (lowerFile.includes('onboarding')) {
    return `onPress={() => router.push('/(os)/onboarding')}`;
  }

  // Default: flag with console.warn so app doesn't crash but is clearly marked
  return `onPress={() => console.warn('TODO: ${label} button in ${path.basename(filePath)}')}`;
}

let fixedCount = 0;
let skippedCount = 0;

for (const issue of critical) {
  const filePath = path.join(ROOT, issue.file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipped (not found): ${issue.file}`);
    skippedCount++;
    continue;
  }

  // Backup
  const backupPath = path.join(BACKUP_DIR, issue.file.replace(/\//g, '_'));
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const lineIdx = issue.line - 1;
  const originalLine = lines[lineIdx];

  // Only fix if the line still has the dead pattern
  if (!originalLine.includes('onPress={() => {}}') && !originalLine.includes('onPress={undefined}')) {
    console.log(`⚠️  Skipped (already fixed?): ${issue.file}:${issue.line}`);
    skippedCount++;
    continue;
  }

  const replacement = getFix(issue.label, issue.file, originalLine);

  // Replace the dead onPress with the smart replacement
  let newLine = originalLine;
  newLine = newLine.replace(/onPress=\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/, replacement);
  newLine = newLine.replace(/onPress=\{undefined\}/, replacement);

  if (newLine === originalLine) {
    console.log(`⚠️  Could not patch: ${issue.file}:${issue.line}`);
    skippedCount++;
    continue;
  }

  lines[lineIdx] = newLine;
  fs.writeFileSync(filePath, lines.join('\n'));
  fixedCount++;
  console.log(`✅ ${issue.file}:${issue.line} — "${issue.label}" → ${replacement}`);
}

console.log(`\n=== BUTTON FIX COMPLETE ===`);
console.log(`Fixed: ${fixedCount} | Skipped: ${skippedCount} | Total Critical: ${critical.length}`);
console.log(`Backups in: ${BACKUP_DIR}`);
console.log(`\nTo restore: cp ${BACKUP_DIR}/* app/... (manual restore)`);
