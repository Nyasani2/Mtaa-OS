const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.expo') && !filePath.includes('supabase') && !filePath.includes('docs') && !filePath.includes('assets')) { 
        results = results.concat(walk(filePath));
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk('.');
let broken = [];

files.forEach(f => {
  try {
    const code = fs.readFileSync(f, 'utf8');
    parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy']
    });
  } catch (e) {
    broken.push({ file: f, error: e.message });
  }
});

if (broken.length > 0) {
  console.log('❌ Found syntax errors:');
  broken.forEach(b => console.log(b.file + '\n   ' + b.error.split('\n')[0] + '\n'));
} else {
  console.log('✅ All files parsed successfully.');
}
