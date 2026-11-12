/* =========================================================
   KENNEDITO — dificuldades

   A dificuldade vale para a partida inteira: quantos corações
   o Kennedito começa, quanta vida e velocidade os inimigos
   têm, quanto os chefes aguentam e o dano que o jogador
   causa. Fica salva no save (settings.difficulty) e vai
   para a nuvem junto com o resto.
   ========================================================= */

const DIFFICULTY_ORDER = ['facil', 'normal', 'dificil'];

const DIFFICULTIES = {
  facil: {
    id: 'facil',
    name: 'FÁCIL',
    tag: 'Recruta',
    desc: 'Mais corações e inimigos bem mais fracos. Para conhecer a escola sem sufoco.',
    hearts: 3,
    maxHearts: 14,
    playerDamage: 1.25,
    enemyHp: 0.7,
    enemySpeed: 0.85,
    bossHp: 0.7,
    bossSpeed: 0.85
  },
  normal: {
    id: 'normal',
    name: 'NORMAL',
    tag: 'Aluno',
    desc: 'O jeito que a escola foi desenhada. Equilibrado, do jeito que o	devia ser.',
    hearts: 0,
    maxHearts: 11,
    playerDamage: 1,
    enemyHp: 1,
    enemySpeed: 1,
    bossHp: 1,
    bossSpeed: 1
  },
  dificil: {
    id: 'dificil',
    name: 'DIFÍCIL',
    tag: 'Pesadelo',
    desc: 'Menos corações, inimigos mais rápidos e chefes com o dobro de raiva.',
    hearts: -2,
    maxHearts: 9,
    playerDamage: 0.8,
    enemyHp: 1.4,
    enemySpeed: 1.2,
    bossHp: 1.45,
    bossSpeed: 1.2
  }
};

const DIFFICULTY_DEFAULT = 'normal';

/* Devolve a definição da dificuldade, sempre valendo. */
function difficultyDef(id) {
  return DIFFICULTIES[id] || DIFFICULTIES[DIFFICULTY_DEFAULT];
}

/* Normaliza o id (usado quando o save vem da nuvem). */
function difficultyId(id) {
  return DIFFICULTIES[id] ? id : DIFFICULTY_DEFAULT;
}

/* Corações com que o jogador começa. */
function difficultyBaseHearts(id) {
  return 6 + difficultyDef(id).hearts;
}

/* Teto de corações (cada chefe derrotado dá +1). */
function difficultyMaxHearts(id) {
  return difficultyDef(id).maxHearts;
}

/* Multiplicador do dano do jogador, já arredondado e com piso de 1. */
function difficultyPlayerDamage(id, base) {
  const value = Math.round(base * difficultyDef(id).playerDamage);
  return value < 1 ? 1 : value;
}
