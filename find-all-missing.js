const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const PROJECT_ROOT = path.resolve(__dirname);
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

function resolveImport(importPath, fromFile) {
  if (importPath.startsWith('@/')) {
    const relativePath = importPath.slice(2);
    const basePath = path.join(PROJECT_ROOT, relativePath);
    for (const ext of extensions) {
      if (fs.existsSync(basePath + ext)) return basePath + ext;
    }
    for (const ext of extensions) {
      if (fs.existsSync(path.join(basePath, 'index' + ext))) return path.join(basePath, 'index' + ext);
    }
    return null;
  }
  if (importPath.startsWith('.')) {
    const fromDir = path.dirname(fromFile);
    const basePath = path.resolve(fromDir, importPath);
    for (const ext of extensions) {
      if (fs.existsSync(basePath + ext)) return basePath + ext;
    }
    for (const ext of extensions) {
      if (fs.existsSync(path.join(basePath, 'index' + ext))) return path.join(basePath, 'index' + ext);
    }
    return null;
  }
  return 'node_module';
}

function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = [];
  const regex = /import\s+(?:{[^}]+}|[^'"]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    imports.push({ line: content.substring(0, match.index).split('\n').length, path: match[1] });
  }
  const regex2 = /import\s+['"]([^'"]+)['"]/g;
  while ((match = regex2.exec(content)) !== null) {
    imports.push({ line: content.substring(0, match.index).split('\n').length, path: match[1] });
  }
  return imports;
}

const missing = [];
const files = globSync('app/**/*.{ts,tsx}', { cwd: PROJECT_ROOT });

for (const file of files) {
  const filePath = path.join(PROJECT_ROOT, file);
  const imports = extractImports(filePath);
  for (const imp of imports) {
    const resolved = resolveImport(imp.path, filePath);
    if (resolved === null) {
      missing.push({ file: file, line: imp.line, import: imp.path });
    }
  }
}

const grouped = {};
for (const item of missing) {
  if (!grouped[item.import]) grouped[item.import] = [];
  grouped[item.import].push(`${item.file}:${item.line}`);
}

console.log('=== MISSING IMPORTS ===\n');
for (const [imp, files] of Object.entries(grouped)) {
  console.log(`MISSING: ${imp}`);
  for (const f of files) {
    console.log(`  imported by: ${f}`);
  }
  console.log('');
}

console.log(`\nTotal missing imports: ${missing.length}`);
console.log(`Unique missing modules: ${Object.keys(grouped).length}`);
fs.writeFileSync('missing-imports.json', JSON.stringify(grouped, null, 2));
console.log('\nSaved to missing-imports.json');
