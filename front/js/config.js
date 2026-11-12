/* =========================================================
   KENNEDITO — configuração do cliente

   A API é tentada na ordem da lista apiBases: o primeiro
   que responder passa a ser o principal e fica salvo neste
   dispositivo. Assim o jogo funciona com a Function do Neon
   e também com o deploy no Render.

   Sem nenhuma URL configurada o jogo roda 100% offline:
   o progresso fica no localStorage e o ranking mostra só os
   tempos salvos no próprio aparelho.
   ========================================================= */
window.KC_CONFIG = {
  apiBases: [
    "https://br-autumn-fire-be1wf2tx-api.compute.c-9.us-east-2.aws.neon.tech",
    "https://kennedito-api.onrender.com"
  ],
  apiBase: "https://br-autumn-fire-be1wf2tx-api.compute.c-9.us-east-2.aws.neon.tech",
  localApiBase: "http://localhost:3001",
  requestTimeoutMs: 15000
};
