const fs = require("fs");
const path = require("path");

const roots = ["lib", "domains"];
const exts = [".ts", ".tsx", ".js", ".jsx", ".json"];

function resolveImport(importPath, fromFile) {
  if (importPath.startsWith("@/")) {
    const base = path.join(process.cwd(), importPath.slice(2));
    for (const e of exts) if (fs.existsSync(base + e)) return base + e;
    for (const e of exts) if (fs.existsSync(path.join(base, "index" + e))) return path.join(base, "index" + e);
    return null;
  }
  if (importPath.startsWith(".")) {
    const base = path.resolve(path.dirname(fromFile), importPath);
    for (const e of exts) if (fs.existsSync(base + e)) return base + e;
    for (const e of exts) if (fs.existsSync(path.join(base, "index" + e))) return path.join(base, "index" + e);
    return null;
  }
  return "node_module";
}

function extractImports(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const imports = [];
  const regex = /import\s+(?:{[^}]+}|[^'"]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

const missing = [];
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (/\.(ts|tsx|js|jsx)$/.test(entry)) files.push(full);
    }
  }
  walk(root);
  for (const file of files) {
    for (const imp of extractImports(file)) {
      if (resolveImport(imp, file) === null) {
        missing.push({ file, import: imp });
      }
    }
  }
}

const grouped = {};
for (const item of missing) {
  const key = item.import;
  if (!grouped[key]) grouped[key] = [];
  grouped[key].push(item.file);
}

console.log("=== MISSING IMPORTS IN lib/ AND domains/ ===\n");
for (const [imp, files] of Object.entries(grouped)) {
  console.log("MISSING: " + imp);
  for (const f of files) console.log("  " + f);
  console.log("");
}
console.log("Total missing: " + missing.length);
