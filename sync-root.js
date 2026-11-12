/* Sincroniza o front (front/) para a raiz do repositorio, para que o
   GitHub Pages sirva o jogo direto em /  sem configuracao extra.
   Uso: node sync-root.js
   A pasta front/ continua sendo a fonte da verdade. */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const FRONT = path.join(ROOT, 'front');
const JS_ORDER = [
  'js/util.js', 'js/audio.js', 'js/input.js', 'js/config.js', 'js/api.js',
  'js/art.js', 'js/world_art.js', 'js/entities.js', 'js/bosses.js',
  'js/levels.js', 'js/ui.js', 'js/game.js'
];

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

function buildSingle() {
  const read = (p) => fs.readFileSync(path.join(FRONT, p), 'utf8');
  let html = read('index.html');
  html = html.replace(/<link rel="stylesheet" href="css\/style\.css">/g, '<style>\n' + read('css/style.css') + '\n</style>');
  html = html.replace(/<script src="js\/[a-z_]+\.js"><\/script>/g, '');
  const bundle = JS_ORDER.map((f) => '/* ===== ' + f + ' ===== */\n' + read(f)).join('\n');
  html = html.replace('</body>', '<script>\n' + bundle + '\n</script>\n</body>');
  fs.writeFileSync(path.join(ROOT, 'kennedito.html'), html, 'utf8');
  return html.length;
}

// front/ -> raiz
copyDir(path.join(FRONT, 'css'), path.join(ROOT, 'css'));
copyDir(path.join(FRONT, 'js'), path.join(ROOT, 'js'));
fs.copyFileSync(path.join(FRONT, 'index.html'), path.join(ROOT, 'index.html'));

const size = buildSingle();
console.log('raiz sincronizada: index.html, css/, js/, kennedito.html (' + Math.round(size / 1024) + ' KB)');
