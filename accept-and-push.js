/* Aceita convites de colaborador pendentes na conta do token e faz o push
   para pedroribas23-sketch/Trabalho-Cesar.
   Uso: node accept-and-push.js                          */
const { execFileSync } = require('child_process');

const REPO = 'pedroribas23-sketch/Trabalho-Cesar';
const OWNER = 'Pedro-Henrique-Pereira-Ribas';

function fill() {
  const input = 'protocol=https\nhost=github.com\n\n';
  const out = execFileSync('git', ['credential', 'fill'], { input, encoding: 'utf8' });
  const map = {};
  out.trim().split('\n').forEach((line) => {
    const i = line.indexOf('=');
    if (i > 0) map[line.slice(0, i)] = line.slice(i + 1);
  });
  return map;
}

(async () => {
  const cred = fill();
  const token = cred.password;
  const headers = {
    Authorization: 'Bearer ' + token,
    'User-Agent': 'kennedito-push',
    Accept: 'application/vnd.github+json'
  };

  // 1) convites pendentes da conta
  const invites = await fetch('https://api.github.com/user/repository_invitations', { headers }).then((r) => r.json());
  const mine = (Array.isArray(invites) ? invites : []).filter((i) => i.repository && i.repository.full_name === REPO);
  if (!mine.length) {
    console.log('Nenhum convite pendente para ' + REPO + '.');
    console.log('Adicione ' + OWNER + ' como colaborador em:');
    console.log('https://github.com/' + REPO + '/settings/access');
  } else {
    for (const inv of mine) {
      const res = await fetch('https://api.github.com/user/repository_invitations/' + inv.id, {
        method: 'PATCH', headers, body: JSON.stringify({ permissions: 'push' })
      });
      console.log('convite #' + inv.id + ' -> ' + (res.ok ? 'ACEITO' : 'falhou ' + res.status));
    }
  }

  // 2) permissoes
  const repo = await fetch('https://api.github.com/repos/' + REPO, { headers }).then((r) => r.json());
  console.log('permissoes: push=' + (repo.permissions && repo.permissions.push) + ' admin=' + (repo.permissions && repo.permissions.admin));

  // 3) push
  if (repo.permissions && repo.permissions.push) {
    console.log('fazendo push...');
    const out = execFileSync('git', ['push', 'origin', 'main'], { cwd: __dirname, encoding: 'utf8', stdio: 'inherit' });
    console.log(out);
  } else {
    console.log('Sem permissao de push ainda.');
  }
})().catch((e) => { console.error('FALHA:', e.message); process.exit(1); });
