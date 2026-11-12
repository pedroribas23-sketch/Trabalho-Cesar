/* Verifica que front/kennedito.html (arquivo único) está atualizado
   em relação aos fontes de front/. Roda: node check-single.js */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FRONT = __dirname;
const target = path.join(FRONT, 'kennedito.html');

if (!fs.existsSync(target)) {
  console.error('kennedito.html nao existe. Rode: node build-single.js');
  process.exit(1);
}

const before = fs.readFileSync(target);
execFileSync(process.execPath, [path.join(FRONT, 'build-single.js')], { cwd: FRONT });
const after = fs.readFileSync(target);

if (before.equals(after)) {
  console.log('kennedito.html esta atualizado.');
} else {
  console.log('kennedito.html foi regerado (estava desatualizado).');
}
