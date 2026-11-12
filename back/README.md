# Back — API do Kennedito

Contas, saves na nuvem e ranking de tempos do **ESCOLA ABANDONADA**.
TypeScript + Express 5 + Postgres.

O **banco fica no Neon** (Postgres, plano gratuito) e a **API roda no Render**.

```
back/
├── src/
│   ├── app.ts          # rotas Express
│   ├── config.ts       # leitura do ambiente
│   ├── db.ts           # pool do Postgres
│   ├── index.ts        # boot do servidor
│   ├── migrate.ts      # aplica o schema
│   ├── repository.ts   # queries
│   ├── schema.ts       # DDL (mesmo conteúdo de sql/001_init.sql)
│   ├── security.ts     # bcrypt, token de sessão
│   ├── types.ts        # tipos das linhas
│   └── validation.ts   # schemas zod
├── sql/001_init.sql    # schema para rodar direto no psql
├── test/               # testes com node:test + pg-mem
├── .env.example
└── README.md
```

O `render.yaml` do deploy fica na raiz do repositório (exigência do Render
Blueprint) e aponta para esta pasta.

## Banco no Neon

O projeto `kennedito` já está criado com o schema aplicado. Para conectar:

1. Neon Console → projeto **kennedito** → branch **main** → **Connect**
2. Copie a **Pooled connection string** (a que tem `-pooler` no host)
3. Cole no `.env` local e no `DATABASE_URL` do Render

```
DATABASE_URL=postgresql://USER:SENHA@ep-...-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_SSL=true
```

Use sempre a **pooled**: é ela que passa pelo pooler do Neon e aguenta o
tráfego da API. A senha **nunca** vai para o GitHub — no `render.yaml` a
variável está como `sync: false`, então o Render pede o valor no deploy.

## Rodando local

```bash
cd back
npm install
cp .env.example .env     # cole a DATABASE_URL do Neon
npm run dev               # http://localhost:3001
```

O `AUTO_MIGRATE=true` (padrão) cria as tabelas sozinho no boot. Para aplicar
o schema manualmente:

```bash
npm run migrate
```

## Variáveis de ambiente

| Variável       | Padrão          | O que é                                              |
| -------------- | --------------- | --------------------------------------------------- |
| `DATABASE_URL` | —               | **Obrigatória.** Pooled connection string do Neon.   |
| `DATABASE_SSL` | `false`         | `true` para o Neon (que exige SSL).                  |
| `PORT`         | `3001`          | Porta HTTP.                                          |
| `HOST`         | `0.0.0.0`       | Interface de escuta.                                 |
| `CORS_ORIGIN`  | `*`             | Origens permitidas, separadas por vírgula.           |
| `SESSION_DAYS` | `30`            | Validade da sessão.                                   |
| `BCRYPT_ROUNDS`| `12`            | Custo do hash do PIN (4 a 15).                       |
| `AUTO_MIGRATE` | `true`          | Aplica o schema no boot.                             |

No Render (URL interna do banco) use `DATABASE_SSL=false`. Fora do Render,
normalmente é preciso `DATABASE_SSL=true`.

## Endpoints

| Método | Rota                  | Auth | O que faz                                        |
| ------ | --------------------- | ---- | ------------------------------------------------ |
| GET    | `/api/health`         | —    | Status da API e do banco.                        |
| POST   | `/api/accounts`       | —    | Cria conta (`name`, `pin`, `save` opcional).     |
| POST   | `/api/accounts/login` | —    | Entra e devolve `token`, `account` e `save`.     |
| POST   | `/api/accounts/logout`| ✓    | Revoga a sessão atual.                           |
| GET    | `/api/me`             | ✓    | Dados da conta + save.                           |
| GET    | `/api/me/save`        | ✓    | Só o save.                                       |
| PUT    | `/api/me/save`        | ✓    | Salva o progresso.                               |
| GET    | `/api/leaderboard`    | —    | Ranking (`?limit=10`).                           |
| POST   | `/api/runs`           | ✓    | Registra um tempo concluído.                     |

`✓` = precisa do header `Authorization: Bearer <token>`.

Erros saem sempre no mesmo formato:

```json
{ "error": { "code": "invalid_credentials", "message": "Nome ou chave de acesso incorretos." } }
```

### Exemplo

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/accounts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Kennedito","pin":"1234"}' | jq -r .token)

curl -s -X PUT http://localhost:3001/api/me/save \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"save":{"version":1,"currentRoom":"hub","bossesDefeated":["mestre"],"keys":["mestre"]}}'

curl -s http://localhost:3001/api/leaderboard?limit=10
```

## Modelo do save

O save é salvo como `jsonb` e validado com zod em `validation.ts`:

```ts
{
  version, introSeen, currentRoom, maxHearts,
  bossesDefeated: string[],   // ids de chefes vencidos
  keys: string[],             // chaves recolhidas
  abilities: string[],
  lore: string[],
  settings: { muted, volume },
  stats: { timeMs, deaths, kills, runs },
  endingsSeen, finalCutsceneSeen, lastSavedAt
}
```

## Segurança

- PIN de 4 dígitos guardado com **bcrypt** (nunca em texto puro).
- Token de sessão aleatório de 32 bytes; o banco guarda apenas o **SHA-256** dele.
- Falhas de login são contabilizadas por IP + nome: 8 tentativas em 15 minutos
  bloqueiam a conta por 15 minutos.
- Nome inexistente ainda roda um `verifyPin` falso, para não revelar pelo
  tempo de resposta quais apelidos existem.
- `helmet` padrão: `nosniff`, `no-referrer` e `no-store`.

## Deploy no Render

O [`render.yaml`](../render.yaml) da raiz do repositório já descreve o web
service completo (com o banco vindo do Neon):

```bash
# no Render: New → Blueprint, aponte para o repositório
```

O Blueprint cria o web service e, na hora do deploy, pede o `DATABASE_URL`
(`sync: false`) — cole ali a **pooled connection string** do Neon. Assim a
senha do banco nunca passa pelo GitHub.

Manualmente:

1. Crie um **Web Service** apontando para o repositório, com
   *Root Directory* = `back`.
2. Build: `npm install && npm run build` · Start: `npm run start`.
3. Em *Environment*, adicione `DATABASE_URL` (pooled do Neon) e
   `DATABASE_SSL=true`.
4. Ajuste `CORS_ORIGIN` para o domínio do front.

Depois é só colocar a URL da API em `front/js/config.js`.

## Testes

```bash
npm test          # node:test + pg-mem + supertest
npm run typecheck # tsc --noEmit
```

Os testes sobem um Postgres em memória (`pg-mem`), então rodam sem banco
instalado na máquina.
