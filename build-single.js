/* Gera um único arquivo HTML autocontido com todo o front do Kennedito.
   Uso: node build-single.js
   Saída: front/kennedito.html  (abre com duplo clique, sem servidor) */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'front');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const JS_ORDER = [
  'js/util.js',
  'js/audio.js',
  'js/input.js',
  'js/config.js',
  'js/api.js',
  'js/art.js',
  'js/world_art.js',
  'js/entities.js',
  'js/bosses.js',
  'js/levels.js',
  'js/ui.js',
  'js/game.js'
];

let html = read('index.html');
const css = read('css/style.css');

// remove o link do css
html = html.replace(/<link rel="stylesheet" href="css\/style\.css">/g, '<style>\n' + css + '\n</style>');

// remove os scripts externos e injeta o bundle
html = html.replace(/<script src="js\/[a-z_]+\.js"><\/script>/g, '');
const bundle = JS_ORDER.map((f) => '/* ===== ' + f + ' ===== */\n' + read(f)).join('\n');
html = html.replace('</body>', '<script>\n' + bundle + '\n</script>\n</body>');

// o bundle inline nao deve mais ter o strict de arquivo conflitando
const out = path.join(ROOT, 'kennedito.html');
fs.writeFileSync(out, html, 'utf8');
console.log('gerado: ' + out + ' (' + Math.round(html.length / 1024) + ' KB)');
