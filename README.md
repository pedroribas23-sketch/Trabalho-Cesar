# ESCOLA ABANDONADA

Jogo 2D de terror escolar em português. Kennedito entra numa escola abandonada,
enfrenta cinco professores e precisa sair vivo — com a chave mestra.

O repositório está dividido em duas partes:

| Pasta    | O que é                                                    |
| -------- | ---------------------------------------------------------- |
| `front/` | **O jogo.** HTML + CSS + JavaScript puro, sem bibliotecas.  |
| `back/`  | **A API.** Contas, saves na nuvem e ranking (TS + Postgres). |

```
/
├── front/          ← o jogo
│   ├── index.html
│   ├── css/style.css + css/fonts.css   (fonte pixelada embutida)
│   ├── js/         (13 arquivos: arte, áudio, entidades, chefes, levels, ui, game)
│   ├── kennedito.html   ← o jogo inteiro num arquivo só
│   ├── build-single.js  ← gera o kennedito.html
│   ├── build-fonts.js   ← gera o css/fonts.css
│   └── check-single.js  ← confere se o kennedito.html está atualizado
├── back/           ← a API
│   ├── src/        (10 arquivos TypeScript)
│   ├── test/       (15 testes)
│   ├── sql/001_init.sql
│   ├── package.json / tsconfig.json / .env.example
│   └── README.md
├── .github/workflows/pages.yml  ← publica o jogo no GitHub Pages
├── render.yaml     ← blueprint do Render (precisa ficar na raiz)
├── index.html      ← redireciona para o jogo
├── README.md
└── .gitignore
```

## O jogo

**Objetivo:** cruzar a CEPK. As portas do corredor abrem uma de cada vez — a chave
que o chefe deixa é a única que destranca a sala seguinte.

| Ordem | Sala              | Chefe                    | Chave que ele deixa      | Habilidade liberada |
| ----- | ----------------- | ------------------------ | ------------------------ | ------------------- |
| 1     | Sala 5            | O Mestre das Aulas       | Chave da Sala 6          | Dash aéreo          |
| 2     | Sala 6            | Professor dos Programas  | Chave da Sala 7          | Grito de Guerra      |
| 3     | Sala 7            | O Último Feiura          | Chave da Quadra          | Pulo duplo          |
| 4     | Quadra            | O Professor Esquecido    | Chave do Laboratório     | Caderno voador      |
| 5     | Laboratório       | O Guardião dos Sistemas  | Chave mestra             | — (final)           |

**Combate à distância:** o ataque base (`J`/`X` ou clique esquerdo) arremessa um
**giz** na direção do cursor, em 8 direções. O `L`/`V` lança o **lápis**
perfurante. O `K`/Shift dá dash.

**Cutscenes**

- **Entrada** — ao começar a jornada, Kennedito chega na chuva, a chave enferrujada
  gira sozinha, o portão da CEPK abre e as janelas acendem uma a uma.
- **Chefe** — ao cruzar a porta de uma sala de chefe, a porta tranca atrás de você,
  as luzes acendem e o professor aparece no fundo da sala.
- **Final** — depois do Guardião dos Sistemas, Kennedito coloca a chave mestra no
  portão e vai embora. A escola nunca morre.

**Controles**

| Ação            | Teclado             | Mouse             | Toque      |
| --------------- | ------------------- | ----------------- | ---------- |
| Mover           | A / D ou ← / →      | —                 | Direcional |
| Pular           | Espaço / W / ↑      | —                 | ↑          |
| Arremessar giz  | J / X               | Botão esquerdo    | A          |
| Dash            | K / C / Shift       | Botão direito     | D          |
| Lápis           | L / V               | Botão do meio     | L          |
| Grito de Guerra | U                   | —                 | U          |
| Interagir / ler | E                   | —                 | —          |
| Pausar          | Esc / P             | —                 | —          |

## Rodando o front

Não precisa de build nem de instalação — é HTML, CSS e JavaScript puro.

```bash
cd front
python -m http.server 8080     # ou: npx serve .
```

Abra <http://localhost:8080>. Também dá para abrir o `front/index.html`
diretamente no navegador, ou o `front/kennedito.html` (que tem tudo embutido
em um único arquivo).

Para regerar o arquivo único depois de mexer no jogo:

```bash
cd front
node build-single.js
```

## Publicando no GitHub Pages

O repositório já tem a workflow `.github/workflows/pages.yml`. Para publicar:

1. Em **Settings → Pages**, escolha *Source: **GitHub Actions*** e salve.
2. A workflow dispara sozinha no próximo push e publica a pasta `front/`.
3. O jogo fica em `https://pedroribas23-sketch.github.io/Trabalho-Cesar/front/`.

Para apontar o ranking e as contas para a API, edite `front/js/config.js`:

```js
window.KC_CONFIG = {
  apiBase: "https://kennedito-api.onrender.com",
  localApiBase: "http://localhost:3001",
  requestTimeoutMs: 8500
};
```

Sem `apiBase` o jogo funciona 100% offline: o save fica no `localStorage` e o
ranking mostra apenas os tempos salvos no próprio dispositivo.

## Rodando o back

O banco fica no **Neon** (Postgres) e a API no **Render**.

```bash
cd back
npm install
cp .env.example .env      # cole a DATABASE_URL do Neon (pooled) e use DATABASE_SSL=true
npm run dev               # http://localhost:3001
```

Detalhes de ambiente, endpoints e deploy no [`back/README.md`](back/README.md).

## Licença

Projeto acadêmico. Arte, som e código são procedurais — nenhum asset externo.
