const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const distDir = path.join(__dirname, '..', 'dist');
const deployDir = path.join(__dirname, '..', 'deploy', 'frontend');
const env = process.env.DEPLOY_ENV || 'prod';
const apiBase = process.env.DEPLOY_API_BASE;

const srcFile = env === 'test' ? 'index.test.html' : 'index.prod.html';
let inputPath = path.join(distDir, srcFile);
if (!fs.existsSync(inputPath)) inputPath = path.join(distDir, 'index.html');
if (!fs.existsSync(inputPath)) {
  console.error('dist not found. Run "npm run build" first.');
  process.exit(1);
}

let html = fs.readFileSync(inputPath, 'utf-8');
if (apiBase) {
  html = html.replace(/window\.__API_BASE__\s*=\s*[^;]+;/, `window.__API_BASE__ = '${apiBase}';`);
}

fs.mkdirSync(deployDir, { recursive: true });
const ts = new Date().toISOString().replace(/[-:TZ\.]/g, '').slice(0, 14);
const outName = `frontend_${env}_${ts}.html`;
const outPath = path.join(deployDir, outName);
fs.writeFileSync(outPath, html, 'utf-8');
fs.writeFileSync(path.join(deployDir, 'index.html'), html, 'utf-8');
console.log('Artifact:', outPath);

if (process.env.DEPLOY_UPLOAD_URL) {
  try {
    const cmd = `curl -s -X POST -F file=@${outPath} ${process.env.DEPLOY_UPLOAD_URL}`;
    const output = cp.execSync(cmd, { stdio: 'pipe' }).toString();
    console.log('Upload response:', output);
  } catch (e) {
    console.error('Upload failed');
  }
}

