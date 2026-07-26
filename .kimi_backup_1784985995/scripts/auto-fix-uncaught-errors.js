const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, '.uncaught_errors_audit.json');
const BACKUP_DIR = path.join(ROOT, '.uncaught_fix_backups_v2');

if (!fs.existsSync(REPORT_PATH)) {
  console.error('No audit report found at .uncaught_errors_audit.json');
  console.error('Run: node scripts/uncaught-errors-audit.js');
  process.exit(1);
}

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

let fixed = 0;
let skipped = 0;
let errors = 0;

function backup(filePath) {
  const rel = filePath.replace(ROOT + '/', '').replace(/\//g, '_');
  const backupPath = path.join(BACKUP_DIR, rel);
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
}

function isBalanced(content) {
  let depth = 0;
  for (const char of content) {
    if (char === '{') depth++;
    if (char === '}') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function findFunctions(lines) {
  const funcs = [];
  const patterns = [
    /^\s*(export\s+(default\s+)?)?async\s+function\s+\w+/,
    /^\s*(export\s+)?function\s+\w+/,
    /^\s*const\s+\w+\s*=\s*async\s*\(/,
    /^\s*const\s+\w+\s*=\s*\(/,
    /^\s*\w+\s*:\s*async\s*\(/,
    /^\s*\w+\s*:\s*\(/,
    /^\s*\w+\s*=\s*async\s*\(/,
  ];

  for (let i = 0; i < lines.length; i++) {
    if (!patterns.some(p => p.test(lines[i]))) continue;

    let braceLine = i;
    let braceCol = lines[i].indexOf('{');
    if (braceCol === -1) {
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        const col = lines[j].indexOf('{');
        if (col !== -1) { braceLine = j; braceCol = col; break; }
      }
    }
    if (braceCol === -1) continue;

    let depth = 0;
    let endLine = -1;
    let endCol = -1;
    for (let j = braceLine; j < lines.length; j++) {
      const line = lines[j];
      for (let k = (j === braceLine ? braceCol : 0); k < line.length; k++) {
        if (line[k] === '{') depth++;
        if (line[k] === '}') {
          depth--;
          if (depth === 0) { endLine = j; endCol = k; break; }
        }
      }
      if (endCol !== -1) break;
    }
    if (endCol === -1) continue;

    funcs.push({
      startLine: i,
      bodyStartLine: braceLine,
      bodyStartCol: braceCol,
      bodyEndLine: endLine,
      bodyEndCol: endCol,
      needsNullGuard: false,
      needsTryCatch: false,
      hasNullGuard: false,
      hasTryCatch: false,
    });
  }
  return funcs;
}

console.log('=== MTAA OS V10 UNCAUGHT ERRORS AUTO-FIX ===');
console.log(DRY_RUN ? 'DRY RUN MODE — no files will be modified\n' : 'LIVE MODE — files will be modified\n');

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));

for (const fileData of report.issues) {
  const filePath = path.join(ROOT, fileData.file);
  if (!fs.existsSync(filePath)) {
    skipped++;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const funcs = findFunctions(lines);

  if (funcs.length === 0) {
    skipped++;
    continue;
  }

  // Mark which functions need which fixes
  for (const issue of fileData.issues) {
    if (issue.severity !== 'HIGH') continue;
    const func = funcs.find(f => f.startLine <= issue.line - 1 && f.bodyEndLine >= issue.line - 1);
    if (!func) continue;

    if (issue.category === 'NULL_DEREFERENCE') func.needsNullGuard = true;
    if (issue.category === 'UNHANDLED_SUPABASE') func.needsTryCatch = true;
    if (issue.category === 'UNHANDLED_ASYNC') func.needsTryCatch = true;
  }

  // Check existing guards/try-catch in each function
  for (const func of funcs) {
    for (let i = func.startLine; i <= func.bodyEndLine; i++) {
      if (/if\s*\(\s*!\s*user\s*\)/.test(lines[i]) || /user\s*\?/.test(lines[i]) ||
          /if\s*\(\s*!\s*session\s*\)/.test(lines[i]) || /session\s*\?/.test(lines[i]) ||
          /if\s*\(\s*user\s*\)/.test(lines[i]) || /if\s*\(\s*session\s*\)/.test(lines[i])) {
        func.hasNullGuard = true;
      }
      if (/try\s*\{/.test(lines[i])) {
        func.hasTryCatch = true;
      }
    }
  }

  // Apply fixes in reverse order to preserve line numbers
  let modified = false;
  for (let fi = funcs.length - 1; fi >= 0; fi--) {
    const func = funcs[fi];

    // Fix 1: Add null guard
    if (func.needsNullGuard && !func.hasNullGuard) {
      const indent = lines[func.bodyStartLine].substring(0, func.bodyStartCol + 1).replace(/[^\s]/g, '') + '  ';
      lines.splice(func.bodyStartLine + 1, 0, indent + "if (!user) return null;");
      modified = true;
      for (let j = fi + 1; j < funcs.length; j++) {
        funcs[j].startLine++;
        funcs[j].bodyStartLine++;
        funcs[j].bodyEndLine++;
      }
      func.bodyEndLine++;
    }

    // Fix 2: Wrap in try/catch
    if (func.needsTryCatch && !func.hasTryCatch) {
      const baseIndent = lines[func.bodyStartLine].substring(0, func.bodyStartCol + 1).replace(/[^\s]/g, '');
      const innerIndent = baseIndent + '  ';

      // Increase indentation of existing body lines
      for (let i = func.bodyStartLine + 1; i < func.bodyEndLine; i++) {
        if (lines[i].trim().length > 0) {
          lines[i] = '  ' + lines[i];
        }
      }

      // Insert try { after opening brace
      lines.splice(func.bodyStartLine + 1, 0, innerIndent + 'try {');

      // Insert catch before closing brace
      lines.splice(func.bodyEndLine + 1, 0, innerIndent + '} catch (err) { console.error(err); }');

      modified = true;
      for (let j = fi + 1; j < funcs.length; j++) {
        funcs[j].startLine += 2;
        funcs[j].bodyStartLine += 2;
        funcs[j].bodyEndLine += 2;
      }
      func.bodyEndLine += 2;
    }
  }

  if (modified) {
    const newContent = lines.join('\n');
    if (!isBalanced(newContent)) {
      console.log(`❌ UNBALANCED: ${fileData.file} — skipped`);
      errors++;
      continue;
    }

    if (!DRY_RUN) {
      backup(filePath);
      fs.writeFileSync(filePath, newContent);
    }
    console.log(`${DRY_RUN ? '[DRY]' : '✅'} FIXED: ${fileData.file}`);
    fixed++;
  } else {
    skipped++;
  }
}

console.log(`\n=== DONE ===`);
console.log(`Fixed: ${fixed} | Skipped: ${skipped} | Errors: ${errors}`);
console.log(`Backups in: ${BACKUP_DIR}`);
if (!DRY_RUN) {
  console.log(`\nTo restore: node scripts/restore-uncaught-fixes.js`);
}
