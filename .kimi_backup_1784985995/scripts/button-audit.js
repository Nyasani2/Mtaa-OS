const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'lib'];
const EXTS = ['.tsx', '.ts'];

// Patterns that indicate a dead button
const DEAD_PATTERNS = [
  { regex: /onPress=\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/g, severity: 'CRITICAL', desc: 'Empty arrow function' },
  { regex: /onPress=\{undefined\}/g, severity: 'CRITICAL', desc: 'Undefined handler' },
  { regex: /onPress=\{\s*\(\s*\)\s*=>\s*\{\s*\/\/\s*TODO[^}]*\}\s*\}/gi, severity: 'WARNING', desc: 'TODO placeholder' },
  { regex: /onPress=\{\s*\(\s*\)\s*=>\s*\{\s*console\.log\s*\([^)]*\)\s*;?\s*\}\s*\}/gi, severity: 'WARNING', desc: 'Console.log only' },
  { regex: /onPress=\{\s*\(\s*\)\s*=>\s*\{\s*console\.warn\s*\(\s*['"`]TODO[^'"`]*['"`]\s*\)\s*;?\s*\}\s*\}/gi, severity: 'INFO', desc: 'Already flagged TODO' },
  { regex: /onPress=\{\s*\(\s*\)\s*=>\s*\{\s*\/\*\s*TODO[^*]*\*\/\s*\}\s*\}/gi, severity: 'WARNING', desc: 'Block TODO comment' },
];

const BUTTON_COMPONENTS = ['TouchableOpacity', 'Pressable', 'TouchableHighlight', 'TouchableWithoutFeedback', 'Button'];

function findFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findFiles(full, files);
    } else if (stat.isFile() && EXTS.some(e => full.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

function extractContext(lines, lineIdx) {
  const start = Math.max(0, lineIdx - 2);
  const end = Math.min(lines.length, lineIdx + 3);
  return lines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join('\n');
}

function extractButtonLabel(lines, lineIdx) {
  // Look backwards and forwards for <Text>...</Text>
  const window = lines.slice(Math.max(0, lineIdx - 5), Math.min(lines.length, lineIdx + 5)).join(' ');
  const textMatch = window.match(/<Text[^>]*>([^<]+)<\/Text>/);
  if (textMatch) return textMatch[1].trim();
  // Look for title prop
  const titleMatch = window.match(/title=\{?["']([^"']+)["']\}?/);
  if (titleMatch) return titleMatch[1].trim();
  return 'Unknown';
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Only check lines that contain button components or onPress
    const hasButton = BUTTON_COMPONENTS.some(bc => line.includes(`<${bc}`) || line.includes(`</${bc}`));
    const hasOnPress = line.includes('onPress');
    if (!hasButton && !hasOnPress) continue;

    for (const pattern of DEAD_PATTERNS) {
      const matches = [...line.matchAll(pattern.regex)];
      for (const match of matches) {
        const label = extractButtonLabel(lines, i);
        issues.push({
          file: filePath.replace(ROOT + '/', ''),
          line: i + 1,
          column: match.index + 1,
          severity: pattern.severity,
          pattern: pattern.desc,
          label,
          code: line.trim(),
          context: extractContext(lines, i),
        });
      }
    }
  }
  return issues;
}

// Main
console.log('=== MTAA OS V10 BUTTON AUDIT ===\n');
const allFiles = [];
for (const d of SCAN_DIRS) {
  allFiles.push(...findFiles(path.join(ROOT, d)));
}

console.log(`Scanning ${allFiles.length} files...\n`);

const allIssues = [];
for (const file of allFiles) {
  const issues = auditFile(file);
  allIssues.push(...issues);
}

// Group by severity
const critical = allIssues.filter(i => i.severity === 'CRITICAL');
const warning = allIssues.filter(i => i.severity === 'WARNING');
const info = allIssues.filter(i => i.severity === 'INFO');

// Group by file
const byFile = {};
for (const issue of allIssues) {
  if (!byFile[issue.file]) byFile[issue.file] = [];
  byFile[issue.file].push(issue);
}

// Print summary
console.log(`CRITICAL: ${critical.length} | WARNING: ${warning.length} | INFO: ${info.length} | TOTAL: ${allIssues.length}\n`);

// Print critical first
if (critical.length > 0) {
  console.log('\n🚨 CRITICAL (completely dead buttons):');
  console.log('='.repeat(60));
  for (const issue of critical) {
    console.log(`\n${issue.file}:${issue.line}`);
    console.log(`  Label: "${issue.label}"`);
    console.log(`  Pattern: ${issue.pattern}`);
    console.log(`  Code: ${issue.code}`);
  }
}

if (warning.length > 0) {
  console.log('\n⚠️  WARNING (weak implementations):');
  console.log('='.repeat(60));
  for (const issue of warning) {
    console.log(`\n${issue.file}:${issue.line} — "${issue.label}" (${issue.pattern})`);
  }
}

// Save JSON report
const reportPath = path.join(ROOT, '.button_audit_report.json');
fs.writeFileSync(reportPath, JSON.stringify({
  scanned: allFiles.length,
  totalIssues: allIssues.length,
  critical: critical.length,
  warning: warning.length,
  info: info.length,
  byFile,
  issues: allIssues,
}, null, 2));

console.log(`\n✅ Report saved to: ${reportPath}`);
console.log(`\nRun: node scripts/button-fix.js   (to auto-fix critical issues)`);
