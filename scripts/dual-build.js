const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const srcFile = path.join(distDir, 'index.html');
const prodFile = path.join(distDir, 'index.prod.html');

if (!fs.existsSync(srcFile)) {
  console.error('dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

const html = fs.readFileSync(srcFile, 'utf-8');

const prodHtml = html.replace('<title>Real Smart</title>', '<title>Real Smart • 正式环境</title>');

fs.writeFileSync(prodFile, prodHtml, 'utf-8');
console.log('Generated:', prodFile);
