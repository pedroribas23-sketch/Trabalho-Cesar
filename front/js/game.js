/* =========================================================
   KENNEDITO — jogo: estado, save, salas, chefes e final
   ========================================================= */
'use strict';

const KC_SAVE_KEY = 'kennedito.save.v1';
const KC_LOCAL_RUNS_KEY = 'kennedito.runs.local.v1';
const KC_SAVE_VERSION = 1;
const KC_CLASSROOMS = ['mestre', 'programas', 'feiura'];

const KC_ABILITY_INFO = {
  book: { name: 'CADERNO VOADOR', hint: 'L / V — arremesse o caderno' },
  airDash: { name: 'DASH AÉREO', hint: 'K / SHIFT no ar — atravesse o vazio' },
  warcry: { name: 'GRITO DE GUERRA', hint: 'U — empurre e fere tudo perto' },
  doubleJump: { name: 'PULO DUPLO', hint: 'ESPAÇO novamente no ar' }
};

const KC_INTRO_PAGES = [
  {
    title: 'A escola mandou uma mensagem.',
    text: '“A escola nunca morre. Volte sozinho.” Não veio endereço, horário nem remetente. Só uma chave enferrujada presa no portão da CEPK — e o seu nome escrito no verso.'
  },
  {
    title: 'Cinco chaves. Cinco salas.',
    text: 'As salas 5, 6 e 7 estão abertas. A quadra só aceita quem já venceu os três professores. O laboratório guarda a saída. Ou o que restou dela.'
  },
  {
    title: '23:47. O portão está aberto.',
    text: 'As luzes ainda piscam. As carteiras ainda rangem. Cinco professores esperam. A escola não pretende deixar Kennedito sair. Mas ele já está do lado de dentro.'
  }
];

const KC_FINAL_LINES = [
  { start: 0.4, end: 3.4, text: 'A chave mestra ainda estava quente.' },
  { start: 3.6, end: 5.8, text: 'Pela primeira vez em vinte e seis anos, o portão reconheceu Kennedito.' },
  { start: 6.0, end: 8.9, text: 'A escola não tentou impedi-lo.' },
  { start: 9.1, end: 12.2, text: 'Do outro lado, a cidade ainda existia.' },
  { start: 12.4, end: 15.4, text: 'As luzes da CEPK se apagaram, uma a uma.' },
  { start: 15.6, end: 19.0, text: 'A escola nunca morre. Mas, por enquanto... ela dorme.' }
];

const KC_ENTRANCE_LINES = [
  { start: 0.5, end: 3.4, text: 'A chuva não molhava mais a cidade. Só a escola.' },
  { start: 3.6, end: 6.2, text: 'A chave enferrujada girou uma vez. Sozinha.' },
  { start: 6.4, end: 9.0, text: 'O portão da CEPK abriu sem ruído. Como se esperasse.' },
  { start: 9.2, end: 12.0, text: 'Kennedito entrou. E as janelas acenderam, uma a uma.' }
];

const KC_ENTRANCE_DURATION = 12.6;
const KC_BOSS_ENTRY_DURATION = 6.4;

function defaultSave() {
  return {
    version: KC_SAVE_VERSION,
    introSeen: false,
    currentRoom: 'hub',
    maxHearts: 6,
    bossesDefeated: [],
    keys: [],
    abilities: [],
    lore: [],
    settings: { muted: false, volume: 0.72 },
    stats: { timeMs: 0, deaths: 0, kills: 0, runs: 0 },
    endingsSeen: 0,
    finalCutsceneSeen: false,
    lastSavedAt: 0
  };
}

function sanitizeSave(raw) {
  const out = defaultSave();
  if (!raw || typeof raw !== 'object') return out;
  out.version = KC_SAVE_VERSION;
  out.introSeen = !!raw.introSeen;
  out.finalCutsceneSeen = !!raw.finalCutsceneSeen;
  out.endingsSeen = Math.max(0, Math.min(999, Math.floor(Number(raw.endingsSeen) || 0)));
  out.lastSavedAt = Math.max(0, Number(raw.lastSavedAt) || 0);

  const knownBosses = (typeof BOSS_DEFS !== 'undefined') ? Object.keys(BOSS_DEFS) : [];
  out.bossesDefeated = Array.isArray(raw.bossesDefeated)
    ? raw.bossesDefeated.filter(function (id) { return knownBosses.indexOf(id) >= 0; })
    : [];
  out.bossesDefeated = out.bossesDefeated.filter(function (id, i, arr) { return arr.indexOf(id) === i; });

  // chaves coletadas: lista de ids de chefe cuja chave foi recolhida no chão
  out.keys = Array.isArray(raw.keys)
    ? raw.keys.filter(function (id) { return knownBosses.indexOf(id) >= 0; })
    : [];
  out.keys = out.keys.filter(function (id, i, arr) { return arr.indexOf(id) === i; });
  // chaves só existem se o chefe já foi derrotado
  out.keys = out.keys.filter(function (id) { return out.bossesDefeated.indexOf(id) >= 0; });
  if (!Array.isArray(raw.keys)) {
    // save antigo: numerava chaves; assume as primeiras da ordem
    for (let i = 0; i < Math.min(5, out.bossesDefeated.length); i++) {
      if (out.keys.indexOf(out.bossesDefeated[i]) < 0) out.keys.push(out.bossesDefeated[i]);
    }
  }

  out.lore = Array.isArray(raw.lore)
    ? raw.lore.filter(function (id) {
        return typeof id === 'string' && (typeof LORE_BY_ID === 'undefined' || !!LORE_BY_ID[id]);
      })
    : [];
  out.lore = out.lore.filter(function (id, i, arr) { return arr.indexOf(id) === i; });

  const knownAbilities = ['book', 'airDash', 'warcry', 'doubleJump'];
  out.abilities = Array.isArray(raw.abilities)
    ? raw.abilities.filter(function (id) { return knownAbilities.indexOf(id) >= 0; })
    : [];
  out.abilities = out.abilities.filter(function (id, i, arr) { return arr.indexOf(id) === i; });

  // habilidades seguem a ordem canônica dos chefes
  if (typeof BOSS_ORDER !== 'undefined') {
    BOSS_ORDER.forEach(function (bossId) {
      const ability = (typeof BOSS_ABILITY !== 'undefined') ? BOSS_ABILITY[bossId] : null;
      if (!ability) return;
      if (out.bossesDefeated.indexOf(bossId) >= 0 && out.abilities.indexOf(ability) < 0) {
        out.abilities.push(ability);
      }
    });
  }

  out.maxHearts = clamp(Number(raw.maxHearts) || (6 + out.bossesDefeated.length), 6, 11);
  out.maxHearts = Math.max(out.maxHearts, 6 + out.bossesDefeated.length);

  let roomId = String(raw.currentRoom || 'hub');
  if (!ROOMS[roomId]) roomId = 'hub';
  if (isBossRoom(roomId) && ROOMS[roomId].boss && out.bossesDefeated.indexOf(ROOMS[roomId].boss) >= 0) {
    roomId = 'hub';
  }
  out.currentRoom = roomId;

  if (raw.settings && typeof raw.settings === 'object') {
    out.settings.muted = !!raw.settings.muted;
    out.settings.volume = clamp(Number(raw.settings.volume) || 0.72, 0, 1);
  }
  if (raw.stats && typeof raw.stats === 'object') {
    out.stats.timeMs = Math.max(0, Math.min(999999999, Number(raw.stats.timeMs) || 0));
    out.stats.deaths = Math.max(0, Math.min(999999, Math.floor(Number(raw.stats.deaths) || 0)));
    out.stats.kills = Math.max(0, Math.min(999999, Math.floor(Number(raw.stats.kills) || 0)));
    out.stats.runs = Math.max(0, Math.min(999999, Math.floor(Number(raw.stats.runs) || 0)));
  }
  if (out.finalCutsceneSeen && out.endingsSeen < 1) out.endingsSeen = 1;
  return out;
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text || '').split(' ');
  const lines = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrappedCentered(ctx, text, x, y, maxWidth, lineHeight, size, color, outline) {
  ctx.save();
  ctx.font = 'bold ' + size + 'px "Lucida Console", monospace';
  const lines = wrapLines(ctx, text, maxWidth);
  const total = lines.length * lineHeight;
  lines.forEach(function (line, i) {
    const yy = y - total / 2 + lineHeight / 2 + i * lineHeight;
    drawOutlinedText(ctx, line, x, yy, size, color, outline || '#040806', 'center');
  });
  ctx.restore();
}

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) this.ctx.imageSmoothingEnabled = false;
    this.input = window.KC_INPUT;
    this.ui = window.KC_UI;
    this.audio = (typeof audio !== 'undefined') ? audio : null;
    this.api = window.KC_API;

    this.save = this.loadSave();
    this.state = 'title';
    this.room = null;
    this.roomId = 'hub';
    this.player = null;
    this.boss = null;
    this.bossActive = false;
    this.enemies = [];
    this.projectiles = [];
    this.hazards = [];
    this.particles = [];
    this.pickups = [];
    this.loreItems = [];

    this.camera = { x: 0, y: 0 };
    this.shakePower = 0;
    this.shakeTime = 0;
    this.fadeAlpha = 0;
    this.roomBanner = 0;
    this.hitstop = 0;
    this.darkness = null;

    this.elapsed = 0;
    this.titleTime = 0;
    this.endingTime = 0;
    this.lastTime = performance.now();

    this.introPage = 0;
    this.overlayReturn = null;
    this.toastSeen = new Set();
    this.cloudSyncTimer = null;
    this.accountBusy = false;
    this.syncing = false;
    this.autosaveTimer = 0;
    this.runSubmitted = false;

    this.deathTimer = 0;
    this.bossIntro = null;
    this.victory = null;
    this.lorePage = null;
    this.cutsceneTime = 0;
    this.cutsceneEvents = { gate: false };
    this.pendingAbilityText = '';
    this.entranceTime = 0;
    this.bossEntryTime = 0;
    this.endingStats = null;

    this.bindUi();
    this.bindGlobalEvents();
    this.applySettings();

    this.goTitle();
    this.updateCloudBadge();
    this.checkCloud();

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  /* ---------------- persistência ---------------- */

  loadSave() {
    try {
      const raw = safeStorageGet(KC_SAVE_KEY);
      if (!raw) return defaultSave();
      return sanitizeSave(JSON.parse(raw));
    } catch (e) {
      return defaultSave();
    }
  }

  saveGame(reason) {
    if (!this.save) return;
    this.save.version = KC_SAVE_VERSION;
    if (this.room && ['playing', 'paused', 'bossIntro', 'victory', 'lore', 'dying', 'gameover'].indexOf(this.state) >= 0) {
      this.save.currentRoom = this.roomId;
    }
    this.save.lastSavedAt = Date.now();
    safeStorageSet(KC_SAVE_KEY, JSON.stringify(this.save));
    if (this.api && this.api.token) this.scheduleCloudSync(2600);
  }

  hasProgress() {
    return !!(this.save && (this.save.introSeen ||
      (this.save.bossesDefeated && this.save.bossesDefeated.length) ||
      (this.save.lore && this.save.lore.length) ||
      (this.save.stats && this.save.stats.timeMs > 5000)));
  }

  hasAbility(id) {
    return !!(this.save && this.save.abilities && this.save.abilities.indexOf(id) >= 0);
  }

  hasKey(bossId) {
    return !!(this.save && this.save.keys && this.save.keys.indexOf(bossId) >= 0);
  }

  isBossDefeated(id) {
    return !!(this.save && this.save.bossesDefeated && this.save.bossesDefeated.indexOf(id) >= 0);
  }

  unlockAbility(id) {
    if (!id || this.hasAbility(id)) return false;
    this.save.abilities.push(id);
    return true;
  }

  /* Chave que abre a próxima porta: a do chefe anterior na ordem canônica. */
  keyOpensRoom(bossId) {
    if (typeof BOSS_ORDER === 'undefined') return null;
    const idx = BOSS_ORDER.indexOf(bossId);
    if (idx < 0) return null;
    if (idx >= BOSS_ORDER.length - 1) return null;
    const nextBoss = BOSS_ORDER[idx + 1];
    for (const roomId in ROOMS) {
      if (ROOMS[roomId] && ROOMS[roomId].boss === nextBoss) return roomId;
    }
    return null;
  }

  /* Próxima sala ainda trancada na ordem canônica dos chefes. */
  nextLockedRoom() {
    if (typeof BOSS_ORDER === 'undefined') return null;
    for (let i = 0; i < BOSS_ORDER.length; i++) {
      const bossId = BOSS_ORDER[i];
      if (this.isBossDefeated(bossId)) continue;
      for (const roomId in ROOMS) {
        if (ROOMS[roomId] && ROOMS[roomId].boss === bossId) return roomId;
      }
      return null;
    }
    return null;
  }

  applySettings() {
    if (!this.audio || !this.save) return;
    this.audio.setMuted(!!this.save.settings.muted);
    this.audio.setVolume(this.save.settings.volume);
    if (this.ui) this.ui.setSound(!!this.save.settings.muted);
  }

  progressScore(save) {
    if (!save) return -1;
    return (save.bossesDefeated ? save.bossesDefeated.length : 0) * 1000 +
      (save.lore ? save.lore.length : 0) * 100 +
      (save.finalCutsceneSeen ? 5000 : 0) +
      (save.stats ? save.stats.timeMs / 100000 : 0);
  }

  shouldUseCloud(cloud) {
    const ct = Number(cloud.lastSavedAt) || 0;
    const lt = Number(this.save.lastSavedAt) || 0;
    if (ct > lt + 500) return true;
    if (lt > ct + 500) return false;
    return this.progressScore(cloud) > this.progressScore(this.save);
  }

  adoptCloudSave(raw) {
    const cloud = sanitizeSave(raw);
    this.save = cloud;
    safeStorageSet(KC_SAVE_KEY, JSON.stringify(this.save));
    this.applySettings();
    if (this.player) this.player.syncAbilities();
    if (this.ui) this.ui.setContinueVisible(this.hasProgress());
    this.toast('Save da nuvem carregado.', 2600);
  }

  /* ---------------- ligações ---------------- */

  bindUi() {
    if (!this.ui) return;
    this.ui.bind({
      newGame: () => this.requestNewGame(),
      continueGame: () => this.continueGame(),
      openRanking: (from) => this.openRanking(from),
      refreshRanking: () => this.refreshRanking(),
      openControls: (from) => this.openControls(from),
      openJournal: () => this.openJournal(),
      openAccount: (from) => this.openAccount(from),
      closeAccount: () => this.closeAccount(),
      closeOverlay: (name) => this.closeOverlay(name),
      accountSubmit: (mode, name, pin) => this.accountSubmit(mode, name, pin),
      syncNow: () => this.syncNow(),
      logout: () => this.logout(),
      toggleSound: () => this.toggleSound(),
      introNext: () => this.introNext(),
      introSkip: () => this.introSkip(),
      resume: () => this.resume(),
      togglePause: () => this.togglePause(),
      restartRoom: () => this.restartRoom(),
      quitToTitle: () => this.quitToTitle(),
      retryRoom: () => this.retryRoom(),
      backToHub: () => this.backToHub(),
      endingToTitle: () => this.endingToTitle()
    });
  }

  bindGlobalEvents() {
    if (this.input) {
      this.input.bindCanvas(this.canvas);
      this.input.bindTouch(document.querySelectorAll('#touch-controls [data-action]'));
    }
    const unlock = () => {
      if (!this.audio) return;
      this.audio.init();
      this.audio.resume();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.state === 'playing') this.pause();
        this.saveGame('hidden');
      } else {
        this.lastTime = performance.now();
      }
    });
    window.addEventListener('beforeunload', () => {
      this.saveGame('unload');
    });
  }

  /* ---------------- tela inicial / introdução ---------------- */

  goTitle() {
    this.state = 'title';
    this.titleTime = 0;
    this.room = null;
    this.roomId = 'hub';
    this.player = null;
    this.boss = null;
    this.bossActive = false;
    this.enemies = [];
    this.projectiles = [];
    this.hazards = [];
    this.particles = [];
    this.pickups = [];
    this.loreItems = [];
    this.bossIntro = null;
    this.victory = null;
    this.lorePage = null;
    this.darkness = null;
    this.ui.showScreen('title');
    this.ui.setContinueVisible(this.hasProgress());
    this.ui.setTopVisible(false);
    this.ui.setTouchVisible(false);
    this.ui.setSound(!!this.save.settings.muted);
    if (this.audio) this.audio.startMusic('title', false);
    this.updateCloudBadge();
  }

  requestNewGame() {
    if (this.hasProgress()) {
      this.ui.confirm('Novo jogo?', 'O progresso local (chefes, chaves, diário e tempos) será apagado. O save na nuvem não é removido automaticamente.', () => {
        this.startNewGame();
      });
    } else {
      this.startNewGame();
    }
  }

  startNewGame() {
    const muted = !!this.save.settings.muted;
    const volume = this.save.settings.volume;
    this.save = defaultSave();
    this.save.settings.muted = muted;
    this.save.settings.volume = volume;
    this.save.introSeen = false;
    this.save.lastSavedAt = Date.now();
    this.autosaveTimer = 0;
    this.runSubmitted = false;
    this.toastSeen = new Set();
    this.endingStats = null;
    this.saveGame('new');
    this.introPage = 0;
    this.showIntroPage();
    this.state = 'intro';
    this.ui.showScreen('intro');
    this.ui.setTopVisible(false);
    this.ui.setTouchVisible(false);
    if (this.audio) this.audio.startMusic('title', false);
  }

  showIntroPage() {
    const page = KC_INTRO_PAGES[this.introPage] || KC_INTRO_PAGES[0];
    const last = this.introPage >= KC_INTRO_PAGES.length - 1;
    this.ui.setIntroPage(page.title, page.text, last ? 'Entrar na escola' : 'Continuar', true);
  }

  introNext() {
    if (this.state !== 'intro') return;
    if (this.introPage >= KC_INTRO_PAGES.length - 1) {
      this.finishIntro();
    } else {
      this.introPage++;
      this.showIntroPage();
      if (this.audio) this.audio.sfx('select');
    }
  }

  introSkip() {
    if (this.state !== 'intro') return;
    this.finishIntro();
  }

  finishIntro() {
    this.save.introSeen = true;
    this.save.currentRoom = 'hub';
    this.saveGame('intro');
    // cutscene de entrada na escola abandonada
    this.startEntranceCutscene();
  }

  /* ---------------- cutscene de entrada ---------------- */

  startEntranceCutscene() {
    this.state = 'entrance';
    this.entranceTime = 0;
    this.room = null;
    this.roomId = 'hub';
    this.player = null;
    this.boss = null;
    this.bossActive = false;
    this.enemies = [];
    this.projectiles = [];
    this.hazards = [];
    this.particles = [];
    this.pickups = [];
    this.loreItems = [];
    this.ui.hideScreens();
    this.ui.setTopVisible(false);
    this.ui.setTouchVisible(false);
    if (this.audio) {
      this.audio.startMusic('title', false);
      this.audio.sfx('thunder');
    }
  }

  updateEntrance(dt) {
    this.entranceTime += dt;
    const skip = this.input.advancePressed || this.input.interactPressed || this.input.attackPressed;
    if (skip && this.entranceTime > 1.2) {
      this.finishEntranceCutscene();
      return;
    }
    if (this.entranceTime >= KC_ENTRANCE_DURATION) {
      this.finishEntranceCutscene();
    }
  }

  finishEntranceCutscene() {
    this.save.introSeen = true;
    this.save.currentRoom = 'hub';
    this.saveGame('entrance');
    this.enterRoom('hub');
    this.toast('Salão 5 à frente. Encontre a chave e abra a próxima porta.', 3600);
  }

  continueGame() {
    if (!this.save.introSeen) {
      this.introPage = 0;
      this.state = 'intro';
      this.showIntroPage();
      this.ui.showScreen('intro');
      this.ui.setTopVisible(false);
      this.ui.setTouchVisible(false);
      return;
    }
    let roomId = this.save.currentRoom || 'hub';
    if (!ROOMS[roomId]) roomId = 'hub';
    if (isBossRoom(roomId) && ROOMS[roomId].boss && this.isBossDefeated(ROOMS[roomId].boss)) roomId = 'hub';
    this.enterRoom(roomId);
    if (roomId === 'hub' && this.save.bossesDefeated.length < 1) {
      this.toastOnce('hubObjective', 'Salão 5 à frente. Encontre a chave e abra a próxima porta.');
    }
  }

  /* ---------------- salas ---------------- */

  enterRoom(id, opts) {
    const options = opts || {};
    const room = ROOMS[id] || ROOMS.hub;
    this.room = room;
    this.roomId = room.id;
    this.state = 'playing';
    this.boss = null;
    this.bossActive = false;
    this.bossIntro = null;
    this.victory = null;
    this.lorePage = null;
    this.deathTimer = 0;
    this.hitstop = 0;
    this.darkness = null;
    this.enemies = [];
    this.projectiles = [];
    this.hazards = [];
    this.particles = [];
    this.pickups = [];
    this.loreItems = [];
    this.autosaveTimer = 0;

    const spawn = room.spawn || { x: 80, y: room.floorY || 300 };
    this.player = new Player(this, spawn.x, spawn.y);
    this.player.syncAbilities();
    this.player.hp = this.player.maxHp;
    this.player.invuln = 1.1;
    this.player.locked = false;

    const bossDefeated = room.boss && this.isBossDefeated(room.boss);
    if (room.enemies && !bossDefeated) {
      room.enemies.forEach((e) => {
        this.enemies.push(new Enemy(this, e.type, e.x, e.y));
      });
    }
    if (room.loreId && this.save.lore.indexOf(room.loreId) < 0 && room.lore) {
      const entry = (typeof LORE_BY_ID !== 'undefined') ? LORE_BY_ID[room.loreId] : null;
      if (entry) this.loreItems.push(new LoreItem(this, { id: entry.id, title: entry.title, text: entry.text, x: room.lore.x, y: room.lore.y }));
    }

    const maxCam = Math.max(0, room.width - GAME_W);
    this.camera.x = clamp(spawn.x - GAME_W / 2, 0, maxCam);
    this.shakePower = 0;
    this.shakeTime = 0;
    this.fadeAlpha = 1;
    this.roomBanner = 2.6;
    this.save.currentRoom = room.id;
    this.saveGame('room');

    this.ui.hideScreens();
    this.ui.setTopVisible(true);
    this.ui.setTouchVisible(!!(this.input && this.input.hasTouch));
    if (this.audio) {
      const theme = room.bg === 'gym' ? 'gym' : (room.bg === 'lab' ? 'lab' : (room.bg === 'classroom' ? 'classroom' : 'hub'));
      this.audio.startMusic(theme, false);
    }
    if (this.input) this.input.releaseAll();

    // primeira visita a uma sala de chefe: cutscene de chegada
    const playEntry = room.boss && !bossDefeated && !options.noCutscene && this.save.bossesDefeated.indexOf(room.boss) < 0;
    if (playEntry) {
      this.startBossEntryCutscene(room.boss);
      return;
    }

    if (bossDefeated) {
      this.toast('Sala concluída. E — voltar ao corredor.', 2400);
    } else if (room.boss && this.roomId !== 'hub') {
      this.toast('Algo está esperando no fundo da sala.', 2200);
    }
  }

  /* ---------------- cutscene de chegada à sala do chefe ---------------- */

  startBossEntryCutscene(bossId) {
    this.state = 'bossEntry';
    this.bossEntryTime = 0;
    this.bossEntryId = bossId;
    this.player.locked = true;
    this.player.vx = 0;
    this.player.x = 70;
    this.camera.x = 0;
    this.enemies = [];
    this.projectiles = [];
    this.hazards = [];
    this.roomBanner = 0;
    this.ui.setTopVisible(false);
    this.ui.setTouchVisible(false);
    if (this.audio) {
      this.audio.sfx('door');
      this.audio.sfx('roar');
    }
  }

  updateBossEntry(dt) {
    this.bossEntryTime += dt;
    if (this.bossEntryTime > 1.4 && (this.input.advancePressed || this.input.interactPressed || this.input.attackPressed)) {
      this.finishBossEntryCutscene();
      return;
    }
    if (this.bossEntryTime >= KC_BOSS_ENTRY_DURATION) {
      this.finishBossEntryCutscene();
    }
  }

  finishBossEntryCutscene() {
    if (this.state !== 'bossEntry') return;
    this.state = 'playing';
    this.bossEntryTime = 0;
    if (this.player) {
      this.player.x = 330;
      this.player.locked = false;
      this.player.vx = 0;
    }
    this.camera.x = 0;
    this.ui.setTopVisible(true);
    this.ui.setTouchVisible(!!(this.input && this.input.hasTouch));
    this.roomBanner = 2.2;
    this.toast('A porta trancou. Não tem volta.', 2400);
  }

  getDoorState(door) {
    if (!door) return 'locked';
    const target = ROOMS[door.room];
    // porta trancada: falta a chave do chefe da sala anterior
    if (door.requires && !this.hasKey(door.requires)) return 'locked';
    if (target && target.boss && this.isBossDefeated(target.boss)) return 'cleared';
    return 'available';
  }

  /* Rótulo da chave que falta para abrir esta porta. */
  doorNeedsKey(door) {
    if (!door || !door.requires) return '';
    const def = (typeof BOSS_DEFS !== 'undefined') ? BOSS_DEFS[door.requires] : null;
    if (!def) return '';
    const room = ROOMS[door.room];
    const roomLabel = room ? (room.short || room.name) : '';
    return (def.keyName || 'CHAVE') + (roomLabel ? ' — ' + roomLabel : '');
  }

  getNearDoor() {
    if (!this.room || !this.room.doors || !this.player || this.player.dead) return null;
    if (Math.abs(this.player.y - (this.room.floorY || 300)) > 40) return null;
    let best = null;
    let bestDist = 999;
    this.room.doors.forEach((door) => {
      const d = Math.abs(this.player.x - door.x);
      if (d < 64 && d < bestDist) {
        best = door;
        bestDist = d;
      }
    });
    return best;
  }

  getNearLore() {
    if (!this.player || this.player.dead) return null;
    for (let i = 0; i < this.loreItems.length; i++) {
      const item = this.loreItems[i];
      if (!item.collected && item.near) return item;
    }
    return null;
  }

  tryInteract(player) {
    if (this.state !== 'playing' || !this.room || !player || player.dead) return;
    const lore = this.getNearLore();
    if (lore) {
      lore.collect();
      return;
    }

    if (isBossRoom(this.room.id) && !this.bossActive && player.x < 145) {
      this.enterRoom('hub');
      this.toast('De volta ao corredor.', 1500);
      return;
    }

    const door = this.getNearDoor();
    if (!door) return;
    const state = this.getDoorState(door);
    if (state === 'locked') {
      const need = this.doorNeedsKey(door);
      this.toast(need ? ('Trancada. Precisa da ' + need) : 'Esta porta está trancada.', 3400);
      if (this.audio) this.audio.sfx('error');
      return;
    }
    if (state === 'cleared') {
      this.toast('Sala concluída. Você pode entrar para revisitar o diário.', 2200);
    }
    if (this.audio) this.audio.sfx('door');
    this.enterRoom(door.room);
    if (state === 'cleared') this.toast('Sala concluída. E — voltar ao corredor.', 2200);
  }

  /* ---------------- laço principal ---------------- */

  loop(now) {
    const dt = clamp((now - this.lastTime) / 1000, 0, 0.05);
    this.lastTime = now;
    if (!document.hidden) {
      this.elapsed += dt;
      this.titleTime += dt;
      if (this.state === 'ending') this.endingTime += dt;
      this.update(dt);
      this.render();
      if (this.input) this.input.endFrame();
    }
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    if (this.fadeAlpha > 0) this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 2.4);
    if (this.roomBanner > 0) this.roomBanner = Math.max(0, this.roomBanner - dt);
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      if (this.shakeTime <= 0) this.shakePower = 0;
    }
    if (this.darkness) {
      this.darkness.time -= dt;
      if (this.darkness.time <= 0) this.darkness = null;
    }

    if (['playing', 'bossIntro', 'victory', 'dying', 'lore'].indexOf(this.state) >= 0) {
      this.save.stats.timeMs += dt * 1000;
    }

    if (this.input && this.input.pausePressed) this.handleHotkeys();

    if (this.hitstop > 0 && ['playing', 'bossIntro', 'victory'].indexOf(this.state) >= 0) {
      this.hitstop = Math.max(0, this.hitstop - dt);
      this.updateParticles(dt * 0.25);
      this.updateCamera(dt);
      return;
    }

    if (this.state === 'title' || this.state === 'intro' || this.state === 'paused' ||
        this.state === 'gameover' || this.state === 'ending') {
      return;
    }

    if (this.state === 'entrance') {
      this.updateEntrance(dt);
      return;
    }

    if (this.state === 'bossEntry') {
      this.updateBossEntry(dt);
      return;
    }

    if (this.state === 'playing') {
      this.updatePlaying(dt);
      return;
    }

    if (this.state === 'bossIntro') {
      this.updateBossIntro(dt);
      return;
    }

    if (this.state === 'victory') {
      this.updateVictory(dt);
      return;
    }

    if (this.state === 'lore') {
      this.updateLore(dt);
      return;
    }

    if (this.state === 'dying') {
      this.updateDying(dt);
      return;
    }

    if (this.state === 'cutscene') {
      this.updateCutscene(dt);
    }
  }

  handleHotkeys() {
    const active = this.ui ? this.ui.activeScreen() : null;
    if (this.ui && this.ui.isConfirmOpen()) {
      this.ui.closeConfirm();
      return;
    }
    if (active && active !== 'pause' && active !== 'title' && active !== 'ending' && active !== 'intro' && active !== 'gameover') {
      const name = active;
      this.closeOverlay(name);
      return;
    }
    if (this.state === 'playing') {
      this.pause();
    } else if (this.state === 'paused') {
      this.resume();
    } else if (this.state === 'lore') {
      this.closeLore();
    } else if (this.state === 'intro') {
      this.introSkip();
    } else if (this.state === 'entrance') {
      this.finishEntranceCutscene();
    } else if (this.state === 'bossEntry') {
      this.finishBossEntryCutscene();
    } else if (this.state === 'bossIntro') {
      this.advanceBossIntro();
    } else if (this.state === 'victory') {
      if (this.victory && this.victory.t > 1.0) this.finishVictory();
    } else if (this.state === 'cutscene' && this.cutsceneTime > 5.5) {
      this.finishFinalCutscene(true);
    }
  }

  updatePlaying(dt) {
    if (!this.player) return;
    this.player.update(dt);
    this.updateParticles(dt);
    this.updateCamera(dt);
    if (this.state !== 'playing') return;

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.dead) e.update(dt, this);
    }
    this.enemies = this.enemies.filter(function (e) { return !e.dead; });

    if (this.boss && this.bossActive) {
      this.boss.update(dt);
      if (this.state !== 'playing') return;
    }

    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.dead) p.update(dt, this);
      if (this.state !== 'playing') break;
    }
    this.projectiles = this.projectiles.filter(function (p) { return !p.dead; });

    if (this.state !== 'playing') return;

    for (let i = 0; i < this.hazards.length; i++) {
      const h = this.hazards[i];
      if (!h.dead) h.update(dt, this);
      if (this.state !== 'playing') break;
    }
    this.hazards = this.hazards.filter(function (h) { return !h.dead; });
    if (this.state !== 'playing') return;

    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      if (!p.dead) p.update(dt, this);
    }
    this.pickups = this.pickups.filter(function (p) { return !p.dead; });

    for (let i = 0; i < this.loreItems.length; i++) this.loreItems[i].update(dt);

    this.updateCamera(dt);

    if (!this.bossActive && this.room && this.room.boss && isBossRoom(this.room.id) &&
        !this.isBossDefeated(this.room.boss) && this.player.x >= (this.room.triggerX || 0)) {
      this.startBossIntro(this.room.boss);
      return;
    }

    this.autosaveTimer += dt;
    if (this.autosaveTimer >= 7) {
      this.autosaveTimer = 0;
      this.saveGame('auto');
    }
  }

  updateCamera(dt) {
    if (!this.room) return;
    let target = 0;
    if ((this.bossActive || this.state === 'bossIntro' || this.state === 'victory') && this.room.arena) {
      target = this.room.arena.camX;
    } else if (this.player) {
      const maxCam = Math.max(0, this.room.width - GAME_W);
      target = clamp(this.player.x - GAME_W / 2, 0, maxCam);
    }
    this.camera.x = lerp(this.camera.x, target, clamp(dt * 7.5, 0, 1));
    this.camera.x = clamp(this.camera.x, 0, Math.max(0, this.room.width - GAME_W));
  }

  updateParticles(dt) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.dead) p.update(dt);
    }
    this.particles = this.particles.filter(function (p) { return !p.dead; });
  }

  /* ---------------- chefes ---------------- */

  startBossIntro(id) {
    if (!this.room || !this.room.arena || this.boss) return;
    const def = BOSS_DEFS[id];
    if (!def) return;
    this.boss = new Boss(this, id);
    this.boss.x = this.room.arena.bossX;
    this.boss.y = this.room.floorY;
    this.boss.homeX = this.boss.x;
    this.boss.state = 'enter';
    this.bossActive = false;
    this.state = 'bossIntro';
    this.bossIntro = { t: 0, line: 0, lineAge: 0, guard: 0.55, lines: def.intro.slice() };
    this.enemies = [];
    this.projectiles = [];
    this.hazards = [];
    this.darkness = null;
    this.player.x = clamp(this.player.x, this.room.arena.left + 34, this.room.arena.right - 34);
    this.player.vx = 0;
    this.player.locked = true;
    this.camera.x = this.room.arena.camX;
    this.roomBanner = 0;
    this.ui.setTopVisible(false);
    this.ui.setTouchVisible(!!(this.input && this.input.hasTouch));
    if (this.audio) {
      this.audio.startMusic('boss', true);
      this.audio.sfx('roar');
    }
    this.save.currentRoom = this.room.id;
    this.saveGame('bossIntro');
  }

  updateBossIntro(dt) {
    const bi = this.bossIntro;
    if (!bi || !this.boss) return;
    bi.t += dt;
    bi.lineAge += dt;
    if (bi.guard > 0) bi.guard -= dt;
    this.boss.t += dt;
    this.boss.facePlayer();
    this.updateParticles(dt * 0.4);
    this.updateCamera(dt);

    const line = bi.lines[bi.line] || '';
    const fullAt = line.length / 42 + 0.15;
    if (bi.guard <= 0) {
      const advance = this.input.advancePressed || this.input.attackPressed || this.input.jumpPressed || this.input.interactPressed;
      if (advance) {
        if (bi.lineAge < fullAt) bi.lineAge = fullAt + 0.02;
        else this.advanceBossIntro();
      } else if (bi.lineAge > fullAt + 2.9) {
        this.advanceBossIntro();
      }
    }
  }

  advanceBossIntro() {
    const bi = this.bossIntro;
    if (!bi) return;
    if (bi.line < bi.lines.length - 1) {
      bi.line++;
      bi.lineAge = 0;
      if (this.audio) this.audio.sfx('talk');
    } else {
      this.startBossFight();
    }
  }

  startBossFight() {
    if (!this.boss) return;
    this.bossIntro = null;
    this.state = 'playing';
    this.bossActive = true;
    this.boss.beginFight();
    if (this.player) this.player.locked = false;
    this.ui.setTopVisible(true);
    this.ui.setTouchVisible(!!(this.input && this.input.hasTouch));
    this.roomBanner = 1.6;
    this.toast(this.boss.name + ' — ' + this.boss.title, 2600);
    if (this.audio) this.audio.startMusic('boss', true);
  }

  onBossDefeated(boss) {
    if (!boss || this.state === 'victory') return;
    const firstTime = !this.isBossDefeated(boss.id);
    let ability = null;
    if (firstTime) {
      this.save.bossesDefeated.push(boss.id);
      this.save.maxHearts = Math.min(11, this.save.maxHearts + 1);
      ability = (typeof BOSS_ABILITY !== 'undefined') ? BOSS_ABILITY[boss.id] : null;
      if (ability) this.unlockAbility(ability);
    }
    if (this.player) {
      this.player.locked = true;
      this.player.vx = 0;
      this.player.syncAbilities();
    }
    this.bossActive = false;
    this.state = 'victory';
    this.projectiles = [];
    this.hazards = [];
    this.enemies = [];
    this.darkness = null;
    const abilityText = ability && KC_ABILITY_INFO[ability]
      ? (KC_ABILITY_INFO[ability].name + ' DESBLOQUEADO · ' + KC_ABILITY_INFO[ability].hint)
      : '+1 CORAÇÃO';
    this.victory = {
      t: 0,
      bossId: boss.id,
      name: boss.name,
      keyName: boss.def.keyName,
      final: !!boss.def.final,
      ability: ability,
      abilityText: abilityText
    };
    this.saveGame('bossDefeated');
    if (this.audio) {
      this.audio.sfx('victory');
    }
    this.toast(firstTime ? 'Chefe derrotado. Pegue a chave no chão.' : 'Chefe derrotado.', 3000);
  }

  updateVictory(dt) {
    const v = this.victory;
    if (!v) return;
    v.t += dt;
    this.updateParticles(dt);
    this.updateCamera(dt);
    if (Math.random() < dt * 18) {
      this.spawnParticles(320 + this.camera.x, 120 + rand(-20, 20), 1, '#f2c45a', 'spark');
    }
    const advance = this.input.advancePressed || this.input.attackPressed || this.input.interactPressed || this.input.jumpPressed;
    if (v.t > 1.1 && advance) {
      this.finishVictory();
      return;
    }
    if (v.t >= 3.9) this.finishVictory();
  }

  finishVictory() {
    if (this.state !== 'victory' || !this.victory) return;
    const v = this.victory;
    this.victory = null;
    if (v.final) {
      this.startFinalCutscene();
      return;
    }
    // a chave cai no chão da arena: o jogador precisa recolhê-la
    const room = this.room;
    const floorY = room ? room.floorY : 300;
    const keyX = this.boss ? clamp(this.boss.x, 120, room.width - 120) : 320;
    this.pickups.push(new Pickup(this, 'key', keyX, floorY - 4, { label: v.keyName }));
    this.pendingAbilityText = v.ability ? v.abilityText : '';
    this.state = 'playing';
    this.player.locked = false;
    this.player.vx = 0;
    this.toast('A chave caiu no chão. Pegue-a com o corpo.', 3400);
    this.spawnParticles(keyX, floorY - 20, 14, '#f2c45a', 'spark');
    if (this.audio) this.audio.startMusic('hub', false);
  }

  /* O jogador recolheu a chave do chefe. */
  onKeyPicked(pickup) {
    if (!pickup || !this.room || !this.room.boss) return;
    const bossId = this.room.boss;
    if (this.hasKey(bossId)) return;
    this.save.keys.push(bossId);
    this.saveGame('key');
    const nextRoom = this.keyOpensRoom(bossId);
    const name = pickup.label || (BOSS_DEFS[bossId] ? BOSS_DEFS[bossId].keyName : 'CHAVE');
    if (this.audio) this.audio.sfx('key');
    this.spawnParticles(pickup.x, pickup.y - 16, 20, '#f2c45a', 'ring');
    if (nextRoom && ROOMS[nextRoom]) {
      this.toast(name + ' OBTIDA — a porta ' + (ROOMS[nextRoom].short || '') + ' se abriu. Volte ao corredor.', 4600);
    } else {
      this.toast(name + ' OBTIDA.', 3000);
    }
    if (this.pendingAbilityText) {
      this.toast(this.pendingAbilityText, 3400);
      this.pendingAbilityText = '';
    }
  }

  /* ---------------- final ---------------- */

  startFinalCutscene() {
    this.state = 'cutscene';
    this.cutsceneTime = 0;
    this.cutsceneEvents = { gate: false };
    this.boss = null;
    this.bossActive = false;
    this.room = null;
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.hazards = [];
    this.particles = [];
    this.darkness = null;
    this.save.currentRoom = 'hub';
    this.ui.hideScreens();
    this.ui.setTopVisible(false);
    this.ui.setTouchVisible(false);
    if (this.audio) this.audio.startMusic('ending', false);
  }

  updateCutscene(dt) {
    this.cutsceneTime += dt;
    if (!this.cutsceneEvents.gate && this.cutsceneTime >= 5.35) {
      this.cutsceneEvents.gate = true;
      if (this.audio) this.audio.sfx('gate');
    }
    if (this.input.advancePressed || this.input.interactPressed || this.input.pausePressed) {
      if (this.cutsceneTime > 5.5) {
        this.finishFinalCutscene(true);
        return;
      }
    }
    if (this.cutsceneTime >= 19.2) this.finishFinalCutscene(false);
  }

  finishFinalCutscene(skipped) {
    this.save.finalCutsceneSeen = true;
    this.save.endingsSeen = Math.max(1, this.save.endingsSeen);
    this.save.currentRoom = 'hub';
    this.save.stats.runs += 1;
    this.saveGame('ending');
    this.state = 'ending';
    this.endingTime = 0;
    this.room = null;
    this.player = null;
    this.boss = null;
    this.endingStats = {
      timeMs: Math.round(this.save.stats.timeMs),
      deaths: this.save.stats.deaths,
      kills: this.save.stats.kills,
      bosses: this.save.bossesDefeated.length,
      keys: Math.min(5, this.save.bossesDefeated.length),
      lore: this.save.lore.length
    };
    this.ui.setTopVisible(false);
    this.ui.setTouchVisible(false);
    this.ui.setEnding(this.endingStats, 'A chave girou. O portão abriu. Kennedito atravessou a rua e não olhou para trás. A escola nunca morre. Mas, por enquanto... ela dorme.');
    this.ui.showScreen('ending');
    if (this.audio) this.audio.startMusic('ending', false);
    this.submitRun();
  }

  endingToTitle() {
    this.saveGame('endingTitle');
    this.goTitle();
  }

  submitRun() {
    if (this.runSubmitted) return;
    this.runSubmitted = true;
    const payload = {
      timeMs: Math.max(1, Math.round(this.save.stats.timeMs)),
      deaths: Math.max(0, Math.round(this.save.stats.deaths)),
      kills: Math.max(0, Math.round(this.save.stats.kills)),
      bosses: this.save.bossesDefeated.length,
      lore: this.save.lore.length,
      completedAt: new Date().toISOString()
    };
    if (!this.api || !this.api.token || !this.api.base) {
      this.toast('Tempo salvo localmente. Entre em uma conta para enviar ao ranking.', 3600);
      return;
    }
    this.api.submitRun(payload).then(() => {
      this.toast('Tempo enviado ao ranking da CEPK.', 2800);
    }).catch(() => {
      this.toast('Ranking indisponível. Seu tempo ficou salvo localmente.', 3200);
    });
  }

  /* ---------------- morte, pausa e diário ---------------- */

  onPlayerHurt(dmg, sourceX, sourceY) {
    if (this.audio) this.audio.sfx('hurt');
    this.shake(4.5, 0.22);
    this.hitstop = Math.max(this.hitstop, 0.045);
    if (this.player) this.spawnHitParticles(this.player.x, this.player.y - 20, '#ff7d8f', 11);
  }

  onPlayerDeath() {
    if (this.state === 'dying' || this.state === 'gameover') return;
    this.save.stats.deaths += 1;
    this.saveGame('death');
    this.state = 'dying';
    this.deathTimer = 1.35;
    this.projectiles = [];
    this.hazards = [];
    this.darkness = { time: 1.4, max: 1.4, color: '#ff334d' };
    if (this.player) this.player.locked = true;
    if (this.audio) this.audio.sfx('death');
    this.shake(7, 0.6);
  }

  updateDying(dt) {
    this.deathTimer -= dt;
    if (this.player) this.player.update(dt);
    this.updateParticles(dt);
    this.updateCamera(dt);
    if (this.deathTimer <= 0) {
      this.state = 'gameover';
      this.ui.showScreen('gameover');
      this.ui.setTopVisible(false);
      this.ui.setTouchVisible(false);
      this.saveGame('gameover');
    }
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.saveGame('pause');
    this.ui.showScreen('pause');
    this.ui.setTopVisible(false);
    this.ui.setTouchVisible(false);
    if (this.audio) this.audio.sfx('select');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.ui.hideScreens();
    this.ui.setTopVisible(true);
    this.ui.setTouchVisible(!!(this.input && this.input.hasTouch));
    if (this.input) this.input.releaseAll();
    if (this.audio) this.audio.resume();
  }

  togglePause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  restartRoom() {
    this.ui.hideScreens();
    const id = this.roomId || this.save.currentRoom || 'hub';
    this.enterRoom(ROOMS[id] ? id : 'hub');
    this.toast('Sala reiniciada.', 1600);
  }

  retryRoom() {
    this.ui.hideScreens();
    this.enterRoom(ROOMS[this.roomId] ? this.roomId : 'hub');
  }

  backToHub() {
    this.ui.hideScreens();
    this.enterRoom('hub');
  }

  quitToTitle() {
    this.saveGame('quit');
    this.goTitle();
  }

  collectLore(item) {
    if (!item) return;
    if (this.save.lore.indexOf(item.id) < 0) {
      this.save.lore.push(item.id);
      this.saveGame('lore');
    }
    item.collected = true;
    this.state = 'lore';
    this.lorePage = { item: item, t: 0, guard: 0.4 };
    if (this.player) this.player.locked = true;
    if (this.audio) this.audio.sfx('pickup');
    this.spawnParticles(item.x, item.y - 14, 8, '#c77dff', 'spark');
    this.spawnParticles(item.x, item.y - 14, 6, '#f1e6d0', 'heal');
  }

  updateLore(dt) {
    if (!this.lorePage) {
      this.state = 'playing';
      return;
    }
    this.lorePage.t += dt;
    this.lorePage.guard -= dt;
    this.updateParticles(dt * 0.6);
    const close = this.input.advancePressed || this.input.interactPressed || this.input.attackPressed || this.input.jumpPressed;
    if (this.lorePage.guard <= 0 && (close || this.lorePage.t > 13)) this.closeLore();
  }

  closeLore() {
    if (this.state !== 'lore') return;
    this.state = 'playing';
    this.lorePage = null;
    if (this.player) this.player.locked = false;
    this.saveGame('loreClose');
  }

  /* ---------------- combate e efeitos ---------------- */

  resolvePlayerAttack(player, box, damage, combo) {
    if (!player) return;
    let hitAny = false;
    if (this.boss && !this.boss.dead && !this.boss.dying && aabb(box, this.boss.box)) {
      this.boss.takeDamage(damage, player, box.x + box.w / 2, box.y + box.h / 2);
      hitAny = true;
    }
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) continue;
      if (aabb(box, e.box)) {
        e.hurt(damage, player);
        this.spawnHitParticles(e.x, e.y - e.h / 2, '#e9fff2', 6);
        hitAny = true;
      }
    }
    if (hitAny) {
      this.shake(2.5, 0.13);
      if (this.audio) this.audio.sfx('hit');
      this.hitstop = Math.max(this.hitstop, 0.028);
    }
    const cx = player.x + player.facing * (combo === 2 ? 31 : 24);
    const cy = player.y - (combo === 2 ? 29 : 24);
    this.particles.push(new Particle({
      kind: 'slash',
      x: cx,
      y: cy,
      life: 0.18,
      size: combo === 2 ? 4 : 2.5,
      color: combo === 2 ? '#fff1ae' : '#b8ffd6',
      angle: player.facing === 1 ? 0 : Math.PI,
      additive: true
    }));
  }

  doWarCry(player) {
    if (!player) return;
    this.audio && this.audio.sfx('roar');
    this.shake(6.5, 0.45);
    this.projectiles = this.projectiles.filter(function (p) { return p.owner === 'player'; });
    this.hazards = [];
    this.spawnParticles(player.x, player.y - 24, 26, '#f2c45a', 'ring');
    this.spawnParticles(player.x, player.y - 24, 22, '#58ff9d', 'spark');
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.dead && dist(e.x, e.y - e.h / 2, player.x, player.y - 20) < 190) {
        e.hurt(18, player);
      }
    }
    if (this.boss && !this.boss.dead && !this.boss.dying &&
        dist(this.boss.x, this.boss.y - this.boss.h / 2, player.x, player.y - 20) < 220) {
      this.boss.takeDamage(20, player, this.boss.x, this.boss.y - 40);
    }
    this.toast('GRITO DE GUERRA!', 1300);
  }

  onEnemyKilled(enemy) {
    if (!enemy) return;
    this.save.stats.kills += 1;
    if (this.player && this.player.hp < this.player.maxHp && Math.random() < 0.17 && this.pickups.length < 5) {
      const roomFloor = this.room ? this.room.floorY : 300;
      this.pickups.push(new Pickup(this, 'heart', enemy.x, roomFloor - 4));
    }
  }

  spawnEnemy(type, x, y, opts) {
    if (!this.room || this.enemies.length >= 10) return null;
    const e = new Enemy(this, type, x, y, opts);
    this.enemies.push(e);
    return e;
  }

  spawnProjectile(opts) {
    if (!this.room) return null;
    if (this.projectiles.length > 180) this.projectiles.shift();
    const p = new Projectile(Object.assign({}, opts, { game: this }));
    this.projectiles.push(p);
    return p;
  }

  spawnHazard(opts) {
    if (!this.room) return null;
    if (this.hazards.length > 32) this.hazards.shift();
    const h = new Hazard(Object.assign({}, opts, { game: this }));
    this.hazards.push(h);
    return h;
  }

  spawnParticles(x, y, count, color, kind) {
    if (this.particles.length > 520) return;
    const n = Math.max(1, Math.round(count || 6));
    if (kind === 'ring') {
      this.particles.push(new Particle({
        kind: 'ring', x: x, y: y, life: 0.75, maxLife: 0.75, size: 8,
        color: color || '#58ff9d', additive: true
      }));
      for (let i = 0; i < Math.min(22, n); i++) {
        const a = rand(0, TAU);
        const sp = rand(60, 190);
        this.particles.push(new Particle({
          kind: 'dot', x: x + Math.cos(a) * rand(2, 10), y: y + Math.sin(a) * rand(2, 10),
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, gravity: 40, drag: 0.92,
          life: rand(0.35, 0.75), size: rand(1, 2.5), color: color, additive: true
        }));
      }
      return;
    }
    for (let i = 0; i < n && this.particles.length < 520; i++) {
      const a = rand(0, TAU);
      const sp = kind === 'spark' ? rand(50, 185) : rand(20, 120);
      const p = new Particle({
        x: x + rand(-3, 3),
        y: y + rand(-3, 3),
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (kind === 'heal' ? rand(10, 45) : rand(0, 40)),
        life: kind === 'heal' ? rand(0.7, 1.15) : rand(0.32, 0.85),
        size: rand(1, kind === 'enemy' ? 3.2 : 2.2),
        color: color || '#fff',
        gravity: kind === 'spark' ? 60 : (kind === 'heal' ? -8 : 260),
        drag: 0.94,
        kind: kind === 'spark' ? 'spark' : (kind === 'enemy' ? (Math.random() < 0.5 ? 'square' : 'dot') : (kind === 'heal' ? 'heal' : 'dot')),
        additive: kind === 'spark' || kind === 'dash',
        angle: rand(0, TAU),
        spin: rand(-7, 7)
      });
      this.particles.push(p);
    }
  }

  spawnHitParticles(x, y, color, count) {
    this.spawnParticles(x, y, count || 8, color || '#fff', 'spark');
    for (let i = 0; i < Math.floor((count || 8) / 2); i++) {
      this.particles.push(new Particle({
        kind: 'square', x: x, y: y, vx: rand(-120, 120), vy: rand(-130, 40),
        gravity: 380, life: rand(0.25, 0.55), size: rand(1.5, 3),
        color: color || '#fff', angle: rand(0, TAU), spin: rand(-8, 8)
      }));
    }
  }

  spawnDamageText(x, y, amount, color) {
    this.particles.push(new Particle({
      kind: 'text', x: x, y: y, vx: rand(-12, 12), vy: -50, gravity: 85,
      life: 0.72, size: 9, text: String(amount), color: color || '#fff'
    }));
  }

  spawnDashGhost(player) {
    this.particles.push(new Particle({
      kind: 'ghost', x: player.x, y: player.y, life: 0.26,
      facing: player.facing, state: 'dash', scale: 1, alpha: 0.85
    }));
  }

  spawnBossGhost(boss) {
    if (!boss) return;
    this.particles.push(new Particle({
      kind: 'bossghost', x: boss.x, y: boss.y, life: 0.24,
      facing: boss.facing, phase: boss.phase, scale: 1, alpha: 0.7,
      bossId: boss.id
    }));
  }

  clearBossDanger() {
    this.projectiles = this.projectiles.filter(function (p) { return p.owner === 'player'; });
    this.hazards = [];
  }

  shake(power, duration) {
    this.shakePower = Math.max(this.shakePower, power || 2);
    this.shakeTime = Math.max(this.shakeTime, duration || 0.15);
  }

  setDarkness(duration, color) {
    this.darkness = {
      time: duration || 2,
      max: duration || 2,
      color: color || '#35e08b'
    };
  }

  toast(text, ms) {
    if (this.ui) this.ui.toast(text, ms);
  }

  toastOnce(key, text, ms) {
    if (this.toastSeen.has(key)) return;
    this.toastSeen.add(key);
    this.toast(text, ms);
  }

  /* ---------------- desenho ---------------- */

  render() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, GAME_W, GAME_H);

    if (this.state === 'title' || this.state === 'intro') {
      drawGateScene(ctx, this.titleTime, 'title');
    } else if (this.state === 'entrance') {
      drawEntranceScene(ctx, this.entranceTime);
    } else if (this.state === 'bossEntry') {
      drawBossEntryScene(ctx, this.bossEntryTime, this.room, this.bossEntryId, this);
    } else if (this.state === 'cutscene') {
      drawGateScene(ctx, this.cutsceneTime, 'cutscene');
    } else if (this.state === 'ending') {
      drawEndingBackground(ctx, this.endingTime);
    } else if (this.room) {
      this.drawRoom();
    }

    if (this.state === 'entrance') this.drawEntranceOverlay();
    if (this.state === 'cutscene') this.drawCutsceneOverlay();
    if (this.state === 'ending') this.drawEndingBackgroundOverlay();

    if (this.room && ['playing', 'paused', 'bossIntro', 'victory', 'lore', 'dying', 'gameover'].indexOf(this.state) >= 0) {
      this.drawHUD();
    }
    if (this.state === 'bossIntro') this.drawBossIntroOverlay();
    if (this.state === 'victory') this.drawVictoryOverlay();
    if (this.state === 'lore') this.drawLoreOverlay();

    if (this.darkness) {
      const p = clamp(this.darkness.time / Math.max(0.001, this.darkness.max), 0, 1);
      ctx.save();
      ctx.globalAlpha = 0.45 * p;
      ctx.fillStyle = this.darkness.color || '#35e08b';
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      ctx.restore();
    }

    if (this.fadeAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(this.fadeAlpha, 0, 1);
      ctx.fillStyle = '#02060a';
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      ctx.restore();
    }

    if (this.room && this.player && this.player.hp <= 2 && this.state === 'playing') {
      ctx.save();
      const pulse = 0.12 + Math.sin(this.elapsed * 6) * 0.06;
      const g = ctx.createRadialGradient(GAME_W / 2, GAME_H / 2, 120, GAME_W / 2, GAME_H / 2, 400);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(255,40,70,' + pulse.toFixed(3) + ')');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      ctx.restore();
    }
  }

  drawRoom() {
    const ctx = this.ctx;
    const camX = this.camera.x;
    const t = this.elapsed;
    ctx.save();
    if (this.shakeTime > 0 && this.shakePower > 0) {
      const k = this.shakePower * Math.min(1, this.shakeTime * 2.5);
      ctx.translate(rand(-k, k), rand(-k, k) * 0.6);
    }
    drawRoomBackground(ctx, this.room, camX, t, this);
    if (this.room.platforms) {
      for (let i = 0; i < this.room.platforms.length; i++) {
        drawPlatform(ctx, this.room.platforms[i], camX, t, this.room);
      }
    }
    // camada de mundo
    ctx.save();
    ctx.translate(-camX, 0);
    for (let i = 0; i < this.hazards.length; i++) this.hazards[i].draw(ctx, t);
    for (let i = 0; i < this.enemies.length; i++) this.enemies[i].draw(ctx, t);
    for (let i = 0; i < this.pickups.length; i++) this.pickups[i].draw(ctx, t);
    for (let i = 0; i < this.loreItems.length; i++) this.loreItems[i].draw(ctx, t);
    for (let i = 0; i < this.projectiles.length; i++) this.projectiles[i].draw(ctx, 0, 0);
    if (this.boss) this.boss.draw(ctx, 0, 0);
    if (this.player) this.player.draw(ctx, 0, 0);
    for (let i = 0; i < this.particles.length; i++) this.particles[i].draw(ctx);
    ctx.restore();
    drawRoomForeground(ctx, this.room, camX, t, this);
    ctx.restore();
  }

  drawHUD() {
    const ctx = this.ctx;
    const p = this.player;
    if (!p) return;

    // corações
    const max = Math.max(1, p.maxHp);
    for (let i = 0; i < max; i++) {
      drawHeart(ctx, 15 + i * 10, 19, 7, i < p.hp, '#ff5d7a');
    }
    // chaves
    drawKey(ctx, 18, 38, 0.55, this.elapsed, '#f2c45a');
    drawOutlinedText(ctx, (this.save.keys ? this.save.keys.length : 0) + '/5', 33, 39, 8, '#f2c45a', '#07110b', 'left');
    // habilidades
    const abilities = this.save.abilities || [];
    let ax = 52;
    abilities.forEach(function (id) {
      const info = KC_ABILITY_INFO[id];
      if (!info) return;
      const tag = id === 'book' ? 'LIVRO' : (id === 'airDash' ? 'DASH' : (id === 'warcry' ? 'GRITO' : 'PULO2'));
      ctx.save();
      ctx.globalAlpha = 0.9;
      drawOutlinedText(ctx, tag, ax, 39, 7, '#b8ffd6', '#07110b', 'left');
      ctx.restore();
      ax += tag.length * 5 + 6;
    });
    // tempo
    drawOutlinedText(ctx, fmtTimeMs(this.save.stats.timeMs), GAME_W - 14, 39, 8, '#9fd8bd', '#07110b', 'right');

    // objetivo atual
    const objective = this.currentObjective();
    if (objective) {
      ctx.save();
      ctx.globalAlpha = 0.82;
      drawOutlinedText(ctx, 'PRÓXIMO: ' + objective, GAME_W / 2, GAME_H - 10, 7, '#7fbf9d', '#07110b');
      ctx.restore();
    }

    // faixa do nome da sala
    if (this.roomBanner > 0 && this.room) {
      const alpha = clamp(this.roomBanner / 0.7, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawOutlinedText(ctx, this.room.name, GAME_W / 2, 30, 11, '#d9ffe9', '#04100b');
      ctx.restore();
    }

    // barra do chefe
    if (this.boss && this.bossActive) {
      const b = this.boss;
      const w = 300;
      const x = GAME_W / 2 - w / 2;
      const y = 52;
      ctx.save();
      ctx.fillStyle = 'rgba(3,10,7,0.72)';
      fillRoundRect(ctx, x - 3, y - 3, w + 6, 12, 2, 'rgba(3,10,7,0.72)');
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x, y, w, 6);
      const pct = clamp(b.hp / b.maxHp, 0, 1);
      ctx.fillStyle = b.color || '#58ff9d';
      ctx.fillRect(x, y, w * pct, 6);
      if (b.phase === 2) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x + w / 2 - 1, y - 2, 2, 10);
      }
      drawOutlinedText(ctx, b.name, GAME_W / 2, y - 9, 8, b.color || '#d9ffe9', '#04100b');
      ctx.restore();
    }

    // avisos de interação
    const door = this.getNearDoor();
    if (door && this.state === 'playing') {
      const dx = door.x - this.camera.x;
      const doorState = this.getDoorState(door);
      let label = 'E — ENTRAR';
      let color = '#ffe9a8';
      if (doorState === 'locked') {
        label = 'TRANCADA — ' + (this.doorNeedsKey(door) || 'precisa da chave');
        color = '#ff9a9a';
      } else if (doorState === 'cleared') {
        label = 'E — REVISITAR';
        color = '#9fd8bd';
      }
      ctx.save();
      ctx.globalAlpha = 0.92;
      drawOutlinedText(ctx, label, dx, (this.room.floorY || 300) - 118, doorState === 'locked' ? 7 : 8, color, '#04100b');
      ctx.restore();
    }
    if (isBossRoom(this.room.id) && !this.bossActive && p.x < 190 && this.state === 'playing') {
      drawOutlinedText(ctx, 'E — VOLTAR AO CORREDOR', 92, (this.room.floorY || 300) - 108, 8, '#9fd8bd', '#04100b');
    }
    if (this.getNearLore() && this.state === 'playing') {
      drawOutlinedText(ctx, 'E — LER', p.x - this.camera.x, p.y - 62, 8, '#e2b6ff', '#04100b');
    }
    // chave no chão
    for (let i = 0; i < this.pickups.length; i++) {
      const pk = this.pickups[i];
      if (pk.type === 'key' && !pk.dead) {
        drawOutlinedText(ctx, 'CHAVE', pk.x - this.camera.x, pk.y - 34, 7, '#f2c45a', '#07110b');
      }
    }
  }

  /* ---------------- overlay da cutscene de entrada ---------------- */

  drawEntranceOverlay() {
    const ctx = this.ctx;
    const t = this.entranceTime;
    // tarjas
    ctx.save();
    ctx.fillStyle = '#02060a';
    ctx.fillRect(0, 0, GAME_W, 24);
    ctx.fillRect(0, GAME_H - 24, GAME_W, 24);
    ctx.restore();
    let active = null;
    for (let i = 0; i < KC_ENTRANCE_LINES.length; i++) {
      const l = KC_ENTRANCE_LINES[i];
      if (t >= l.start && t < l.end) { active = l; break; }
    }
    if (active) {
      drawWrappedCentered(ctx, active.text, GAME_W / 2, GAME_H - 42, GAME_W - 90, 15, 10, '#e8fff2', '#04100b');
    }
    // cartela do jogo
    const cardIn = clamp((t - 9.4) / 1.2, 0, 1);
    if (cardIn > 0) {
      ctx.save();
      ctx.globalAlpha = cardIn;
      drawOutlinedText(ctx, 'KENNEDITO', GAME_W / 2, 62, 20, '#d9ffe9', '#04100b');
      drawOutlinedText(ctx, 'A ESCOLA QUE NUNCA MORRE', GAME_W / 2, 84, 9, '#8affc1', '#04100b');
      ctx.restore();
    }
    if (t > 2 && Math.floor(t * 2) % 2 === 0) {
      drawOutlinedText(ctx, 'ENTER — PULAR', GAME_W - 16, 14, 7, '#7fbf9d', '#04100b', 'right');
    }
  }

  /* Texto do objetivo atual, mostrado no HUD. */
  currentObjective() {
    if (this.room && this.room.id === 'hub') {
      const next = this.nextLockedRoom();
      if (next && ROOMS[next]) return ROOMS[next].short || ROOMS[next].name;
      if (this.save.bossesDefeated.length >= 5) return 'SAÍDA';
      return null;
    }
    if (this.room && this.room.boss && !this.isBossDefeated(this.room.boss)) {
      return 'DERROTE ' + (this.room.short || 'O CHEFE');
    }
    return null;
  }

  drawBossIntroOverlay() {
    const ctx = this.ctx;
    const bi = this.bossIntro;
    if (!bi || !this.boss) return;
    const boss = this.boss;
    const t = this.elapsed;
    ctx.save();
    ctx.fillStyle = 'rgba(2,8,6,0.82)';
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    drawBossPortrait(ctx, boss.id, 30, 62, 96, 130, t, boss.phase);
    drawOutlinedText(ctx, boss.name, 148, 86, 14, boss.color || '#ffe9a8', '#04100b', 'left');
    drawOutlinedText(ctx, boss.title, 148, 106, 9, '#b8ffd6', '#04100b', 'left');
    ctx.strokeStyle = withAlpha(boss.color || '#58ff9d', 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(146, 118);
    ctx.lineTo(GAME_W - 30, 118);
    ctx.stroke();
    const line = bi.lines[bi.line] || '';
    const shown = line.slice(0, Math.max(0, Math.floor(bi.lineAge * 42)));
    drawWrappedCentered(ctx, shown, (148 + GAME_W - 30) / 2, 150, GAME_W - 200, 15, 10, '#e8fff2', '#04100b');
    if (Math.floor(t * 2) % 2 === 0) {
      drawOutlinedText(ctx, 'ENTER / ESPAÇO — CONTINUAR', GAME_W / 2, GAME_H - 26, 8, '#7fbf9d', '#04100b');
    }
    ctx.restore();
  }

  drawVictoryOverlay() {
    const ctx = this.ctx;
    const v = this.victory;
    if (!v) return;
    const t = this.elapsed;
    ctx.save();
    ctx.fillStyle = 'rgba(2,10,6,0.78)';
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    const pulse = 1 + Math.sin(t * 3) * 0.04;
    ctx.save();
    ctx.translate(GAME_W / 2, 118);
    ctx.scale(pulse, pulse);
    drawKey(ctx, 0, 0, 1.25, t, '#f2c45a');
    ctx.restore();
    drawOutlinedText(ctx, 'CHEFE DERROTADO', GAME_W / 2, 168, 13, '#ffe9a8', '#04100b');
    drawOutlinedText(ctx, v.name, GAME_W / 2, 188, 10, '#d9ffe9', '#04100b');
    drawOutlinedText(ctx, (v.keyName || 'CHAVE') + ' OBTIDA', GAME_W / 2, 212, 10, '#f2c45a', '#04100b');
    if (v.ability) {
      drawOutlinedText(ctx, v.abilityText, GAME_W / 2, 234, 8, '#b8ffd6', '#04100b');
    }
    if (Math.floor(t * 2) % 2 === 0) {
      drawOutlinedText(ctx, 'ENTER — CONTINUAR', GAME_W / 2, GAME_H - 28, 8, '#7fbf9d', '#04100b');
    }
    ctx.restore();
  }

  drawLoreOverlay() {
    const ctx = this.ctx;
    const page = this.lorePage;
    if (!page || !page.item) return;
    const item = page.item;
    ctx.save();
    ctx.fillStyle = 'rgba(4,6,10,0.86)';
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    const w = 460;
    const h = 210;
    const x = GAME_W / 2 - w / 2;
    const y = GAME_H / 2 - h / 2;
    ctx.fillStyle = 'rgba(24,20,14,0.96)';
    fillRoundRect(ctx, x, y, w, h, 4, 'rgba(24,20,14,0.96)');
    ctx.strokeStyle = 'rgba(199,125,255,0.6)';
    ctx.lineWidth = 1.2;
    fillRoundRect(ctx, x, y, w, h, 4, 'rgba(0,0,0,0)');
    ctx.stroke();
    bracketCorner(ctx, x + 4, y + 4, w - 8, h - 8, 'rgba(199,125,255,0.4)', 12, 1);
    drawOutlinedText(ctx, item.title, GAME_W / 2, y + 26, 11, '#e2b6ff', '#0b0612');
    ctx.strokeStyle = 'rgba(199,125,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(x + 26, y + 40);
    ctx.lineTo(x + w - 26, y + 40);
    ctx.stroke();
    drawWrappedCentered(ctx, item.text, GAME_W / 2, y + 96, w - 60, 17, 10, '#e8fff2', '#0b0612');
    if (Math.floor(this.elapsed * 2) % 2 === 0) {
      drawOutlinedText(ctx, 'E / ENTER — FECHAR', GAME_W / 2, y + h - 18, 8, '#9fb8a8', '#0b0612');
    }
    ctx.restore();
  }

  drawCutsceneOverlay() {
    const ctx = this.ctx;
    const t = this.cutsceneTime;
    // tarjas de cinema
    ctx.save();
    ctx.fillStyle = '#02060a';
    ctx.fillRect(0, 0, GAME_W, 26);
    ctx.fillRect(0, GAME_H - 26, GAME_W, 26);
    ctx.restore();
    let active = null;
    for (let i = 0; i < KC_FINAL_LINES.length; i++) {
      const l = KC_FINAL_LINES[i];
      if (t >= l.start && t < l.end) { active = l; break; }
    }
    if (active) {
      drawWrappedCentered(ctx, active.text, GAME_W / 2, GAME_H - 44, GAME_W - 80, 15, 10, '#e8fff2', '#04100b');
    }
    if (t > 6 && Math.floor(t * 2) % 2 === 0) {
      drawOutlinedText(ctx, 'ENTER — PULAR', GAME_W - 16, 16, 7, '#7fbf9d', '#04100b', 'right');
    }
  }

  drawEndingBackground(ctx, t) {
    drawGateScene(ctx, 12 + t * 0.2, 'cutscene');
    ctx.save();
    ctx.fillStyle = 'rgba(2,8,6,0.55)';
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.restore();
  }

  drawEndingBackgroundOverlay() {
    const ctx = this.ctx;
    drawOutlinedText(ctx, 'A ESCOLA NUNCA MORRE', GAME_W / 2, 48, 13, '#d9ffe9', '#04100b');
  }

  /* ---------------- nuvem / contas / ranking ---------------- */

  updateCloudBadge() {
    if (!this.ui) return;
    if (this.syncing) {
      this.ui.setCloudBadge('SINCRONIZANDO', 'syncing');
      return;
    }
    if (!this.api || !this.api.enabled || !this.api.token) {
      this.ui.setCloudBadge('LOCAL', '');
      return;
    }
    if (this.api.online) this.ui.setCloudBadge('NUVEM', 'online');
    else this.ui.setCloudBadge('OFFLINE', 'offline');
  }

  async checkCloud() {
    if (!this.api || !this.api.enabled) {
      this.updateCloudBadge();
      return;
    }
    try {
      await this.api.health();
      this.cloudSeen = true;
    } catch (e) {
      this.cloudSeen = false;
    }
    if (this.api.token) {
      try {
        const data = await this.api.me();
        this.cloudSeen = true;
        if (data && data.account) this.ui.setAccountLogged(data.account);
        if (data && data.save) {
          const cloud = sanitizeSave(data.save);
          if (this.shouldUseCloud(cloud)) this.adoptCloudSave(cloud);
          else this.scheduleCloudSync(600);
        }
      } catch (e) {
        // token inválido ou servidor fora do ar: segue no modo local
      }
    }
    this.updateCloudBadge();
  }

  scheduleCloudSync(delay) {
    if (!this.api || !this.api.enabled || !this.api.token) return;
    if (this.cloudSyncTimer) clearTimeout(this.cloudSyncTimer);
    this.cloudSyncTimer = setTimeout(() => {
      this.cloudSyncTimer = null;
      this.syncCloud(false);
    }, delay || 2500);
  }

  async syncCloud(manual) {
    if (!this.api || !this.api.enabled) {
      if (manual) this.ui.setAccountStatus('Servidor indisponível. O progresso fica salvo neste dispositivo.', 'error');
      return;
    }
    if (!this.api.token) {
      if (manual) this.ui.setAccountStatus('Entre numa conta para sincronizar com a nuvem.', 'error');
      return;
    }
    if (this.syncing) return;
    this.syncing = true;
    this.updateCloudBadge();
    try {
      await this.api.putSave(this.save);
      if (manual) this.ui.setAccountStatus('Progresso sincronizado com a nuvem.', 'success');
    } catch (e) {
      if (manual) this.ui.setAccountStatus('Não foi possível sincronizar agora. O progresso local está salvo.', 'error');
    } finally {
      this.syncing = false;
      this.updateCloudBadge();
    }
  }

  async accountSubmit(mode, name, pin) {
    if (this.accountBusy || !this.api) return;
    this.accountBusy = true;
    this.ui.setAccountBusy(true, mode === 'create' ? 'CRIANDO...' : 'ENTRANDO...');
    try {
      let data = null;
      if (mode === 'create') {
        data = await this.api.createAccount({ name: name, pin: pin, save: this.save });
      } else {
        data = await this.api.login({ name: name, pin: pin });
      }
      this.cloudSeen = true;
      if (data && data.account) this.ui.setAccountLogged(data.account);
      if (data && data.save) {
        const cloud = sanitizeSave(data.save);
        if (this.shouldUseCloud(cloud)) this.adoptCloudSave(cloud);
        else await this.api.putSave(this.save);
      }
      this.ui.setAccountStatus('Conta conectada. O progresso será sincronizado automaticamente.', 'success');
      this.toast('Conta conectada na nuvem.', 2400);
    } catch (e) {
      const msg = (e && e.message) ? e.message : 'Não foi possível conectar ao servidor.';
      this.ui.setAccountStatus(msg, 'error');
    } finally {
      this.accountBusy = false;
      this.ui.setAccountBusy(false);
      this.updateCloudBadge();
    }
  }

  async logout() {
    if (this.api) {
      try { await this.api.logout(); } catch (e) { /* ignora */ }
    }
    this.ui.setAccountLogged(null);
    this.ui.setAccountStatus('Você saiu da conta. O progresso continua salvo neste dispositivo.', 'info');
    this.updateCloudBadge();
  }

  syncNow() {
    this.saveGame('manual');
    this.syncCloud(true);
  }

  openAccount(from) {
    this.overlayReturn = from || 'title';
    this.ui.showScreen('account');
    if (this.api && this.api.token && this.api.account) {
      this.ui.setAccountLogged(this.api.account);
      this.ui.setAccountStatus('Conectado como ' + this.api.account.name + '.', 'success');
    } else {
      this.ui.setAccountLogged(null);
      if (this.api && this.api.enabled) {
        this.ui.setAccountStatus('Crie uma conta para guardar o progresso na nuvem e entrar no ranking.', 'info');
      } else {
        this.ui.setAccountStatus('Servidor indisponível. O progresso fica salvo apenas neste dispositivo.', 'info');
      }
    }
  }

  closeAccount() {
    const back = this.overlayReturn || 'title';
    this.ui.showScreen(back === 'pause' ? 'pause' : (back === 'ending' ? 'ending' : 'title'));
  }

  openRanking(from) {
    this.overlayReturn = from || 'title';
    this.ui.showScreen('ranking');
    this.refreshRanking();
  }

  async refreshRanking() {
    const local = this.loadLocalRuns();
    let entries = local.map(function (r, i) {
      return { rank: i + 1, name: r.name, timeMs: r.timeMs, deaths: r.deaths };
    });
    if (this.api && this.api.enabled) {
      try {
        const data = await this.api.leaderboard(10);
        const rows = (data && (data.entries || data.runs || data.leaderboard)) || [];
        const remote = rows.map(function (r, i) {
          return {
            rank: r.rank || i + 1,
            name: r.name || '???',
            timeMs: Number(r.timeMs != null ? r.timeMs : (r.time_ms || 0)),
            deaths: Number(r.deaths || 0)
          };
        });
        entries = remote.concat(entries);
        entries.sort(function (a, b) { return a.timeMs - b.timeMs; });
        entries = entries.slice(0, 10);
        entries.forEach(function (e, i) { e.rank = i + 1; });
        this.ui.setRanking(entries, this.api.account ? this.api.account.name : null);
        return;
      } catch (e) {
        this.ui.setRanking(entries, this.api.account ? this.api.account.name : null);
        this.ui.setRankingStatus('Ranking online indisponível — mostrando os tempos salvos neste dispositivo.', 'error');
        return;
      }
    }
    this.ui.setRanking(entries, null);
    this.ui.setRankingStatus('Ranking online indisponível — mostrando os tempos salvos neste dispositivo.', 'info');
  }

  openControls(from) {
    this.overlayReturn = from || 'title';
    this.ui.showScreen('controls');
  }

  openJournal() {
    this.overlayReturn = 'pause';
    this.ui.setJournal(this.save);
    this.ui.showScreen('journal');
  }

  closeOverlay() {
    const back = this.overlayReturn || 'title';
    this.ui.showScreen(back === 'pause' ? 'pause' : (back === 'ending' ? 'ending' : 'title'));
  }

  toggleSound() {
    if (!this.audio) return;
    this.audio.init();
    const muted = this.audio.toggleMute();
    this.save.settings.muted = muted;
    this.ui.setSound(muted);
    this.saveGame('sound');
  }

  /* ---------------- tempos locais ---------------- */

  loadLocalRuns() {
    try {
      const raw = safeStorageGet(KC_LOCAL_RUNS_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  saveLocalRuns(list) {
    safeStorageSet(KC_LOCAL_RUNS_KEY, JSON.stringify(list));
  }

  submitRun() {
    if (this.runSubmitted) return;
    this.runSubmitted = true;
    const payload = {
      timeMs: Math.max(1, Math.round(this.save.stats.timeMs)),
      deaths: Math.max(0, Math.round(this.save.stats.deaths)),
      kills: Math.max(0, Math.round(this.save.stats.kills)),
      bosses: this.save.bossesDefeated.length,
      lore: this.save.lore.length,
      completedAt: new Date().toISOString()
    };
    const local = this.loadLocalRuns();
    local.push({
      id: Date.now(),
      name: (this.api && this.api.account && this.api.account.name) || 'Visitante',
      timeMs: payload.timeMs,
      deaths: payload.deaths
    });
    local.sort(function (a, b) { return a.timeMs - b.timeMs; });
    this.saveLocalRuns(local.slice(0, 50));
    if (this.api && this.api.enabled && this.api.token) {
      this.api.submitRun(payload).then(function () {
        this.toast('Tempo enviado ao ranking da CEPK.', 2600);
      }.bind(this)).catch(function () {
        this.toast('Ranking indisponível — tempo salvo só neste dispositivo.', 3000);
      }.bind(this));
    } else {
      this.toast('Tempo salvo neste dispositivo. Entre numa conta para enviar ao ranking.', 3600);
    }
  }
}

window.KC_GAME = new Game();
