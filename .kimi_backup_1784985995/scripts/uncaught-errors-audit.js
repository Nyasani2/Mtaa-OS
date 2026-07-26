const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const EXTS = ['.tsx', '.ts'];

function findFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'backups') {
      findFiles(full, files);
    } else if (stat.isFile() && EXTS.some(e => full.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

function getLine(content, index) {
  return content.substring(0, index).split('\n').length;
}

function auditFile(filePath, content) {
  const issues = [];
  const lines = content.split('\n');

  // 1. Supabase calls NOT inside try/catch
  const supabasePattern = /await\s+supabase\.from\([^)]+\)\.[^;]+;/g;
  let match;
  while ((match = supabasePattern.exec(content)) !== null) {
    const before = content.substring(0, match.index);
    const after = content.substring(match.index);
    const lastTry = before.lastIndexOf('try {');
    const lastCatch = before.lastIndexOf('catch');
    const nextCatch = after.indexOf('catch');
    const isInTry = lastTry > lastCatch && nextCatch > -1 && nextCatch < 500;
    if (!isInTry) {
      issues.push({
        line: getLine(content, match.index),
        severity: 'HIGH',
        category: 'UNHANDLED_SUPABASE',
        message: 'Supabase call not wrapped in try/catch',
        code: match[0].substring(0, 80),
      });
    }
  }

  // 2. Async functions without try/catch
  const asyncFuncPattern = /async\s+function\s+\w+|const\s+\w+\s*=\s*async\s*\(|\w+\s*:\s*async\s*\(/g;
  while ((match = asyncFuncPattern.exec(content)) !== null) {
    const funcStart = match.index;
    let braceIdx = content.indexOf('{', funcStart);
    if (braceIdx === -1) continue;
    let depth = 0;
    let funcEnd = braceIdx;
    for (let i = braceIdx; i < content.length; i++) {
      if (content[i] === '{') depth++;
      if (content[i] === '}') { depth--; if (depth === 0) { funcEnd = i; break; } }
    }
    const body = content.substring(braceIdx, funcEnd);
    if (!body.includes('try {') && !body.includes('catch') && body.includes('await')) {
      issues.push({
        line: getLine(content, funcStart),
        severity: 'MEDIUM',
        category: 'UNHANDLED_ASYNC',
        message: 'Async function has await but no try/catch',
        code: match[0].substring(0, 60),
      });
    }
  }

  // 3. user/session used without null check
  const userAccessPattern = /user\.id|user\.email|session\.access_token|session\.user/g;
  while ((match = userAccessPattern.exec(content)) !== null) {
    const lineIdx = getLine(content, match.index);
    const nearby = lines.slice(Math.max(0, lineIdx - 3), lineIdx).join(' ');
    if (!nearby.includes('!user') && !nearby.includes('user &&') && !nearby.includes('user?.') &&
        !nearby.includes('!session') && !nearby.includes('session &&') && !nearby.includes('session?.')) {
      issues.push({
        line: lineIdx,
        severity: 'HIGH',
        category: 'NULL_DEREFERENCE',
        message: `Possible null dereference: ${match[0]}`,
        code: lines[lineIdx - 1]?.trim().substring(0, 80) || match[0],
      });
    }
  }

  // 4. console.log used for errors
  const consoleErrorPattern = /console\.(log|warn|error)\s*\(\s*['"`].*?(error|fail|crash|broken|bug)/gi;
  while ((match = consoleErrorPattern.exec(content)) !== null) {
    issues.push({
      line: getLine(content, match.index),
      severity: 'LOW',
      category: 'SILENT_ERROR',
      message: 'Error logged to console instead of being shown to user',
      code: match[0].substring(0, 80),
    });
  }

  // 5. useEffect without cleanup
  const useEffectPattern = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{/g;
  while ((match = useEffectPattern.exec(content)) !== null) {
    const effectStart = match.index;
    let braceIdx = content.indexOf('{', effectStart);
    if (braceIdx === -1) continue;
    let depth = 0;
    let effectEnd = braceIdx;
    for (let i = braceIdx; i < Math.min(content.length, braceIdx + 2000); i++) {
      if (content[i] === '{') depth++;
      if (content[i] === '}') { depth--; if (depth === 0) { effectEnd = i; break; } }
    }
    const effectBody = content.substring(braceIdx, effectEnd);
    const hasSubscription = /\.subscribe|addEventListener|setInterval|setTimeout/.test(effectBody);
    const hasCleanup = /return\s*\(\s*\)\s*=>|return\s*function/.test(effectBody);
    if (hasSubscription && !hasCleanup) {
      issues.push({
        line: getLine(content, effectStart),
        severity: 'MEDIUM',
        category: 'MEMORY_LEAK',
        message: 'useEffect subscribes to something but has no cleanup function',
        code: lines[getLine(content, effectStart) - 1]?.trim().substring(0, 80) || 'useEffect',
      });
    }
  }

  // 6. Direct state mutation
  const mutationPattern = /\b(set\w+|state\.)\w+\s*\.push\(|\w+\[\d+\]\s*=|Object\.assign\s*\(\s*\w+\s*,/g;
  while ((match = mutationPattern.exec(content)) !== null) {
    issues.push({
      line: getLine(content, match.index),
      severity: 'MEDIUM',
      category: 'STATE_MUTATION',
      message: 'Possible direct state mutation detected',
      code: match[0].substring(0, 80),
    });
  }

  // 7. Missing key prop in map
  const mapPattern = /\.map\s*\(\s*\(\s*\w+\s*,?\s*\w*\s*\)\s*=>\s*\(?\s*</g;
  while ((match = mapPattern.exec(content)) !== null) {
    const mapStart = match.index;
    const afterMap = content.substring(mapStart);
    const jsxStart = afterMap.indexOf('<');
    if (jsxStart === -1) continue;
    const jsxTag = afterMap.substring(jsxStart, jsxStart + 200);
    if (!jsxTag.includes('key=')) {
      issues.push({
        line: getLine(content, mapStart),
        severity: 'LOW',
        category: 'MISSING_KEY',
        message: '.map() JSX element missing key prop',
        code: match[0].substring(0, 60),
      });
    }
  }

  // 8. router.push without error handling in async context
  const routerPushPattern = /router\.push\([^)]+\)/g;
  while ((match = routerPushPattern.exec(content)) !== null) {
    const before = content.substring(0, match.index);
    const isInAsync = /async\s+function|const\s+\w+\s*=\s*async/.test(before.substring(before.length - 500));
    const isInTry = before.lastIndexOf('try {') > before.lastIndexOf('catch');
    if (isInAsync && !isInTry) {
      issues.push({
        line: getLine(content, match.index),
        severity: 'LOW',
        category: 'UNHANDLED_NAVIGATION',
        message: 'router.push() in async function without try/catch',
        code: match[0],
      });
    }
  }

  // 9. Promise without .catch() — FIXED REGEX
  const promisePattern = /\.then\s*\(/g;
  while ((match = promisePattern.exec(content)) !== null) {
    const after = content.substring(match.index);
    if (!after.substring(0, 500).includes('.catch')) {
      issues.push({
        line: getLine(content, match.index),
        severity: 'MEDIUM',
        category: 'UNCAUGHT_PROMISE',
        message: 'Promise chain has .then() but no .catch()',
        code: lines[getLine(content, match.index) - 1]?.trim().substring(0, 80) || '.then()',
      });
    }
  }

  // 10. Alert.alert in catch without error detail
  const alertPattern = /catch\s*\(\s*\w*\s*\)\s*\{[^}]*Alert\.alert\s*\(\s*['"`][^'"`]*['"`]/g;
  while ((match = alertPattern.exec(content)) !== null) {
    if (!match[0].includes('err') && !match[0].includes('error')) {
      issues.push({
        line: getLine(content, match.index),
        severity: 'LOW',
        category: 'VAGUE_ERROR',
        message: 'Catch block shows Alert without error details',
        code: match[0].substring(0, 80),
      });
    }
  }

  return issues;
}

// Main
console.log('=== MTAA OS V10 UNCAUGHT ERRORS AUDIT ===\n');

const allFiles = [];
allFiles.push(...findFiles(path.join(ROOT, 'app')));
allFiles.push(...findFiles(path.join(ROOT, 'lib')));

console.log(`Scanning ${allFiles.length} files for hidden runtime errors...\n`);

const allIssues = [];
for (const file of allFiles) {
  const relPath = file.replace(ROOT + '/', '');
  const content = fs.readFileSync(file, 'utf-8');
  const issues = auditFile(relPath, content);
  if (issues.length > 0) {
    allIssues.push({ file: relPath, issues });
  }
}

const high = [];
const medium = [];
const low = [];
for (const item of allIssues) {
  for (const issue of item.issues) {
    const entry = { file: item.file, ...issue };
    if (issue.severity === 'HIGH') high.push(entry);
    else if (issue.severity === 'MEDIUM') medium.push(entry);
    else low.push(entry);
  }
}

const byCategory = {};
for (const item of allIssues) {
  for (const issue of item.issues) {
    if (!byCategory[issue.category]) byCategory[issue.category] = 0;
    byCategory[issue.category]++;
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Files with issues: ${allIssues.length}`);
console.log(`HIGH (will crash): ${high.length}`);
console.log(`MEDIUM (bugs/leaks): ${medium.length}`);
console.log(`LOW (bad practice): ${low.length}`);
console.log(`Total issues: ${high.length + medium.length + low.length}\n`);

console.log('By category:');
for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}`);
}

if (high.length > 0) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  HIGH SEVERITY (Will Cause Runtime Crashes)');
  console.log('═══════════════════════════════════════════════════════════════');
  for (const issue of high.slice(0, 30)) {
    console.log(`\n📄 ${issue.file}:${issue.line}`);
    console.log(`   ${issue.category}: ${issue.message}`);
    console.log(`   ${issue.code}`);
  }
  if (high.length > 30) console.log(`\n... and ${high.length - 30} more HIGH severity issues`);
}

if (medium.length > 0) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  MEDIUM SEVERITY (Bugs & Memory Leaks)');
  console.log('═══════════════════════════════════════════════════════════════');
  for (const issue of medium.slice(0, 20)) {
    console.log(`\n📄 ${issue.file}:${issue.line}`);
    console.log(`   ${issue.category}: ${issue.message}`);
  }
  if (medium.length > 20) console.log(`\n... and ${medium.length - 20} more MEDIUM severity issues`);
}

const reportPath = path.join(ROOT, '.uncaught_errors_audit.json');
fs.writeFileSync(reportPath, JSON.stringify({
  scanned: allFiles.length,
  filesWithIssues: allIssues.length,
  high: high.length,
  medium: medium.length,
  low: low.length,
  byCategory,
  issues: allIssues,
}, null, 2));

console.log(`\n✅ Report saved to: ${reportPath}`);
