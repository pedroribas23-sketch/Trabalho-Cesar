# KENNEDITO: A ESCOLA QUE NUNCA MORRE

Jogo 2D de terror escolar em português. Kennedito entra numa escola abandonada,
enfrenta cinco professores e precisa sair vivo — com a chave mestra.

O repositório está dividido em duas partes:

| Pasta  | O que é                                                       |
| ------ | ------------------------------------------------------------- |
| `front/` | O jogo (HTML + CSS + JavaScript puro, sem bibliotecas).     |
| `back/`  | A API de contas, saves e ranking (TypeScript + Postgres).    |

## O jogo

**Objetivo:** cruzar a CEPK. As portas do corredor abrem uma de cada vez — a chave
que o chefe deixa é a única que destranca a sala seguinte.

| Ordem | Sala              | Chefe                    | Chave que ele deixa      | Habilidade liberada |
| ----- | ----------------- | ------------------------ | ------------------------ | ------------------- |
| 1     | Sala 5            | O Mestre das Aulas       | Chave da Sala 6          | Caderno voador      |
| 2     | Sala 6            | Professor dos Programas  | Chave da Sala 7          | Dash aéreo          |
| 3     | Sala 7            | O Último Feiura          | Chave da Quadra          | Grito de Guerra      |
| 4     | Quadra            | O Professor Esquecido    | Chave do Laboratório     | Pulo duplo          |
| 5     | Laboratório       | O Guardião dos Sistemas  | Chave mestra             | — (final)           |

**Cutscenes**

- **Entrada** — ao começar a jornada, Kennedito chega na chuva, a chave enferrujada
  gira sozinha, o portão da CEPK abre e as janelas acendem uma a uma.
- **Chefe** — ao cruzar a porta de uma sala de chefe, a porta tranca atrás de você,
  as luzes acendem e o professor aparece no fundo da sala.
- **Final** — depois do Guardião dos Sistemas, Kennedito coloca a chave mestra no
  portão e vai embora. A escola nunca morre.

**Controles**

| Ação              | Teclado                      | Mouse             | Toque          |
| ----------------- | ---------------------------- | ----------------- | -------------- |
| Mover             | A / D ou ← / →               | —                 | Direcional     |
| Pular             | Espaço / W / ↑               | —                 | ↑              |
| Atacar            | J / X                        | Botão esquerdo    | A              |
| Dash              | K / C / Shift                | Botão direito     | D              |
| Caderno voador    | L / V                        | Botão do meio     | L              |
| Grito de Guerra   | U                            | —                 | U              |
| Interagir / ler   | E                            | —                 | —              |
| Pausar            | Esc / P                      | —                 | —              |

## Rodando o front

Não precisa de build nem de instalação — é HTML, CSS e JavaScript puro.

```bash
cd front
python -m http.server 8080     # ou: npx serve .
```

Abra <http://localhost:8080>. Também dá para abrir o `front/index.html`
diretamente no navegador.

## Publicando no GitHub Pages

1. Crie um repositório e suba este conteúdo.
2. Em **Settings → Pages**, escolha *Deploy from a branch*, branch `main` e
   pasta `/front`.
3. O jogo fica disponível em `https://<usuario>.github.io/<repositorio>/`.

Para apontar o ranking e as contas para a API, edite `front/js/config.js`:

```js
window.KC_CONFIG = {
  apiBase: "https://sua-api.onrender.com",
  localApiBase: "http://localhost:3001",
  requestTimeoutMs: 8500
};
```

Sem `apiBase` o jogo funciona 100% offline: o save fica no `localStorage` e o
ranking mostra apenas os tempos salvos no próprio dispositivo.

## Rodando o back

```bash
cd back
npm install
cp .env.example .env      # ajuste o DATABASE_URL
npm run dev               # http://localhost:3001
```

Detalhes de ambiente, endpoints e deploy no [`back/README.md`](back/README.md).

## Licença

Projeto acadêmico. Arte, som e código são procedurais — nenhum asset externo.
