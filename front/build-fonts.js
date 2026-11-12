/* Gera o bloco @font-face com a Silkscreen embutida em base64.
   Uso: node build-fonts.js
   Escreve front/css/fonts.css (importado por style.css) */
const fs = require('fs');
const path = require('path');

const fonts = JSON.parse(fs.readFileSync('C:\\Users\\Pedrao\\AppData\\Local\\Temp\\opencode\\font-test\\fonts.json', 'utf8'));
const OUT = path.join(__dirname, 'css', 'fonts.css');

let css = `/* =========================================================
   KENNEDITO — fontes pixeladas embutidas
   Silkscreen (SIL Open Font License 1.1) em base64: o jogo
   continua 100%% offline, sem nenhuma requisicao externa.
   Gerado por front/build-fonts.js
   ========================================================= */

`;

const order = ['400-latin', '400-ext', '700-latin', '700-ext'];
const byKey = {};
fonts.forEach((f) => { byKey[f.key] = f; });

for (const key of order) {
  const f = byKey[key];
  if (!f) continue;
  css += `@font-face {
  font-family: 'Silkscreen';
  font-style: normal;
  font-weight: ${f.weight};
  font-display: block;
  src: url(data:font/woff2;base64,${f.b64}) format('woff2');
  unicode-range: ${f.range};
}

`;
}

fs.writeFileSync(OUT, css, 'utf8');
console.log('gerado: ' + OUT + ' (' + (css.length / 1024).toFixed(1) + ' KB)');
