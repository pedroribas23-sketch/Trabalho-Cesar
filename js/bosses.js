/* =========================================================
   KENNEDITO — chefes, padrões de ataque e IA
   ========================================================= */
'use strict';

/* ---------------- helpers de ataque ---------------- */

function bossArena(game) {
  return (game.room && game.room.arena) ? game.room.arena : { left: 20, right: game.room.width - 20 };
}
function bossPlayerX(game) {
  return game.player ? game.player.x : (bossArena(game).left + bossArena(game).right) / 2;
}
function bossFan(game, b, opts) {
  const o = opts || {};
  const count = o.count || 5;
  const spread = o.spread != null ? o.spread : 0.22;
  const speed = o.speed || 165;
  const p = game.player;
  const tx = p ? p.x : b.x + b.facing * 100;
  const ty = p ? p.y - 24 : b.y - 30;
  const base = Math.atan2(ty - (b.y - 46), tx - b.x);
  for (let i = 0; i < count; i++) {
    const a = base + (i - (count - 1) / 2) * spread;
    game.spawnProjectile({
      type: o.type || 'orb',
      owner: 'boss',
      x: b.x + Math.cos(a) * 26,
      y: b.y - 46 + Math.sin(a) * 18,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      w: o.w || 12,
      h: o.h || 12,
      damage: o.damage || 1,
      life: o.life || 4,
      color: o.color || '#c77dff',
      scale: o.scale || 1,
      homing: o.homing || 0,
      spin: o.spin || 0,
      sway: o.sway || 0
    });
  }
}
function bossLowLaser(game, b, opts) {
  const o = opts || {};
  const arena = bossArena(game);
  const floor = game.room ? game.room.floorY : 300;
  game.spawnHazard({
    kind: 'laser',
    x: arena.left + 4,
    y: floor - (o.height || 16),
    w: arena.right - arena.left - 8,
    h: o.beam || 11,
    warnTime: o.warnTime != null ? o.warnTime : 0.6,
    activeTime: o.activeTime != null ? o.activeTime : 0.35,
    damage: 1,
    color: o.color || '#62c7ff',
    sfx: 'laser'
  });
  if (game.shake) game.shake(1.5, 0.12);
}
function bossZone(game, b, x, w, h, opts) {
  const o = opts || {};
  const floor = game.room ? game.room.floorY : 300;
  game.spawnHazard({
    kind: o.kind || 'zone',
    x: x - w / 2,
    y: floor - (h || 64),
    w: w,
    h: h || 64,
    warnTime: o.warnTime != null ? o.warnTime : 0.65,
    activeTime: o.activeTime != null ? o.activeTime : 0.3,
    damage: o.damage || 1,
    color: o.color || '#d7a64a',
    sfx: o.sfx || 'explosion'
  });
}
function bossCircle(game, b, x, opts) {
  const o = opts || {};
  const floor = game.room ? game.room.floorY : 300;
  game.spawnHazard({
    kind: 'circle',
    x: x - 24,
    y: floor - 48,
    w: 48,
    h: 48,
    warnTime: o.warnTime != null ? o.warnTime : 0.8,
    activeTime: o.activeTime != null ? o.activeTime : 0.35,
    damage: o.damage || 1,
    color: o.color || '#c77dff',
    sfx: o.sfx || 'shock'
  });
}
function bossSpawnBall(game, b, opts) {
  const o = opts || {};
  const p = game.player;
  const tx = o.targetX != null ? o.targetX : (p ? p.x : b.x - b.facing * 120);
  const time = o.time || 1.0;
  const startX = b.x + b.facing * 20;
  const startY = b.y - 58;
  const vx = (tx - startX) / time;
  const vy = (game.room.floorY - startY - 0.5 * (o.gravity || 700) * time * time) / time;
  game.spawnProjectile({
    type: 'ball',
    owner: 'boss',
    x: startX,
    y: startY,
    vx: vx,
    vy: vy,
    w: 14,
    h: 14,
    damage: 1,
    life: o.life || 4,
    gravity: o.gravity || 700,
    bounce: o.bounce != null ? o.bounce : 0.72,
    spin: 8,
    color: '#d8792e'
  });
}
function bossSpawnCode(game, x) {
  const floor = game.room ? game.room.floorY : 300;
  game.spawnHazard({
    kind: 'zone',
    x: x - 22,
    y: floor - 18,
    w: 44,
    h: 18,
    warnTime: 0.52,
    activeTime: 0.16,
    damage: 1,
    color: '#62c7ff',
    sfx: 'explosion'
  });
  game.spawnProjectile({
    type: 'code',
    owner: 'boss',
    x: x,
    y: 36,
    vx: 0,
    vy: 120,
    w: 16,
    h: 16,
    damage: 1,
    life: 3.2,
    gravity: 620,
    color: '#62c7ff',
    spin: 2
  });
}

/* ---------------- definições dos chefes ---------------- */

const BOSS_DEFS = {
  mestre: {
    id: 'mestre',
    name: 'O Mestre das Aulas',
    title: 'Professor de Todas as Matérias',
    room: 'sala1',
    color: '#d7a64a',
    dark: '#5a3a18',
    hp: 250,
    w: 44,
    h: 86,
    speed: 44,
    preferred: 148,
    contactDamage: 1,
    keyName: 'CHAVE DA SALA 6',
    intro: [
      'A sineta tocou. Ninguém saiu.',
      'Você chegou atrasado. Como sempre.',
      'A prova final começa agora.'
    ],
    defeatLine: 'O giz caiu da mão. A sala ficou em silêncio.',
    phaseLine: 'A segunda chamada é sempre pior.',
    phases: {
      1: ['livros', 'regua', 'lousa'],
      2: ['prova', 'lousa', 'livros', 'regua']
    },
    attacks: {
      livros: function (b, game) {
        const dir = b.facing;
        const steps = [];
        steps.push({ at: 0, run: function (bb, g) { bb.facePlayer(); if (g.audio) g.audio.sfx('talk'); } });
        [0.35, 0.68, 1.01].forEach(function (at, i) {
          steps.push({
            at: at,
            run: function (bb, g) {
              const p = g.player;
              const tx = p ? p.x + rand(-34, 34) : bb.x + dir * 120;
              const sx = bb.x + dir * 24;
              const sy = bb.y - 60;
              const time = 0.95;
              const vx = (tx - sx) / time;
              const vy = (g.room.floorY - sy - 0.5 * 520 * time * time) / time;
              g.spawnProjectile({
                type: 'book', owner: 'boss', x: sx, y: sy, vx: vx, vy: vy,
                w: 14, h: 11, damage: 1, life: 3.4, gravity: 520, bounce: 0.5, spin: 9,
                color: '#ffd98a'
              });
              if (g.audio) g.audio.sfx('book');
            }
          });
        });
        return { duration: 2.15, steps: steps };
      },
      regua: function (b, game) {
        const dir = b.facing;
        const steps = [];
        steps.push({
          at: 0,
          run: function (bb, g) {
            bb.facePlayer();
            const tx = bb.x + bb.facing * 92;
            bossZone(g, bb, tx, 82, 50, { color: '#ffd98a', warnTime: 0.48, activeTime: 0.26, sfx: 'attack' });
            if (g.audio) g.audio.sfx('talk');
          }
        });
        steps.push({
          at: 0.55,
          run: function (bb, g) {
            bb.dashTo(bb.x + bb.facing * 105, 380);
            g.shake(2.5, 0.15);
            g.spawnParticles(bb.x, bb.y - 10, 14, '#d7a64a', 'dust');
          }
        });
        steps.push({
          at: 1.22,
          run: function (bb, g) {
            bossZone(g, bb, bb.x + bb.facing * 70, 74, 46, { color: '#ffd98a', warnTime: 0.36, activeTime: 0.22, sfx: 'attack' });
          }
        });
        return { duration: 1.85, steps: steps };
      },
      lousa: function (b, game) {
        const steps = [];
        steps.push({ at: 0, run: function (bb, g) { bb.facePlayer(); if (g.audio) g.audio.sfx('roar'); } });
        [0.32, 1.28].forEach(function (at, wave) {
          steps.push({
            at: at,
            run: function (bb, g) {
              const px = bossPlayerX(g);
              const spread = wave === 0 ? [-82, 0, 82] : [-56, 44, 110];
              spread.forEach(function (offset) {
                const tx = clamp(px + offset + rand(-16, 16), bossArena(g).left + 40, bossArena(g).right - 40);
                bossZone(g, bb, tx, 34, 76, { kind: 'chalk', color: '#fff3b0', warnTime: 0.7, activeTime: 0.4, sfx: 'explosion' });
              });
              g.shake(2, 0.12);
            }
          });
        });
        return { duration: 2.5, steps: steps };
      },
      prova: function (b, game) {
        const steps = [];
        steps.push({ at: 0, run: function (bb, g) { if (g.audio) g.audio.sfx('roar'); g.shake(3, 0.3); } });
        for (let i = 0; i < 10; i++) {
          steps.push({
            at: 0.35 + i * 0.22,
            run: function (bb, g) {
              const arena = bossArena(g);
              const x = rand(arena.left + 20, arena.right - 20);
              g.spawnProjectile({
                type: 'paper', owner: 'boss', x: x, y: 30,
                vx: rand(-20, 20), vy: rand(85, 140), w: 10, h: 12,
                damage: 1, life: 4.2, gravity: 95, sway: 45, color: '#fff8cf', spin: 2
              });
            }
          });
        }
        steps.push({ at: 1.1, run: function (bb, g) { g.spawnEnemy('eco', bossArena(g).left + 70, g.room.floorY); } });
        steps.push({ at: 1.7, run: function (bb, g) { g.spawnEnemy('eco', bossArena(g).right - 70, g.room.floorY); } });
        return { duration: 3.1, steps: steps };
      }
    }
  },

  programas: {
    id: 'programas',
    name: 'Professor dos Programas',
    title: 'O Sistema Não Perdoa',
    room: 'sala2',
    color: '#4fa3ff',
    dark: '#102c58',
    hp: 280,
    w: 42,
    h: 84,
    speed: 48,
    preferred: 155,
    contactDamage: 1,
    keyName: 'CHAVE DA SALA 6',
    intro: [
      'O sistema registrou uma presença a mais.',
      'Você não está na lista de alunos.',
      'Portanto, você é um erro.',
      'E erros precisam ser corrigidos.'
    ],
    defeatLine: 'A tela piscou uma última vez. O código parou.',
    phaseLine: 'Executando protocolo de correção.',
    phases: {
      1: ['compilar', 'laser', 'bug'],
      2: ['loop', 'compilar', 'laser', 'bug']
    },
    attacks: {
      compilar: function (b, game) {
        const steps = [];
        steps.push({ at: 0, run: function (bb, g) { bb.facePlayer(); if (g.audio) g.audio.sfx('talk'); } });
        [0.3, 0.78, 1.26].forEach(function (at) {
          steps.push({
            at: at,
            run: function (bb, g) {
              const px = bossPlayerX(g);
              const x = clamp(px + rand(-42, 42), bossArena(g).left + 32, bossArena(g).right - 32);
              bossSpawnCode(g, x);
              if (g.audio) g.audio.sfx('book');
            }
          });
        });
        return { duration: 2.4, steps: steps };
      },
      laser: function (b, game) {
        const steps = [];
        steps.push({ at: 0, run: function (bb, g) { bb.facePlayer(); if (g.audio) g.audio.sfx('talk'); } });
        steps.push({ at: 0.22, run: function (bb, g) { bossLowLaser(g, bb, { color: '#4fa3ff', warnTime: 0.7, activeTime: 0.38, beam: 12 }); } });
        steps.push({ at: 1.45, run: function (bb, g) { bossLowLaser(g, bb, { color: '#62c7ff', warnTime: 0.55, activeTime: 0.34, beam: 12 }); } });
        return { duration: 2.55, steps: steps };
      },
      bug: function (b, game) {
        const steps = [];
        steps.push({ at: 0, run: function (bb, g) { bb.facePlayer(); if (g.audio) g.audio.sfx('talk'); } });
        steps.push({
          at: 0.35,
          run: function (bb, g) {
            g.spawnEnemy('bug', bb.x - 38, g.room.floorY);
            g.spawnEnemy('bug', bb.x + 38, g.room.floorY);
            g.spawnParticles(bb.x, bb.y - 20, 12, '#54ffb4', 'spark');
          }
        });
        return { duration: 1.65, steps: steps };
      },
      loop: function (b, game) {
        const steps = [];
        steps.push({
          at: 0,
          run: function (bb, g) {
            bb.facePlayer();
            const arena = bossArena(g);
            bb.teleportTo((arena.left + arena.right) / 2);
            g.shake(3, 0.2);
            if (g.audio) g.audio.sfx('laser');
          }
        });
        steps.push({ at: 0.45, run: function (bb, g) { bossLowLaser(g, bb, { color: '#4fa3ff', warnTime: 0.55, activeTime: 0.34, beam: 12 }); } });
        [1.25, 1.55, 1.85].forEach(function (at, i) {
          steps.push({
            at: at,
            run: function (bb, g) {
              const arena = bossArena(g);
              bossSpawnCode(g, clamp(bossPlayerX(g) + (i - 1) * 70, arena.left + 34, arena.right - 34));
            }
          });
        });
        steps.push({ at: 2.35, run: function (bb, g) { bossLowLaser(g, bb, { color: '#62c7ff', warnTime: 0.5, activeTime: 0.32, beam: 12 }); } });
        return { duration: 3.25, steps: steps };
      }
    }
  },

  feiura: {
    id: 'feiura',
    name: 'O Último Feiura',
    title: 'O Que Restou de Um Aluno',
    room: 'sala3',
    color: '#a45bd8',
    dark: '#2c103e',
    hp: 310,
    w: 46,
    h: 84,
    speed: 58,
    preferred: 138,
    contactDamage: 1,
    keyName: 'CHAVE DA SALA 7',
    intro: [
      'Ninguém lembra do que eu era.',
      'Só do que sobrou.',
      'Você também vai ficar. Para sempre.'
    ],
    defeatLine: 'O rosto finalmente descansou. A sala ficou roxa e vazia.',
    phaseLine: 'A escola nunca morre. Eu também não.',
    phases: {
      1: ['garra', 'circulos', 'orbes'],
      2: ['necromancia', 'garra', 'orbes', 'circulos']
    },
    attacks: {
      garra: function (b, game) {
        const steps = [];
        const startX = b.x;
        steps.push({
          at: 0,
          run: function (bb, g) {
            bb.facePlayer();
            const arena = bossArena(g);
            const px = bossPlayerX(g);
            const target = clamp(px + (px < bb.x ? 78 : -78), arena.left + 50, arena.right - 50);
            bb.teleportTo(target);
            g.spawnParticles(bb.x, bb.y - 40, 18, '#c77dff', 'spark');
            if (g.audio) g.audio.sfx('dash');
          }
        });
        steps.push({
          at: 0.52,
          run: function (bb, g) {
            const tx = bb.x + bb.facing * 54;
            bossZone(g, bb, tx, 86, 60, { color: '#c77dff', warnTime: 0.3, activeTime: 0.22, sfx: 'attack' });
            g.shake(2.4, 0.12);
          }
        });
        steps.push({
          at: 1.28,
          run: function (bb, g) {
            bb.teleportTo(startX);
            g.spawnParticles(bb.x, bb.y - 40, 12, '#c77dff', 'spark');
          }
        });
        return { duration: 1.8, steps: steps };
      },
      circulos: function (b, game) {
        const steps = [];
        steps.push({ at: 0, run: function (bb, g) { bb.facePlayer(); if (g.audio) g.audio.sfx('talk'); } });
        [0.3, 1.2].forEach(function (at, wave) {
          steps.push({
            at: at,
            run: function (bb, g) {
              const px = bossPlayerX(g);
              const offsets = wave === 0 ? [-96, 0, 96] : [-58, 52, 116];
              offsets.forEach(function (o) {
                bossCircle(g, bb, clamp(px + o + rand(-10, 10), bossArena(g).left + 34, bossArena(g).right - 34), {
                  color: '#c77dff', warnTime: 0.75, activeTime: 0.35
                });
              });
              g.shake(2.5, 0.15);
            }
          });
        });
        return { duration: 2.35, steps: steps };
      },
      orbes: function (b, game) {
        const steps = [];
        steps.push({ at: 0, run: function (bb, g) { bb.facePlayer(); if (g.audio) g.audio.sfx('talk'); } });
        [0.3, 0.73, 1.16].forEach(function (at) {
          steps.push({
            at: at,
            run: function (bb, g) {
              bossFan(g, bb, { type: 'orb', count: 5, spread: 0.17, speed: 155, color: '#c77dff', life: 3.4 });
              if (g.audio) g.audio.sfx('book');
            }
          });
        });
        return { duration: 2.1, steps: steps };
      },
      necromancia: function (b, game) {
        const steps = [];
        steps.push({
          at: 0,
          run: function (bb, g) {
            if (g.audio) g.audio.sfx('roar');
            g.shake(4, 0.4);
            g.setDarkness(4.0, '#a45bd8');
          }
        });
        [0.55, 1.15, 1.75].forEach(function (at, i) {
          steps.push({
            at: at,
            run: function (bb, g) {
              const arena = bossArena(g);
              const x = i % 2 === 0 ? arena.left + 80 : arena.right - 80;
              g.spawnEnemy('spectral', x, g.room.floorY - 8, { phase: i });
              g.spawnParticles(x, g.room.floorY - 40, 16, '#c77dff', 'spark');
            }
          });
        });
        steps.push({
          at: 2.2,
          run: function (bb, g) {
            bossFan(g, bb, { type: 'spectralOrb', count: 7, spread: 0.16, speed: 175, color: '#ff7de9', life: 3.2 });
          }
        });
        return { duration: 3.25, steps: steps };
      }
    }
  },

  esquecido: {
    id: 'esquecido',
    name: 'O Professor Esquecido',
    title: 'Dono da Quadra. Dono da Escola.',
    room: 'quadra',
    color: '#e05252',
    dark: '#4a1114',
    hp: 380,
    w: 50,
    h: 90,
    speed: 62,
    preferred: 140,
    contactDamage: 1,
    keyName: 'CHAVE DO LABORATÓRIO',
    intro: [
      'A quadra sempre foi minha.',
      'A escola também.',
      'O placar não mente: ninguém nunca ganhou de mim.'
    ],
    defeatLine: 'O apito final ecoou. O placar finalmente zerou.',
    phaseLine: 'Agora é pessoal. Jogo sujo.',
    phases: {
      1: ['drible', 'arremesso', 'apito', 'entrada'],
      2: ['jogo_sujo', 'entrada', 'drible', 'apito', 'arremesso']
    },
    attacks: {
      drible: function (b, game) {
        const steps = [];
        steps.push({ at: 0, run: function (bb, g) { bb.facePlayer(); if (g.audio) g.audio.sfx('talk'); } });
        [0.28, 0.66, 1.04].forEach(function (at) {
          steps.push({
            at: at,
            run: function (bb, g) {
              bossSpawnBall(g, bb, { targetX: bossPlayerX(g) + rand(-28, 28), time: 0.95, gravity: 900, bounce: 0.72 });
              if (g.audio) g.audio.sfx('step');
            }
          });
        });
        return { duration: 2.0, steps: steps };
      },
      arremesso: function (b, game) {
        const steps = [];
        steps.push({ at: 0, run: function (bb, g) { bb.facePlayer(); if (g.audio) g.audio.sfx('talk'); } });
        [0.3, 1.12].forEach(function (at) {
          steps.push({
            at: at,
            run: function (bb, g) {
              const tx = clamp(bossPlayerX(g) + rand(-30, 30), bossArena(g).left + 34, bossArena(g).right - 34);
              bossZone(g, bb, tx, 54, 22, { color: '#ffb347', warnTime: 0.7, activeTime: 0.15, sfx: 'step' });
              bossSpawnBall(g, bb, { targetX: tx, time: 0.85, gravity: 820, bounce: 0.45 });
              if (g.audio) g.audio.sfx('book');
            }
          });
        });
        return { duration: 2.0, steps: steps };
      },
      apito: function (b, game) {
        const steps = [];
        steps.push({
          at: 0,
          run: function (bb, g) {
            bb.facePlayer();
            if (g.audio) g.audio.sfx('whistle');
            g.spawnParticles(bb.x, bb.y - 55, 10, '#ffd98a', 'spark');
          }
        });
        steps.push({
          at: 0.45,
          run: function (bb, g) {
            g.spawnHazard({
              kind: 'shockwave', x: bb.x, y: g.room.floorY, w: 1, h: 1,
              warnTime: 0.24, activeTime: 0.66, damage: 1, color: '#ffb347',
              radius: 8, expandSpeed: 410, maxRadius: 245, requiresGround: true, sfx: 'shock'
            });
            g.shake(3, 0.25);
          }
        });
        steps.push({
          at: 1.05,
          run: function (bb, g) {
            g.spawnHazard({
              kind: 'shockwave', x: bb.x, y: g.room.floorY, w: 1, h: 1,
              warnTime: 0.2, activeTime: 0.6, damage: 1, color: '#ffd98a',
              radius: 8, expandSpeed: 390, maxRadius: 225, requiresGround: true, sfx: 'shock'
            });
          }
        });
        return { duration: 1.8, steps: steps };
      },
      entrada: function (b, game) {
        const steps = [];
        steps.push({
          at: 0,
          run: function (bb, g) {
            bb.facePlayer();
            const tx = clamp(bossPlayerX(g), bossArena(g).left + 50, bossArena(g).right - 50);
            bb.hopTo(tx, 125, 0.62);
            if (g.audio) g.audio.sfx('jump');
            g.shake(2, 0.2);
          }
        });
        steps.push({
          at: 0.72,
          run: function (bb, g) {
            bossZone(g, bb, bb.x, 116, 40, { color: '#ff6b6b', warnTime: 0.1, activeTime: 0.28, sfx: 'explosion' });
            g.spawnHazard({
              kind: 'shockwave', x: bb.x, y: g.room.floorY, w: 1, h: 1,
              warnTime: 0.1, activeTime: 0.52, damage: 1, color: '#ff6b6b',
              radius: 10, expandSpeed: 460, maxRadius: 190, requiresGround: true, sfx: 'shock'
            });
            g.shake(4, 0.3);
            g.spawnParticles(bb.x, g.room.floorY - 4, 22, '#ffb347', 'dust');
          }
        });
        return { duration: 1.55, steps: steps };
      },
      jogo_sujo: function (b, game) {
        const steps = [];
        steps.push({ at: 0, run: function (bb, g) { if (g.audio) g.audio.sfx('roar'); g.shake(3, 0.3); } });
        [0.25, 0.55, 0.85].forEach(function (at) {
          steps.push({
            at: at,
            run: function (bb, g) {
              bossSpawnBall(g, bb, { targetX: bossPlayerX(g) + rand(-64, 64), time: 0.9, gravity: 920, bounce: 0.8 });
            }
          });
        });
        steps.push({
          at: 1.35,
          run: function (bb, g) {
            g.spawnHazard({
              kind: 'shockwave', x: bb.x, y: g.room.floorY, w: 1, h: 1,
              warnTime: 0.22, activeTime: 0.62, damage: 1, color: '#ff6b6b',
              radius: 8, expandSpeed: 430, maxRadius: 240, requiresGround: true, sfx: 'shock'
            });
          }
        });
        steps.push({
          at: 2.05,
          run: function (bb, g) {
            const tx = clamp(bossPlayerX(g), bossArena(g).left + 50, bossArena(g).right - 50);
            bb.hopTo(tx, 135, 0.56);
            g.shake(2.2, 0.2);
          }
        });
        steps.push({
          at: 2.7,
          run: function (bb, g) {
            bossZone(g, bb, bb.x, 124, 42, { color: '#ff6b6b', warnTime: 0.08, activeTime: 0.3, sfx: 'explosion' });
            g.spawnHazard({
              kind: 'shockwave', x: bb.x, y: g.room.floorY, w: 1, h: 1,
              warnTime: 0.08, activeTime: 0.55, damage: 1, color: '#ffb347',
              radius: 8, expandSpeed: 470, maxRadius: 215, requiresGround: true, sfx: 'shock'
            });
            g.shake(4, 0.3);
          }
        });
        return { duration: 3.35, steps: steps };
      }
    }
  },

  guardiao: {
    id: 'guardiao',
    name: 'O Guardião dos Sistemas',
    title: 'Protocolo Final da CEPK',
    room: 'lab',
    color: '#35e08b',
    dark: '#06271a',
    hp: 460,
    w: 50,
    h: 88,
    speed: 60,
    preferred: 150,
    contactDamage: 1,
    keyName: 'CHAVE MESTRA',
    final: true,
    intro: [
      'ACESSO NEGADO.',
      'A escola está protegida. Para sempre.',
      'Todos os sistemas estão sob meu controle.',
      'Inclusive você.'
    ],
    defeatLine: 'O núcleo apagou. Pela primeira vez em anos, a CEPK ficou em silêncio.',
    phaseLine: 'PROTOCOLO FINAL ATIVADO.',
    phases: {
      1: ['firewall', 'backup', 'varredura', 'sistemas'],
      2: ['protocolo_final', 'sistemas', 'backup', 'varredura', 'firewall']
    },
    attacks: {
      firewall: function (b, game) {
        const steps = [];
        const arena = bossArena(game);
        const startX = b.x;
        steps.push({
          at: 0,
          run: function (bb, g) {
            bb.facePlayer();
            bb.shielded = true;
            g.spawnParticles(bb.x, bb.y - 50, 18, '#62fff0', 'spark');
            if (g.audio) g.audio.sfx('laser');
          }
        });
        steps.push({
          at: 0.45,
          run: function (bb, g) {
            const target = bossPlayerX(g) > bb.x ? arena.right - 90 : arena.left + 90;
            bb.dashTo(target, 520);
            g.shake(3, 0.3);
          }
        });
        steps.push({
          at: 1.35,
          run: function (bb, g) {
            bb.shielded = false;
            bb.invuln = 0.18;
            g.spawnParticles(bb.x, bb.y - 40, 16, '#35e08b', 'spark');
            g.shake(2, 0.2);
          }
        });
        return { duration: 1.9, steps: steps };
      },
      backup: function (b, game) {
        const steps = [];
        const arena = bossArena(game);
        steps.push({
          at: 0,
          run: function (bb, g) {
            bb.facePlayer();
            if (g.audio) g.audio.sfx('laser');
            const spots = [arena.left + 110, arena.right - 110];
            spots.forEach(function (x, i) {
              g.spawnParticles(x, g.room.floorY - 44, 16, '#35e08b', 'spark');
              g.spawnProjectile({
                type: 'greenOrb', owner: 'boss', x: x, y: g.room.floorY - 56,
                vx: 0, vy: 0, w: 12, h: 12, damage: 1, life: 2.2,
                color: '#62fff0', scale: 1
              });
            });
          }
        });
        steps.push({ at: 0.6, run: function (bb, g) { bossFan(g, bb, { type: 'blade', count: 3, spread: 0.2, speed: 240, color: '#62fff0', life: 2.4, w: 18, h: 8 }); } });
        steps.push({ at: 1.15, run: function (bb, g) { bossFan(g, bb, { type: 'blade', count: 3, spread: 0.24, speed: 260, color: '#35e08b', life: 2.4, w: 18, h: 8 }); } });
        return { duration: 1.8, steps: steps };
      },
      varredura: function (b, game) {
        const steps = [];
        steps.push({ at: 0, run: function (bb, g) { bb.facePlayer(); if (g.audio) g.audio.sfx('laser'); } });
        steps.push({ at: 0.25, run: function (bb, g) { bossLowLaser(g, bb, { color: '#35e08b', warnTime: 0.62, activeTime: 0.36, beam: 13 }); } });
        steps.push({ at: 1.25, run: function (bb, g) { bossLowLaser(g, bb, { color: '#62fff0', warnTime: 0.5, activeTime: 0.32, beam: 13 }); } });
        return { duration: 2.2, steps: steps };
      },
      sistemas: function (b, game) {
        const steps = [];
        steps.push({
          at: 0,
          run: function (bb, g) {
            bb.facePlayer();
            const arena = bossArena(g);
            bb.teleportTo((arena.left + arena.right) / 2);
            g.spawnParticles(bb.x, bb.y - 48, 24, '#35e08b', 'spark');
            g.shake(2.5, 0.25);
            if (g.audio) g.audio.sfx('laser');
          }
        });
        steps.push({
          at: 0.45,
          run: function (bb, g) {
            const arena = bossArena(g);
            const cx = bb.x, cy = bb.y - 48;
            for (let i = 0; i < 6; i++) {
              const a = i / 6 * TAU + bb.t;
              g.spawnProjectile({
                type: 'greenOrb', owner: 'boss', x: cx + Math.cos(a) * 34, y: cy + Math.sin(a) * 22,
                vx: Math.cos(a) * 105, vy: Math.sin(a) * 105, w: 12, h: 12,
                damage: 1, life: 2.6, color: '#62fff0', homing: 55
              });
            }
          }
        });
        steps.push({ at: 1.2, run: function (bb, g) { bossFan(g, bb, { type: 'greenOrb', count: 5, spread: 0.18, speed: 205, color: '#35e08b', life: 2.8 }); } });
        steps.push({ at: 1.9, run: function (bb, g) { bossLowLaser(g, bb, { color: '#35e08b', warnTime: 0.5, activeTime: 0.32, beam: 13 }); } });
        return { duration: 2.75, steps: steps };
      },
      protocolo_final: function (b, game) {
        const steps = [];
        steps.push({ at: 0, run: function (bb, g) { if (g.audio) g.audio.sfx('roar'); g.shake(5, 0.5); g.setDarkness(3.0, '#35e08b'); } });
        steps.push({
          at: 0.45,
          run: function (bb, g) {
            const arena = bossArena(g);
            const cx = bb.x, cy = bb.y - 46;
            for (let i = 0; i < 9; i++) {
              const a = i / 9 * TAU;
              g.spawnProjectile({
                type: 'greenOrb', owner: 'boss', x: cx + Math.cos(a) * 28, y: cy + Math.sin(a) * 22,
                vx: Math.cos(a) * 125, vy: Math.sin(a) * 125, w: 12, h: 12,
                damage: 1, life: 3.1, color: '#62fff0', homing: 35
              });
            }
          }
        });
        steps.push({ at: 1.25, run: function (bb, g) { bossLowLaser(g, bb, { color: '#35e08b', warnTime: 0.5, activeTime: 0.32, beam: 13 }); } });
        steps.push({
          at: 2.0,
          run: function (bb, g) {
            const target = bossPlayerX(g) > bb.x ? bossArena(g).right - 90 : bossArena(g).left + 90;
            bb.dashTo(target, 560);
            bb.shielded = true;
            g.shake(3.5, 0.3);
          }
        });
        steps.push({ at: 2.55, run: function (bb, g) { bb.shielded = false; bossFan(g, bb, { type: 'greenOrb', count: 7, spread: 0.15, speed: 190, color: '#62fff0', life: 3.0 }); } });
        return { duration: 3.1, steps: steps };
      }
    }
  }
};

/* ---------------- classe do chefe ---------------- */

class Boss {
  constructor(game, id) {
    const def = BOSS_DEFS[id];
    if (!def) throw new Error('Chefe desconhecido: ' + id);
    this.game = game;
    this.id = id;
    this.def = def;
    this.name = def.name;
    this.title = def.title;
    this.color = def.color;
    this.w = def.w;
    this.h = def.h;
    this.maxHp = def.hp;
    this.hp = def.hp;
    this.phase = 1;
    this.x = 0;
    this.y = game.room ? game.room.floorY : 300;
    this.facing = -1;
    this.state = 'enter';
    this.t = 0;
    this.timer = 0;
    this.cooldown = 0.9;
    this.attack = null;
    this.attackName = '';
    this.attackStep = 0;
    this.lastAttack = '';
    this.flash = 0;
    this.invuln = 0;
    this.shielded = false;
    this.dying = false;
    this.dead = false;
    this.deathTimer = 0;
    this.explodeTimer = 0;
    this.deathNotified = false;
    this.contactCooldown = 0;
    this.hop = null;
    this.dash = null;
    this.pose = 'idle';
    this.start = true;

    const arena = game.room && game.room.arena ? game.room.arena : { left: 20, right: game.room ? game.room.width - 20 : 620 };
    this.x = def.side === 'left' ? arena.left + 110 : arena.right - 120;
    this.y = game.room ? game.room.floorY : 300;
    this.homeX = this.x;
  }

  get box() {
    return {
      x: this.x - this.w / 2,
      y: this.y - this.h,
      w: this.w,
      h: this.h
    };
  }

  facePlayer() {
    const p = this.game.player;
    if (p && !p.dead) this.facing = p.x >= this.x ? 1 : -1;
  }

  beginFight() {
    this.state = 'idle';
    this.timer = 0;
    this.cooldown = 0.85;
    this.invuln = 0;
    this.facePlayer();
  }

  update(dt) {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.contactCooldown = Math.max(0, this.contactCooldown - dt);

    if (this.dead) return;

    if (this.dying) {
      this.deathTimer += dt;
      this.explodeTimer -= dt;
      if (this.explodeTimer <= 0) {
        this.explodeTimer = 0.14;
        const ex = this.x + rand(-this.w * 0.45, this.w * 0.45);
        const ey = this.y - rand(6, this.h * 0.9);
        this.game.spawnParticles(ex, ey, randInt(5, 10), this.color, 'enemy');
        this.game.shake(3, 0.16);
        if (this.game.audio) this.game.audio.sfx('explosion');
      }
      if (this.deathTimer >= 2.4 && !this.deathNotified) {
        this.deathNotified = true;
        this.dead = true;
        this.game.onBossDefeated(this);
      }
      return;
    }

    if (this.state === 'enter') {
      this.timer += dt;
      this.facePlayer();
      return;
    }

    if (this.state === 'transition') {
      this.timer += dt;
      this.game.spawnParticles(this.x + rand(-30, 30), this.y - rand(10, 80), 1, this.color, 'spark');
      if (this.timer >= 1.15) {
        this.state = 'idle';
        this.invuln = 0;
        this.cooldown = 0.45;
        this.timer = 0;
      }
      return;
    }

    this.updateMotion(dt);

    if (this.state === 'attack') {
      this.updateAttack(dt);
    } else {
      this.facePlayer();
      const p = this.game.player;
      if (p && !p.dead) {
        const distToPlayer = Math.abs(p.x - this.x);
        if (distToPlayer > (this.def.preferred || 145) && !this.hop && !this.dash) {
          const dir = p.x > this.x ? 1 : -1;
          this.x += dir * (this.def.speed || 50) * dt;
          this.state = 'walk';
        } else {
          this.state = 'idle';
        }
      }
      this.cooldown -= dt;
      if (this.cooldown <= 0 && this.game.player && !this.game.player.dead) {
        this.chooseAttack();
      }
    }

    const arena = bossArena(this.game);
    this.x = clamp(this.x, arena.left + this.w / 2 + 2, arena.right - this.w / 2 - 2);
    if (!this.hop) this.y = this.game.room ? this.game.room.floorY : 300;

    const p = this.game.player;
    if (p && !p.dead && p.invuln <= 0 && this.state !== 'transition') {
      const b = this.box;
      const check = { x: b.x + 4, y: b.y + 4, w: b.w - 8, h: b.h - 4 };
      if (aabb(check, p.box)) {
        p.hurt(this.def.contactDamage || 1, this.x, this.y - this.h / 2);
      }
    }
  }

  updateMotion(dt) {
    if (this.hop) {
      this.hop.t += dt;
      const p = clamp(this.hop.t / this.hop.duration, 0, 1);
      this.x = lerp(this.hop.startX, this.hop.targetX, easeInOut(p));
      this.y = this.hop.floorY - Math.sin(p * Math.PI) * this.hop.apex;
      if (p >= 1) {
        this.y = this.hop.floorY;
        this.hop = null;
      }
    }
    if (this.dash) {
      this.dash.t += dt;
      const dir = this.dash.targetX > this.x ? 1 : -1;
      this.x += dir * this.dash.speed * dt;
      if (this.game.spawnDashGhost) this.game.spawnBossGhost(this);
      if ((dir > 0 && this.x >= this.dash.targetX) || (dir < 0 && this.x <= this.dash.targetX) || this.dash.t > this.dash.maxTime) {
        this.x = this.dash.targetX;
        this.dash = null;
      }
    }
  }

  dashTo(targetX, speed) {
    this.dash = { targetX: targetX, speed: speed || 420, t: 0, maxTime: 1.0 };
  }

  hopTo(targetX, apex, duration) {
    this.hop = {
      startX: this.x,
      targetX: targetX,
      floorY: this.game.room ? this.game.room.floorY : 300,
      apex: apex || 120,
      duration: duration || 0.62,
      t: 0
    };
  }

  teleportTo(targetX) {
    const arena = bossArena(this.game);
    this.x = clamp(targetX, arena.left + this.w / 2 + 6, arena.right - this.w / 2 - 6);
    this.y = this.game.room ? this.game.room.floorY : 300;
    this.game.spawnParticles(this.x, this.y - this.h * 0.5, 18, this.color, 'spark');
  }

  chooseAttack() {
    if (this.state === 'attack' || this.state === 'transition' || this.dying) return;
    const list = (this.def.phases[this.phase] || this.def.phases[1] || []).slice();
    if (list.length > 1) {
      const filtered = list.filter((a) => a !== this.lastAttack);
      if (filtered.length) list.length = 0, list.push.apply(list, filtered);
    }
    const name = pick(list);
    if (!name || !this.def.attacks[name]) {
      this.cooldown = 1;
      return;
    }
    this.startAttack(name);
  }

  startAttack(name) {
    const builder = this.def.attacks[name];
    let data = null;
    try {
      data = builder ? builder(this, this.game) : null;
    } catch (e) {
      console.warn('Falha no ataque ' + name, e);
      data = null;
    }
    if (!data || !data.steps || !data.steps.length) {
      this.cooldown = 0.8;
      this.state = 'idle';
      return;
    }
    this.attack = {
      name: name,
      t: 0,
      stepIndex: 0,
      steps: data.steps,
      duration: data.duration || 1.5
    };
    this.attackName = name;
    this.lastAttack = name;
    this.state = 'attack';
    this.facePlayer();
    if (this.game.audio) this.game.audio.sfx('talk');
  }

  updateAttack(dt) {
    if (!this.attack) { this.state = 'idle'; return; }
    this.attack.t += dt;
    while (this.attack.stepIndex < this.attack.steps.length &&
           this.attack.steps[this.attack.stepIndex].at <= this.attack.t) {
      const step = this.attack.steps[this.attack.stepIndex];
      try { step.run(this, this.game); } catch (e) { console.warn('Passo de ataque falhou', e); }
      this.attack.stepIndex++;
    }
    if (this.attack.t >= this.attack.duration) {
      this.attack = null;
      this.attackName = '';
      this.state = 'idle';
      this.cooldown = (this.phase === 2 ? 0.55 : 0.8) + rand(0, 0.3);
    }
  }

  takeDamage(amount, source, hitX, hitY) {
    if (this.dead || this.dying || this.state === 'enter' || this.state === 'transition' || this.invuln > 0) {
      this.game.spawnParticles(hitX || this.x, hitY || this.y - 50, 6, '#d9ffe9', 'spark');
      return 0;
    }
    if (this.shielded) {
      this.flash = 0.06;
      this.game.spawnParticles(hitX || this.x, hitY || this.y - 50, 9, '#62fff0', 'spark');
      if (this.game.audio) this.game.audio.sfx('hit');
      return 0;
    }
    this.hp -= amount;
    this.flash = 0.16;
    if (this.game.audio) this.game.audio.sfx('bossHit');
    this.game.hitstop = Math.max(this.game.hitstop, 0.035);
    this.game.shake(2.4, 0.13);
    this.game.spawnHitParticles(hitX || this.x, hitY || this.y - 48, this.color, 12);
    this.game.spawnDamageText(hitX || this.x, (hitY || this.y - 52) - 8, amount, this.color);
    if (this.hp <= this.maxHp * 0.5 && this.phase === 1) {
      this.startPhase2();
    } else if (this.hp <= 0) {
      this.die();
    }
    return amount;
  }

  startPhase2() {
    this.hp = Math.max(1, this.hp);
    this.phase = 2;
    this.state = 'transition';
    this.timer = 0;
    this.attack = null;
    this.attackName = '';
    this.invuln = 2.2;
    this.shielded = false;
    this.hop = null;
    this.dash = null;
    this.game.clearBossDanger();
    this.game.shake(5, 0.5);
    this.game.spawnParticles(this.x, this.y - this.h * 0.5, 42, this.color, 'ring');
    if (this.game.audio) this.game.audio.sfx('roar');
    this.game.toast(this.def.phaseLine || 'SEGUNDA FASE', 2200);
    if (this.game.setDarkness) this.game.setDarkness(1.5, this.color);
  }

  die() {
    if (this.dying || this.dead) return;
    this.hp = 0;
    this.dying = true;
    this.state = 'dying';
    this.deathTimer = 0;
    this.explodeTimer = 0;
    this.attack = null;
    this.attackName = '';
    this.shielded = false;
    this.invuln = 999;
    this.game.clearBossDanger();
    this.game.shake(7, 0.6);
    if (this.game.audio) this.game.audio.sfx('death');
    this.game.spawnParticles(this.x, this.y - this.h * 0.5, 30, this.color, 'enemy');
    this.game.toast(this.def.defeatLine || 'CHEFE DERROTADO', 2600);
  }

  draw(ctx, camX, camY) {
    if (this.dead) return;
    const sx = this.x - camX;
    const sy = this.y - camY;
    const alpha = this.dying ? Math.max(0, 1 - this.deathTimer / 2.4) : 1;
    const flash = this.flash > 0 && Math.floor(this.flash * 40) % 2 === 0;
    ctx.save();
    groundShadow(ctx, sx, sy, this.w * 0.52, this.dying ? 0.12 : 0.34);
    if (this.shielded) {
      glowCircle(ctx, sx, sy - this.h * 0.5, this.w * 1.1, '#62fff0', 0.16);
      ctx.strokeStyle = withAlpha('#62fff0', 0.45 + Math.sin(this.t * 8) * 0.12);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy - this.h * 0.5, this.w * 0.6, this.h * 0.52, 0, 0, TAU);
      ctx.stroke();
    }
    if (this.phase === 2) {
      ctx.globalAlpha = 0.12 + Math.sin(this.t * 6) * 0.04;
      fillCircle(ctx, sx, sy - this.h * 0.5, this.w * 1.3, this.color);
      ctx.globalAlpha = 1;
    }
    drawBossSprite(ctx, this.id, sx, sy, {
      t: this.t,
      state: this.state === 'attack' ? 'attack' : (this.state === 'walk' ? 'walk' : 'idle'),
      attackName: this.attackName,
      phase: this.phase,
      facing: this.facing,
      flash: flash,
      alpha: alpha
    });
    // aviso de ataque / barra de vida local
    if (this.state === 'attack' && this.attackName && !this.dying) {
      ctx.globalAlpha = 0.18 + Math.sin(this.t * 12) * 0.08;
      drawOutlinedText(ctx, this.attackName.toUpperCase(), sx, sy - this.h - 14, 6, this.color, '#07110b');
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

