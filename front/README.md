# Front — ESCOLA ABANDONADA

O jogo em si. HTML, CSS e JavaScript puro (ES2020), **sem bibliotecas e sem
build**. Toda a arte é pixel art procedural desenhada em `<canvas>`; todo o
áudio é sintetizado com WebAudio.

```
front/
├── index.html      # DOM dos menus + <canvas> 640x360
├── css/style.css   # telas, HUD, controles de toque
├── css/fonts.css   # fonte pixelada (Silkscreen) embutida em base64
├── js/
│   ├── util.js       # clamp, lerp, aabb, texto, cores
│   ├── pixelfont.js  # fonte bitmap 5x7 desenhada pixel a pixel
│   ├── difficulty.js # dificuldades (corações, inimigos, chefes)
│   ├── audio.js      # música e efeitos procedurais
│   ├── input.js      # teclado, mouse e toque
│   ├── config.js     # endereço da API
│   ├── api.js        # cliente HTTP (contas, saves, ranking)
│   ├── art.js        # sprites de Kennedito, chefes, inimigos
│   ├── world_art.js  # cenários, portas, cutscenes
│   ├── entities.js   # jogador, projéteis, perigos, partículas
│   ├── bosses.js     # padrões de ataque e IA dos chefes
│   ├── levels.js     # salas, portas, chaves e habilidades
│   ├── ui.js         # telas de menu, diário e ranking
│   └── game.js       # laço principal, save e progressão
├── kennedito.html   # o jogo inteiro em um arquivo só (gerado)
├── build-single.js  # gera o kennedito.html
├── build-fonts.js   # gera o css/fonts.css
└── check-single.js  # confere se o kennedito.html está atualizado
```

## Fontes

O jogo usa duas fontes, ambas embutidas (sem CDN, funciona offline):

- **Silkscreen** (CSS) — títulos, legendas e botões. Pixelada e compacta.
- **Bitmap 5×7** (`js/pixelfont.js`) — todo o texto desenhado no canvas. É
  desenhado pixel a pixel, então o HUD tem a mesma granulação da arte. Tem
  acentos do português (Á À Â Ã É Ê Í Ó Ô Õ Ú Ç) e símbolos (— → ✓).

## Combate à distância

| Tecla | Ação |
| ----- | ---- |
| `J` / `X` / clique esquerdo | Arremessa um **giz** na direção do cursor (8 direções) |
| `L` / `V` / clique do meio | Lança o **lápis**, que perfura um inimigo |
| `K` / `C` / Shift / clique direito | Dash |

O terceiro golpe do combo arremessa um giz maior, com mais dano.

## Dificuldade

O menu **Dificuldade** (no título e na pausa) escolhe entre três níveis:
`facil`, `normal` e `dificil`. Tudo em `js/difficulty.js`.

A escolha muda os corações, a vida e a velocidade dos inimigos, a vida e a
agressividade dos chefes e o dano do Kennedito. Ela fica em
`save.settings.difficulty` (e vai para a nuvem).

Se o save chegar com uma dificuldade desconhecida, o jogo assume `normal`.

## Como executar

```bash
cd front
python -m http.server 8080
```

Ou abra o `index.html` direto no navegador (funciona, mas o `localStorage`
fica atrelado ao `file://` em alguns navegadores).

## A API

`js/config.js` tem a lista de endereços da API:

```js
window.KC_CONFIG = {
  apiBases: [
    "https://br-autumn-fire-be1wf2tx-api.compute.c-9.us-east-2.aws.neon.tech",
    "https://kennedito-api.onrender.com"
  ],
  apiBase: "https://br-autumn-fire-be1wf2tx-api.compute.c-9.us-east-2.aws.neon.tech",
  localApiBase: "http://localhost:3001",
  requestTimeoutMs: 15000
};
```

O jogo tenta os endereços da lista em ordem e fica com o primeiro que
responder (guardando no `localStorage`). Se o primeiro estiver fora do ar,
ele cai para o próximo sozinho — a conta e o ranking continuam funcionando.

Para apontar para um servidor local durante o desenvolvimento, use a query:
`http://localhost:8080/?api=http://localhost:3001`.

## O arquivo único

`kennedito.html` tem todo o jogo embutido em um único arquivo (HTML + CSS + JS),
sem dependências. Dá para abrir com duplo clique, mandar por e-mail ou subir
sozinho em qualquer lugar.

Depois de mexer nos arquivos, regere-o:

```bash
cd front
node build-single.js      # gera front/kennedito.html
node check-single.js      # só confere se está atualizado
```

## Como está organizado o jogo

### Estados (`game.js`)

| Estado         | O que acontece                                                   |
| -------------- | ---------------------------------------------------------------- |
| `title`        | Menu principal sobre a cena do portão.                           |
| `intro`        | Três telas de prólogo em DOM.                                    |
| `entrance`     | Cutscene de entrada na escola.                                   |
| `playing`      | Jogo normal.                                                     |
| `bossEntry`    | Cutscene ao cruzar a porta de uma sala de chefe.                 |
| `bossIntro`    | Retrato do chefe + falas antes da luta.                          |
| `victory`      | Tela de vitória; a chave cai no chão.                            |
| `lore`         | Página do diário aberta.                                         |
| `dying`        | Morte → tela de game over.                                       |
| `paused`       | Menu de pausa.                                                   |
| `cutscene`     | Cutscene final (chave mestra no portão).                         |
| `ending`       | Tela de final com estatísticas e ranking.                        |

### Progressão das chaves

`levels.js` guarda a ordem canônica dos chefes em `BOSS_ORDER` e a habilidade
que cada um libera em `BOSS_ABILITY`. Uma porta fica trancada enquanto o
jogador não tiver a chave do chefe anterior:

```js
// levels.js
{ id: 'sala2', room: 'sala2', x: 980, requires: 'mestre' }
```

`game.getDoorState(door)` devolve `locked`, `available` ou `cleared`, e
`game.hasKey(bossId)` consulta o array `save.keys`.

A chave **cai no chão** quando o chefe morre: o jogador precisa passar por
cima dela (`game.onKeyPicked`) antes de a porta seguinte destrancar.

### Save

`localStorage` na chave `kennedito.save.v1`, sanitizado por `sanitizeSave()`:

```js
{
  version, introSeen, currentRoom, maxHearts,
  bossesDefeated: ['mestre'],       // chefes vencidos
  keys: ['mestre'],                 // chaves recolhidas no chão
  abilities: ['book'],
  lore: ['hub_ata'],
  settings: { muted, volume },
  stats: { timeMs, deaths, kills, runs },
  endingsSeen, finalCutsceneSeen, lastSavedAt
}
```

Com conta na nuvem, o save é sincronizado com `PUT /api/me/save` e, em conflito,
**vence o mais recente** (`lastSavedAt`).

### Cutscenes

| Função (em `world_art.js`)      | Quando roda                        |
| ------------------------------- | ---------------------------------- |
| `drawGateScene(ctx, t, 'title')` | Menu principal                   |
| `drawEntranceScene(ctx, t)`      | Entrada na escola (após o prólogo) |
| `drawBossEntryScene(ctx, t, ...)` | Chegada à sala de chefe           |
| `drawGateScene(ctx, t, 'cutscene')` | Final: a chave mestra no portão  |

As legendas ficam em `game.js` (`KC_ENTRANCE_LINES` e `KC_FINAL_LINES`), com
início e fim em segundos.

## Nuvem (opcional)

`js/config.js`:

```js
window.KC_CONFIG = {
  apiBase: "https://sua-api.onrender.com",
  localApiBase: "http://localhost:3001",
  requestTimeoutMs: 8500
};
```

Também dá para apontar a API pela URL, sem mexer no arquivo:

```
http://localhost:8080/?api=http://127.0.0.1:3001
```

Sem API configurada o jogo continua funcionando: o botão de conta mostra
"Servidor indisponível" e o progresso fica só no dispositivo.

## Ajustes

- **Resolução:** o canvas é fixo em 640×360 e escalado por CSS
  (`image-rendering: crisp-edges`).
- **Controles de toque** aparecem sozinhos em telas com toque.
- **Áudio:** só inicia depois do primeiro clique/tecla, como exigem os
  navegadores modernos.
