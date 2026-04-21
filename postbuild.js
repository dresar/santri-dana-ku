import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist');
const clientDir = path.join(distDir, 'client');
const assetsDir = path.join(clientDir, 'assets');

console.log('--- Starting Post-build Static Bridge ---');

try {
  // 1. Find main JS and CSS
  const files = fs.readdirSync(assetsDir);
  const mainJs = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  const mainCss = files.find(f => f.startsWith('styles-') && f.endsWith('.css'));

  if (!mainJs) throw new Error('Main JS bundle not found');

  console.log(`Found JS bundle: ${mainJs}`);
  if (mainCss) console.log(`Found CSS bundle: ${mainCss}`);

  // 2. Generate index.html content
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>E-Budgeting Pesantren Modern Raudhatussalam Mahato</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  ${mainCss ? `<link rel="stylesheet" href="/assets/${mainCss}" />` : ''}
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/${mainJs}"></script>
</body>
</html>`;

  // 3. Flatten directory structure for Vercel
  // Copy assets to dist/assets
  const targetAssetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(targetAssetsDir)) fs.mkdirSync(targetAssetsDir);
  
  files.forEach(file => {
    fs.copyFileSync(path.join(assetsDir, file), path.join(targetAssetsDir, file));
  });

  // Write new index.html to dist root
  fs.writeFileSync(path.join(distDir, 'index.html'), html);
  
  console.log('✔ Generated dist/index.html and flattened assets');
  console.log('--- Post-build Complete ---');

} catch (err) {
  console.error('✘ Post-build failed:', err.message);
  process.exit(1);
}
