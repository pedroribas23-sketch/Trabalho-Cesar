/* =========================================================
   KENNEDITO — mapa da escola: corredor, salas, quadra e lab
   ========================================================= */
'use strict';

const LORE_ENTRIES = [
  {
    id: 'hub_ata',
    title: 'Ata da Reunião — 12/03/1998',
    text: '“Fica decidido que a CEPK não será fechada. Nem agora, nem nunca. Os alunos que não puderem ir para casa permanecerão em suas salas. A escola cuidará deles.”'
  },
  {
    id: 'sala5_giz',
    title: 'Diário da Sala 5',
    text: '“O Mestre nunca deixa ninguém sair antes do sinal. O problema é que o sinal parou de tocar faz vinte e seis anos. Ele ainda acha que estamos no meio da prova.”'
  },
  {
    id: 'sala6_log',
    title: 'Log do Sistema — 23:47',
    text: '“Presença detectada: 1. Presenças esperadas: 0. O Professor dos Programas solicitou permissão para excluir o visitante. Permissão negada. A escola precisa de mais um.”'
  },
  {
    id: 'sala7_espelho',
    title: 'A Última Foto da Sala 7',
    text: '“O espelho não reflete mais ninguém. O Feiura ainda se olha nele todas as noites. Às vezes, o reflexo pede para ele sair. Ele nunca sai.”'
  },
  {
    id: 'quadra_placar',
    title: 'Placar da Quadra',
    text: '“CEPK 66 x 0 VISITANTES. O Professor Esquecido não aceita fim de jogo. O apito só toca quando alguém cai. O jogo nunca terminou.”'
  },
  {
    id: 'lab_atlas',
    title: 'Projeto Atlas — Documento Final',
    text: '“Se a escola não pode viver, então ela será mantida. Memórias, salas, professores, tudo. A chave mestra fica com o Guardião. Ninguém entra. Ninguém sai. Até que alguém derrote o protocolo.”'
  }
];

const LORE_BY_ID = {};
LORE_ENTRIES.forEach(function (l) { LORE_BY_ID[l.id] = l; });

const ROOMS = {
  hub: {
    id: 'hub',
    name: 'CEPK — Corredor Principal',
    short: 'CORREDOR',
    bg: 'hub',
    width: 2400,
    floorY: 300,
    spawn: { x: 120, y: 300 },
    loreId: 'hub_ata',
    lore: { x: 1180, y: 300 },
    platforms: [
      { x: 700, y: 272, w: 92, h: 28 },
      { x: 1540, y: 262, w: 66, h: 38 }
    ],
    doors: [
      { id: 'sala1', room: 'sala1', x: 560, label: 'SALA 5', color: '#d7a64a' },
      { id: 'sala2', room: 'sala2', x: 980, label: 'SALA 6', color: '#4fa3ff', requires: 'mestre' },
      { id: 'sala3', room: 'sala3', x: 1400, label: 'SALA 7', color: '#a45bd8', requires: 'programas' },
      { id: 'quadra', room: 'quadra', x: 1820, label: 'QUADRA', color: '#e05252', requires: 'feiura' },
      { id: 'lab', room: 'lab', x: 2240, label: 'LAB', color: '#35e08b', requires: 'esquecido' }
    ]
  },

  sala1: {
    id: 'sala1',
    name: 'Sala 5 — O Mestre das Aulas',
    short: 'SALA 5',
    bg: 'classroom',
    boss: 'mestre',
    width: 1620,
    floorY: 300,
    spawn: { x: 80, y: 300 },
    triggerX: 850,
    arena: { left: 880, right: 1520, bossX: 1360, camX: 880 },
    loreId: 'sala5_giz',
    lore: { x: 600, y: 300 },
    platforms: [
      { x: 280, y: 264, w: 64, h: 36 },
      { x: 520, y: 226, w: 72, h: 30 },
      { x: 1010, y: 252, w: 62, h: 32 },
      { x: 1410, y: 240, w: 68, h: 34 }
    ],
    enemies: [
      { type: 'eco', x: 430, y: 300 },
      { type: 'bug', x: 690, y: 300 }
    ]
  },

  sala2: {
    id: 'sala2',
    name: 'Sala 6 — Professor dos Programas',
    short: 'SALA 6',
    bg: 'classroom',
    boss: 'programas',
    width: 1620,
    floorY: 300,
    spawn: { x: 80, y: 300 },
    triggerX: 850,
    arena: { left: 880, right: 1520, bossX: 1360, camX: 880 },
    loreId: 'sala6_log',
    lore: { x: 620, y: 300 },
    platforms: [
      { x: 250, y: 258, w: 70, h: 34 },
      { x: 500, y: 220, w: 76, h: 30 },
      { x: 1040, y: 250, w: 66, h: 34 },
      { x: 1400, y: 232, w: 72, h: 32 }
    ],
    enemies: [
      { type: 'bug', x: 420, y: 300 },
      { type: 'eco', x: 690, y: 300 },
      { type: 'bug', x: 760, y: 300 }
    ]
  },

  sala3: {
    id: 'sala3',
    name: 'Sala 7 — O Último Feiura',
    short: 'SALA 7',
    bg: 'classroom',
    boss: 'feiura',
    width: 1620,
    floorY: 300,
    spawn: { x: 80, y: 300 },
    triggerX: 850,
    arena: { left: 880, right: 1520, bossX: 1360, camX: 880 },
    loreId: 'sala7_espelho',
    lore: { x: 580, y: 300 },
    platforms: [
      { x: 300, y: 256, w: 66, h: 36 },
      { x: 540, y: 218, w: 72, h: 30 },
      { x: 1020, y: 248, w: 64, h: 34 },
      { x: 1420, y: 236, w: 68, h: 32 }
    ],
    enemies: [
      { type: 'spectral', x: 470, y: 300 },
      { type: 'eco', x: 700, y: 300 }
    ]
  },

  quadra: {
    id: 'quadra',
    name: 'Quadra — O Professor Esquecido',
    short: 'QUADRA',
    bg: 'gym',
    boss: 'esquecido',
    width: 1620,
    floorY: 300,
    spawn: { x: 80, y: 300 },
    triggerX: 850,
    arena: { left: 880, right: 1520, bossX: 1360, camX: 880 },
    loreId: 'quadra_placar',
    lore: { x: 620, y: 300 },
    platforms: [
      { x: 220, y: 250, w: 96, h: 26 },
      { x: 560, y: 228, w: 92, h: 26 },
      { x: 980, y: 252, w: 88, h: 26 },
      { x: 1380, y: 230, w: 92, h: 26 }
    ],
    enemies: [
      { type: 'bug', x: 430, y: 300 },
      { type: 'bug', x: 690, y: 300 },
      { type: 'eco', x: 760, y: 300 }
    ]
  },

  lab: {
    id: 'lab',
    name: 'Laboratório — O Guardião dos Sistemas',
    short: 'LABORATÓRIO',
    bg: 'lab',
    boss: 'guardiao',
    width: 1620,
    floorY: 300,
    spawn: { x: 80, y: 300 },
    triggerX: 850,
    arena: { left: 880, right: 1520, bossX: 1360, camX: 880 },
    loreId: 'lab_atlas',
    lore: { x: 640, y: 300 },
    platforms: [
      { x: 250, y: 252, w: 76, h: 32 },
      { x: 520, y: 222, w: 82, h: 30 },
      { x: 1000, y: 250, w: 74, h: 32 },
      { x: 1390, y: 226, w: 78, h: 30 }
    ],
    enemies: [
      { type: 'bug', x: 410, y: 300 },
      { type: 'spectral', x: 620, y: 300 },
      { type: 'bug', x: 740, y: 300 }
    ]
  }
};

const ROOM_ORDER = ['hub', 'sala1', 'sala2', 'sala3', 'quadra', 'lab'];
const BOSS_ROOMS = ['sala1', 'sala2', 'sala3', 'quadra', 'lab'];

/* Progressão sequencial: cada chave de chefe abre a porta da sala seguinte.
   'mestre' -> sala2, 'programas' -> sala3, 'feiura' -> quadra, 'esquecido' -> lab. */
const BOSS_KEY_FOR_DOOR = {
  sala2: 'mestre',
  sala3: 'programas',
  quadra: 'feiura',
  lab: 'esquecido'
};

/* Ordem canônica dos chefes: sala5 -> sala6 -> sala7 -> quadra -> lab. */
const BOSS_ORDER = ['mestre', 'programas', 'feiura', 'esquecido', 'guardiao'];

/* Habilidade liberada por cada chefe derrotado. */
const BOSS_ABILITY = {
  mestre: 'book',
  programas: 'airDash',
  feiura: 'warcry',
  esquecido: 'doubleJump',
  guardiao: null
};

function roomById(id) {
  return ROOMS[id] || ROOMS.hub;
}

function isBossRoom(id) {
  return BOSS_ROOMS.indexOf(id) >= 0;
}
