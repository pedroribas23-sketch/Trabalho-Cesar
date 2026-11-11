/* =========================================================
   KENNEDITO — arte procedural: personagens e efeitos
   Nenhum sprite externo. Tudo desenhado no canvas.
   ========================================================= */
'use strict';

const ART = {
  outline: '#07110b',
  kenn: {
    fur: '#8d9a92',
    furDark: '#5d6a62',
    furLight: '#c2ccc3',
    cap: '#1fc46f',
    capDark: '#0b7a43',
    shirt: '#101b16',
    shirtLight: '#26392d',
    shorts: '#0d2b1c',
    shoe: '#e7f6eb',
    shoeDark: '#9db3a3',
    eye: '#c6ff72',
    skin: '#a9b6ad'
  },
  bosses: {
    mestre:    { main: '#d7a64a', dark: '#5a3a18', light: '#ffe6a6', accent: '#ff6b4a' },
    programas: { main: '#4fa3ff', dark: '#102c58', light: '#bfe8ff', accent: '#62ffd8' },
    feiura:    { main: '#a45bd8', dark: '#2c103e', light: '#e2b6ff', accent: '#ff4fd8' },
    esquecido: { main: '#e05252', dark: '#4a1114', light: '#ffc0a8', accent: '#ffb347' },
    guardiao:  { main: '#35e08b', dark: '#06271a', light: '#b9ffd9', accent: '#62fff0' }
  }
};

function kc(key, flash) {
  if (flash) return '#ffffff';
  return ART.kenn[key] || '#fff';
}
function bc(id, key, flash) {
  if (flash) return '#ffffff';
  const c = ART.bosses[id] || ART.bosses.mestre;
  return c[key] || '#fff';
}

/* ---------------- Kennedito ---------------- */

function drawKennedito(ctx, x, y, opts) {
  const o = opts || {};
  const facing = o.facing === -1 ? -1 : 1;
  const t = o.t || 0;
  const state = o.state || 'idle';
  const flash = !!o.flash;
  const scale = o.scale || 1;
  const attackPose = o.attackPose || 0;
  const running = state === 'run';
  const airborne = state === 'jump' || state === 'fall';
  const dashing = state === 'dash';
  const hurt = state === 'hurt';
  const dead = state === 'dead';
  const walk = running ? Math.sin(t * 17) : 0;
  const bob = running ? Math.abs(Math.sin(t * 17)) * 1.4 : Math.sin(t * 3.2) * 0.7;
  const blink = (t % 3.7) > 3.52;
  const tailSwing = Math.sin(t * 5.5) * 3;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  if (dead) {
    ctx.rotate(-0.9);
    ctx.translate(0, -2);
  } else if (dashing) {
    ctx.rotate(0.18);
  } else if (hurt) {
    ctx.rotate(-0.13);
  }

  // cauda
  ctx.save();
  ctx.translate(-8, -16 + tailSwing * 0.35);
  ctx.rotate(-0.25 + tailSwing * 0.025);
  ctx.fillStyle = kc('furDark', flash);
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.quadraticCurveTo(-13, 1, -16, -9);
  ctx.quadraticCurveTo(-12, -15, -6, -8);
  ctx.quadraticCurveTo(-3, -4, 0, 4);
  ctx.fill();
  ctx.fillStyle = kc('fur', flash);
  ctx.beginPath();
  ctx.moveTo(-1, 1);
  ctx.quadraticCurveTo(-10, -1, -14, -8);
  ctx.quadraticCurveTo(-10, -11, -5, -5);
  ctx.fill();
  ctx.restore();

  // pernas
  function leg(offset, front) {
    ctx.save();
    ctx.translate(offset, -13 + bob);
    let bend = 0;
    let swing = 0;
    if (running) {
      swing = front ? walk * 5 : -walk * 5;
      bend = front ? Math.max(0, walk) * 3 : Math.max(0, -walk) * 3;
    } else if (airborne) {
      swing = front ? 3 : -3;
      bend = 5;
    } else if (dashing) {
      swing = front ? -4 : 4;
      bend = 4;
    }
    ctx.rotate(swing * 0.045);
    ctx.fillStyle = kc('shorts', flash);
    fillRoundRect(ctx, -3, 0, 6, 6, 2, kc('shorts', flash));
    ctx.fillStyle = kc('fur', flash);
    fillRoundRect(ctx, -2.5, 4, 5, 8 - bend * 0.25, 1.8, kc('fur', flash));
    ctx.fillStyle = kc('shoe', flash);
    fillRoundRect(ctx, -4 + (front ? 1 : 0), 10 - bend * 0.2, 8, 3.5, 1.5, kc('shoe', flash));
    ctx.fillStyle = kc('shoeDark', flash);
    ctx.fillRect(-3, 12 - bend * 0.2, 7, 1.2);
    ctx.restore();
  }
  leg(-4, false);
  leg(4, true);

  // corpo
  const bodyY = -29 + bob;
  ctx.fillStyle = kc('shirt', flash);
  roundRectPath(ctx, -9, bodyY, 18, 18, 4);
  ctx.fill();
  ctx.fillStyle = kc('shirtLight', flash);
  fillRoundRect(ctx, -8, bodyY + 2, 6, 14, 2, kc('shirtLight', flash));
  ctx.fillStyle = kc('cap', flash);
  ctx.fillRect(-9, bodyY + 1, 18, 2.2);
  ctx.fillRect(-1.2, bodyY + 3, 2.4, 12);
  // número
  drawPixelText(ctx, '10', 2.2, bodyY + 9.5, 6.5, kc('cap', flash), 'center');
  ctx.fillStyle = kc('shorts', flash);
  fillRoundRect(ctx, -9, bodyY + 16, 18, 4, 2, kc('shorts', flash));

  // braços
  const armY = bodyY + 5;
  const attackLift = attackPose ? 1 : 0;
  // braço de trás
  ctx.save();
  ctx.translate(-5, armY);
  ctx.rotate(0.35 + (running ? -walk * 0.12 : 0));
  ctx.fillStyle = kc('shirt', flash);
  fillRoundRect(ctx, -2.2, 0, 4.4, 9, 2, kc('shirt', flash));
  ctx.fillStyle = kc('fur', flash);
  fillCircle(ctx, 0, 10, 2.7, kc('fur', flash));
  ctx.restore();

  // braço da frente + caderno
  ctx.save();
  ctx.translate(5, armY);
  let armAngle = 0.15 + (running ? walk * 0.16 : 0);
  if (attackPose === 1) armAngle = -1.15;
  if (attackPose === 2) armAngle = -2.1;
  if (attackPose === 3) armAngle = -1.55;
  if (dashing) armAngle = 0.65;
  if (hurt) armAngle = 0.75;
  ctx.rotate(armAngle);
  ctx.fillStyle = kc('shirt', flash);
  fillRoundRect(ctx, -2.4, 0, 4.8, 9, 2, kc('shirt', flash));
  ctx.fillStyle = kc('fur', flash);
  fillCircle(ctx, 0, 10, 2.9, kc('fur', flash));
  if (attackPose || o.showBook) {
    ctx.save();
    ctx.translate(0, 11);
    ctx.rotate(attackPose === 2 ? -0.8 : -0.25);
    ctx.fillStyle = flash ? '#fff' : '#e7f6eb';
    fillRoundRect(ctx, -4.5, -1.5, 9, 7, 1, flash ? '#fff' : '#e7f6eb');
    ctx.fillStyle = flash ? '#fff' : '#1fc46f';
    ctx.fillRect(-4.5, -1.5, 9, 1.5);
    ctx.fillStyle = flash ? '#fff' : '#80968a';
    ctx.fillRect(-3.2, 1, 6.4, 0.8);
    ctx.fillRect(-3.2, 3, 4.6, 0.8);
    ctx.restore();
  }
  ctx.restore();

  // cabeça
  const headY = -41 + bob;
  ctx.fillStyle = kc('fur', flash);
  fillRoundRect(ctx, -9, headY, 18, 16, 6, kc('fur', flash));
  // orelhas
  ctx.fillStyle = kc('furDark', flash);
  ctx.beginPath();
  ctx.moveTo(-8, headY + 3); ctx.lineTo(-11, headY - 5); ctx.lineTo(-3, headY - 1); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, headY + 3); ctx.lineTo(11, headY - 5); ctx.lineTo(3, headY - 1); ctx.fill();
  ctx.fillStyle = flash ? '#fff' : '#c97b8c';
  ctx.beginPath();
  ctx.moveTo(-8, headY + 1); ctx.lineTo(-9.6, headY - 3); ctx.lineTo(-5, headY - 0.5); ctx.fill();
  // focinho
  ctx.fillStyle = kc('furLight', flash);
  fillRoundRect(ctx, 1, headY + 7, 10, 7, 3, kc('furLight', flash));
  ctx.fillStyle = kc('furDark', flash);
  fillCircle(ctx, 10, headY + 9.5, 1.6, kc('furDark', flash));
  ctx.fillStyle = flash ? '#fff' : '#2a1810';
  fillCircle(ctx, 11.2, headY + 8.2, 1.5, flash ? '#fff' : '#2a1810');
  // boca
  ctx.strokeStyle = flash ? '#fff' : '#3b2a24';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(4, headY + 13);
  ctx.quadraticCurveTo(7, headY + 14.3, 10, headY + 13);
  ctx.stroke();
  // olhos
  if (blink || dead) {
    ctx.fillStyle = flash ? '#fff' : '#203027';
    ctx.fillRect(3.8, headY + 6, 4.2, 1.4);
  } else {
    ctx.fillStyle = flash ? '#fff' : '#eafbe9';
    fillCircle(ctx, 5.4, headY + 6.2, 2.3, flash ? '#fff' : '#eafbe9');
    ctx.fillStyle = kc('eye', flash);
    fillCircle(ctx, 5.9, headY + 6.2, 1.25, kc('eye', flash));
    ctx.fillStyle = flash ? '#fff' : '#102016';
    fillCircle(ctx, 6.2, headY + 6.2, 0.62, flash ? '#fff' : '#102016');
  }
  // sobrancelha
  ctx.strokeStyle = kc('furDark', flash);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(3.2, headY + 3.4);
  ctx.lineTo(7.8, headY + 2.9);
  ctx.stroke();

  // boné
  ctx.fillStyle = kc('cap', flash);
  ctx.beginPath();
  ctx.moveTo(-9.2, headY + 1.5);
  ctx.quadraticCurveTo(-8, headY - 7.5, 0, headY - 7.5);
  ctx.quadraticCurveTo(8.5, headY - 7.5, 9.2, headY + 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = kc('capDark', flash);
  ctx.beginPath();
  ctx.moveTo(6, headY - 0.5);
  ctx.lineTo(14.5, headY + 0.5);
  ctx.quadraticCurveTo(15.6, headY + 2.2, 13.5, headY + 2.8);
  ctx.lineTo(5.8, headY + 2.2);
  ctx.closePath();
  ctx.fill();
  drawPixelText(ctx, 'K', 0, headY - 3.2, 5.4, flash ? '#fff' : '#d8ffe6', 'center');

  // brilho de contorno
  if (o.glow) {
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = kc('cap', false);
    ctx.lineWidth = 2;
    roundRectPath(ctx, -9, headY, 18, 16, 6);
    ctx.stroke();
  }

  ctx.restore();
}

/* ---------------- Bosses ---------------- */

function drawBossSprite(ctx, id, x, y, opts) {
  const o = opts || {};
  const fn = BOSS_SPRITES[id] || BOSS_SPRITES.mestre;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale((o.facing === -1 ? -1 : 1) * (o.scale || 1), (o.scale || 1));
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  fn(ctx, o);
  ctx.restore();
}

const BOSS_SPRITES = {};

/* O Mestre das Aulas */
BOSS_SPRITES.mestre = function (ctx, o) {
  const t = o.t || 0;
  const flash = !!o.flash;
  const st = o.state || 'idle';
  const attack = o.attackName || '';
  const bob = st === 'walk' ? Math.abs(Math.sin(t * 12)) * 1.2 : Math.sin(t * 2.6) * 0.8;
  const walk = st === 'walk' ? Math.sin(t * 12) : 0;
  const robe = bc('mestre', 'main', flash);
  const dark = bc('mestre', 'dark', flash);
  const light = bc('mestre', 'light', flash);
  const accent = bc('mestre', 'accent', flash);
  const facing = 1;

  ctx.save();
  ctx.translate(0, bob);
  // sombra/aura
  if (o.phase === 2) glowCircle(ctx, 0, -42, 56, bc('mestre', 'main', false), 0.11);

  // pernas
  ctx.fillStyle = flash ? '#fff' : '#2a2119';
  fillRoundRect(ctx, -13, -31, 10, 31, 3, flash ? '#fff' : '#2a2119');
  fillRoundRect(ctx, 3, -31, 10, 31, 3, flash ? '#fff' : '#2a2119');
  ctx.fillStyle = flash ? '#fff' : '#14100c';
  fillRoundRect(ctx, -15, -5, 13, 5, 2, flash ? '#fff' : '#14100c');
  fillRoundRect(ctx, 2, -5, 13, 5, 2, flash ? '#fff' : '#14100c');
  ctx.fillStyle = flash ? '#fff' : '#6b5640';
  ctx.fillRect(-12, -14 + walk * 2, 8, 2);
  ctx.fillRect(4, -14 - walk * 2, 8, 2);

  // casaco/saia
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(-18, -60);
  ctx.lineTo(18, -60);
  ctx.lineTo(22, -26);
  ctx.lineTo(8, -30);
  ctx.lineTo(0, -24);
  ctx.lineTo(-8, -30);
  ctx.lineTo(-22, -26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = flash ? '#fff' : '#3b2b1e';
  ctx.fillRect(-20, -30, 8, 6);
  ctx.fillRect(12, -30, 8, 6);

  // torso colete
  ctx.fillStyle = flash ? '#fff' : '#efe3c6';
  fillRoundRect(ctx, -13, -67, 26, 32, 4, flash ? '#fff' : '#efe3c6');
  ctx.fillStyle = robe;
  ctx.beginPath();
  ctx.moveTo(-13, -66);
  ctx.lineTo(-3, -64);
  ctx.lineTo(-5, -36);
  ctx.lineTo(-13, -36);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(13, -66);
  ctx.lineTo(3, -64);
  ctx.lineTo(5, -36);
  ctx.lineTo(13, -36);
  ctx.closePath();
  ctx.fill();
  // gravata
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(-2, -64); ctx.lineTo(2, -64); ctx.lineTo(4, -52); ctx.lineTo(0, -45); ctx.lineTo(-4, -52); ctx.closePath();
  ctx.fill();
  // botões
  ctx.fillStyle = flash ? '#fff' : '#e9c168';
  fillCircle(ctx, 0, -50, 1.1, flash ? '#fff' : '#e9c168');
  fillCircle(ctx, 0, -44, 1.1, flash ? '#fff' : '#e9c168');

  // braços
  const raise = attack === 'livros' || attack === 'prova';
  const sweep = attack === 'regua';
  ctx.save();
  ctx.translate(-15, -63);
  ctx.rotate(0.25 + (raise ? -0.75 : 0) + (sweep ? -0.4 : 0));
  ctx.fillStyle = dark;
  fillRoundRect(ctx, -4, 0, 8, 25, 3, dark);
  ctx.fillStyle = flash ? '#fff' : '#b7a58a';
  fillCircle(ctx, 0, 26, 3.6, flash ? '#fff' : '#b7a58a');
  ctx.restore();

  ctx.save();
  ctx.translate(15, -63);
  let a = -0.2;
  if (raise) a = -1.8;
  if (sweep) a = -0.95;
  ctx.rotate(a);
  ctx.fillStyle = dark;
  fillRoundRect(ctx, -4, 0, 8, 25, 3, dark);
  ctx.fillStyle = flash ? '#fff' : '#b7a58a';
  fillCircle(ctx, 0, 26, 3.6, flash ? '#fff' : '#b7a58a');
  // livro
  if (raise || st === 'idle' || st === 'walk') {
    ctx.save();
    ctx.translate(0, 29);
    ctx.rotate(0.25);
    ctx.fillStyle = flash ? '#fff' : '#7d3d2a';
    fillRoundRect(ctx, -7, -4, 14, 9, 1, flash ? '#fff' : '#7d3d2a');
    ctx.fillStyle = flash ? '#fff' : '#d9b56c';
    ctx.fillRect(-5.5, -2.6, 11, 1.2);
    ctx.fillStyle = flash ? '#fff' : '#f3e2b0';
    ctx.fillRect(-5.5, -0.8, 6, 4);
    ctx.restore();
  }
  // régua
  if (sweep) {
    ctx.save();
    ctx.translate(0, 22);
    ctx.rotate(-0.2);
    ctx.fillStyle = flash ? '#fff' : '#e9c168';
    fillRoundRect(ctx, -2.5, -18, 5, 40, 1, flash ? '#fff' : '#e9c168');
    ctx.fillStyle = flash ? '#fff' : '#8a5b20';
    for (let i = -14; i < 20; i += 5) ctx.fillRect(-2.5, i, 2, 0.8);
    ctx.restore();
  }
  ctx.restore();

  // cabeça
  const headY = -82;
  ctx.fillStyle = flash ? '#fff' : '#c9ae8e';
  fillRoundRect(ctx, -11, headY, 22, 22, 8, flash ? '#fff' : '#c9ae8e');
  // orelhas
  ctx.fillStyle = flash ? '#fff' : '#b99a7c';
  fillCircle(ctx, -10, headY + 10, 3.4, flash ? '#fff' : '#b99a7c');
  fillCircle(ctx, 10, headY + 10, 3.4, flash ? '#fff' : '#b99a7c');
  // cabelo
  ctx.fillStyle = flash ? '#fff' : '#6f665c';
  ctx.beginPath();
  ctx.moveTo(-12, headY + 3);
  ctx.quadraticCurveTo(-13, headY - 4, -4, headY - 3);
  ctx.quadraticCurveTo(4, headY - 6, 12, headY + 1);
  ctx.lineTo(13, headY + 5);
  ctx.quadraticCurveTo(7, headY + 1, 2, headY + 3);
  ctx.quadraticCurveTo(-4, headY + 0, -8, headY + 4);
  ctx.closePath();
  ctx.fill();
  // óculos
  ctx.strokeStyle = flash ? '#fff' : '#3a2a1c';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(1, headY + 8, 7, 5);
  ctx.strokeRect(-8, headY + 8, 7, 5);
  ctx.beginPath(); ctx.moveTo(-1, headY + 10.5); ctx.lineTo(1, headY + 10.5); ctx.stroke();
  ctx.fillStyle = flash ? '#fff' : '#f5e6b3';
  ctx.fillRect(-7.2, headY + 9, 5.4, 2.8);
  ctx.fillRect(1.8, headY + 9, 5.4, 2.8);
  ctx.fillStyle = flash ? '#fff' : '#253027';
  fillCircle(ctx, -4.5, headY + 10.5, 1.05, flash ? '#fff' : '#253027');
  fillCircle(ctx, 4.5, headY + 10.5, 1.05, flash ? '#fff' : '#253027');
  // bigode
  ctx.fillStyle = flash ? '#fff' : '#5a5148';
  ctx.beginPath();
  ctx.moveTo(-4, headY + 17);
  ctx.quadraticCurveTo(0, headY + 15.5, 4, headY + 17);
  ctx.quadraticCurveTo(1, headY + 19, 0, headY + 18);
  ctx.quadraticCurveTo(-1, headY + 19, -4, headY + 17);
  ctx.fill();

  // aura de giz
  if (o.phase === 2) {
    ctx.globalAlpha = 0.35 + Math.sin(t * 5) * 0.12;
    for (let i = 0; i < 5; i++) {
      const ang = t * 0.8 + i * 1.3;
      fillCircle(ctx, Math.cos(ang) * 28, -48 + Math.sin(ang * 1.7) * 20, 1.2, light);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};

/* Professor dos Programas */
BOSS_SPRITES.programas = function (ctx, o) {
  const t = o.t || 0;
  const flash = !!o.flash;
  const st = o.state || 'idle';
  const attack = o.attackName || '';
  const bob = st === 'walk' ? Math.abs(Math.sin(t * 13)) * 1.2 : Math.sin(t * 3) * 0.9;
  const walk = st === 'walk' ? Math.sin(t * 13) : 0;
  const main = bc('programas', 'main', flash);
  const dark = bc('programas', 'dark', flash);
  const light = bc('programas', 'light', flash);
  const accent = bc('programas', 'accent', flash);

  ctx.save();
  ctx.translate(0, bob);
  if (o.phase === 2) glowCircle(ctx, 0, -44, 58, main, 0.12);

  // pernas
  ctx.fillStyle = flash ? '#fff' : '#17212e';
  fillRoundRect(ctx, -12, -30, 9, 30, 3, flash ? '#fff' : '#17212e');
  fillRoundRect(ctx, 3, -30, 9, 30, 3, flash ? '#fff' : '#17212e');
  ctx.fillStyle = flash ? '#fff' : '#0a0e14';
  fillRoundRect(ctx, -14, -5, 12, 5, 2, flash ? '#fff' : '#0a0e14');
  fillRoundRect(ctx, 2, -5, 12, 5, 2, flash ? '#fff' : '#0a0e14');
  ctx.fillStyle = flash ? '#fff' : '#33465d';
  ctx.fillRect(-11, -15 + walk * 2, 7, 2);
  ctx.fillRect(4, -15 - walk * 2, 7, 2);

  // jaleco
  ctx.fillStyle = flash ? '#fff' : '#dbe7ef';
  ctx.beginPath();
  ctx.moveTo(-15, -64);
  ctx.lineTo(15, -64);
  ctx.lineTo(20, -26);
  ctx.lineTo(6, -28);
  ctx.lineTo(0, -24);
  ctx.lineTo(-6, -28);
  ctx.lineTo(-20, -26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = flash ? '#fff' : '#aebfcc';
  ctx.fillRect(-17, -31, 5, 5);
  ctx.fillRect(12, -31, 5, 5);
  // camisa e gravata
  ctx.fillStyle = main;
  ctx.beginPath();
  ctx.moveTo(-7, -64); ctx.lineTo(7, -64); ctx.lineTo(5, -44); ctx.lineTo(0, -38); ctx.lineTo(-5, -44); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = flash ? '#fff' : '#13253a';
  ctx.beginPath();
  ctx.moveTo(-2, -62); ctx.lineTo(2, -62); ctx.lineTo(3, -49); ctx.lineTo(0, -44); ctx.lineTo(-3, -49); ctx.closePath();
  ctx.fill();

  // braços
  ctx.save();
  ctx.translate(-16, -61);
  ctx.rotate(0.2 + (attack === 'compilar' ? -0.4 : 0));
  ctx.fillStyle = flash ? '#fff' : '#dbe7ef';
  fillRoundRect(ctx, -3.5, 0, 7, 24, 3, flash ? '#fff' : '#dbe7ef');
  ctx.fillStyle = flash ? '#fff' : '#aebfcc';
  fillRoundRect(ctx, -4.5, 22, 9, 4, 1.5, flash ? '#fff' : '#aebfcc');
  ctx.restore();

  ctx.save();
  ctx.translate(16, -61);
  let a = -0.15;
  if (attack === 'compilar') a = -1.2;
  if (attack === 'laser') a = -1.45;
  ctx.rotate(a);
  ctx.fillStyle = flash ? '#fff' : '#dbe7ef';
  fillRoundRect(ctx, -3.5, 0, 7, 24, 3, flash ? '#fff' : '#dbe7ef');
  ctx.fillStyle = flash ? '#fff' : '#aebfcc';
  fillRoundRect(ctx, -4.5, 22, 9, 4, 1.5, flash ? '#fff' : '#aebfcc');
  // laptop
  if (attack === 'laser' || st === 'idle' || st === 'walk') {
    ctx.save();
    ctx.translate(0, 26);
    ctx.rotate(0.1);
    ctx.fillStyle = flash ? '#fff' : '#23384d';
    fillRoundRect(ctx, -9, -10, 18, 11, 1.5, flash ? '#fff' : '#23384d');
    ctx.fillStyle = flash ? '#fff' : '#62c7ff';
    ctx.fillRect(-7.5, -8.5, 15, 6.5);
    ctx.fillStyle = flash ? '#fff' : '#0b1e3a';
    for (let i = 0; i < 4; i++) ctx.fillRect(-6.5, -7.5 + i * 1.5, 12 * (0.4 + (i % 2) * 0.3), 0.7);
    ctx.restore();
  }
  ctx.restore();

  // cabeça
  const headY = -81;
  ctx.fillStyle = flash ? '#fff' : '#c7a98c';
  fillRoundRect(ctx, -11, headY, 22, 21, 7, flash ? '#fff' : '#c7a98c');
  // cabelo
  ctx.fillStyle = flash ? '#fff' : '#1c2633';
  ctx.beginPath();
  ctx.moveTo(-12, headY + 4);
  ctx.quadraticCurveTo(-13, headY - 5, -2, headY - 3);
  ctx.quadraticCurveTo(8, headY - 6, 12, headY + 2);
  ctx.lineTo(12, headY + 6);
  ctx.quadraticCurveTo(5, headY + 1, 0, headY + 4);
  ctx.quadraticCurveTo(-5, headY + 0, -10, headY + 5);
  ctx.closePath();
  ctx.fill();
  // óculos
  ctx.strokeStyle = flash ? '#fff' : '#16283d';
  ctx.lineWidth = 1.3;
  ctx.strokeRect(1, headY + 8, 7.5, 5.2);
  ctx.strokeRect(-8.5, headY + 8, 7.5, 5.2);
  ctx.beginPath(); ctx.moveTo(-1, headY + 10.5); ctx.lineTo(1, headY + 10.5); ctx.stroke();
  ctx.fillStyle = flash ? '#fff' : '#d8f4ff';
  ctx.fillRect(-7.4, headY + 9, 5.6, 3.2);
  ctx.fillRect(1.9, headY + 9, 5.6, 3.2);
  ctx.fillStyle = flash ? '#fff' : '#0b1e3a';
  fillCircle(ctx, -4.6, headY + 10.6, 1.1, flash ? '#fff' : '#0b1e3a');
  fillCircle(ctx, 4.6, headY + 10.6, 1.1, flash ? '#fff' : '#0b1e3a');
  // barba
  ctx.fillStyle = flash ? '#fff' : '#28323f';
  fillRoundRect(ctx, -4, headY + 16, 8, 3, 1.5, flash ? '#fff' : '#28323f');

  // glifos de código
  ctx.globalAlpha = 0.5 + Math.sin(t * 4) * 0.18;
  const glyphs = ['{ }', '</>', '01', 'if', '=>'];
  for (let i = 0; i < 4; i++) {
    const gx = Math.sin(t * 0.7 + i * 1.7) * 30;
    const gy = -70 + Math.cos(t * 0.9 + i) * 22;
    drawPixelText(ctx, glyphs[i], gx, gy, 5.5, light, 'center');
  }
  ctx.globalAlpha = 1;
  if (o.phase === 2) {
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 6; i++) {
      const ang = t + i * 1.05;
      fillCircle(ctx, Math.cos(ang) * 30, -42 + Math.sin(ang * 1.4) * 18, 1.1, accent);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};

/* O Último Feiura */
BOSS_SPRITES.feiura = function (ctx, o) {
  const t = o.t || 0;
  const flash = !!o.flash;
  const st = o.state || 'idle';
  const attack = o.attackName || '';
  const bob = st === 'walk' ? Math.abs(Math.sin(t * 11)) * 1.3 : Math.sin(t * 2.2) * 1.1;
  const walk = st === 'walk' ? Math.sin(t * 11) : 0;
  const main = bc('feiura', 'main', flash);
  const dark = bc('feiura', 'dark', flash);
  const light = bc('feiura', 'light', flash);
  const accent = bc('feiura', 'accent', flash);

  ctx.save();
  ctx.translate(0, bob - 2);
  if (o.phase === 2) glowCircle(ctx, 0, -44, 62, main, 0.14);

  // pernas tortas
  ctx.fillStyle = flash ? '#fff' : '#241a2b';
  ctx.save(); ctx.rotate(0.07); fillRoundRect(ctx, -12, -30, 9, 30, 3, flash ? '#fff' : '#241a2b'); ctx.restore();
  ctx.save(); ctx.rotate(-0.09); fillRoundRect(ctx, 3, -30, 9, 30, 3, flash ? '#fff' : '#241a2b'); ctx.restore();
  ctx.fillStyle = flash ? '#fff' : '#120e16';
  fillRoundRect(ctx, -15, -5, 12, 5, 2, flash ? '#fff' : '#120e16');
  fillRoundRect(ctx, 3, -5, 12, 5, 2, flash ? '#fff' : '#120e16');
  // pés descalços/garra
  ctx.fillStyle = light;
  for (let i = 0; i < 3; i++) {
    fillCircle(ctx, -11 + i * 4, -1, 1.1, light);
    fillCircle(ctx, 6 + i * 3, -1, 1.1, light);
  }
  ctx.fillStyle = flash ? '#fff' : '#3a2446';
  ctx.fillRect(-11, -15 + walk * 2, 8, 2);
  ctx.fillRect(4, -15 - walk * 2, 8, 2);

  // torso esfarrapado
  ctx.fillStyle = flash ? '#fff' : '#342141';
  ctx.beginPath();
  ctx.moveTo(-15, -64);
  ctx.lineTo(15, -64);
  ctx.lineTo(17, -28);
  ctx.lineTo(8, -33);
  ctx.lineTo(3, -25);
  ctx.lineTo(-3, -32);
  ctx.lineTo(-9, -24);
  ctx.lineTo(-17, -29);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = main;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(-13, -60);
  ctx.lineTo(13, -60);
  ctx.lineTo(11, -33);
  ctx.lineTo(2, -37);
  ctx.lineTo(-4, -30);
  ctx.lineTo(-10, -36);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  // gravata torta
  ctx.fillStyle = flash ? '#fff' : '#120e16';
  ctx.beginPath();
  ctx.moveTo(-2, -62); ctx.lineTo(3, -61); ctx.lineTo(1, -47); ctx.lineTo(-3, -50); ctx.closePath();
  ctx.fill();

  // braços longos e garras
  ctx.save();
  ctx.translate(-16, -60);
  ctx.rotate(0.35 + (attack === 'garra' ? -1.2 : 0));
  ctx.fillStyle = flash ? '#fff' : '#3a2446';
  fillRoundRect(ctx, -3.4, 0, 6.8, 30, 3, flash ? '#fff' : '#3a2446');
  ctx.fillStyle = light;
  fillCircle(ctx, 0, 31, 3, light);
  ctx.strokeStyle = light;
  ctx.lineWidth = 1.2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(i * 2, 31); ctx.lineTo(i * 4, 40); ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(16, -60);
  let a = -0.2;
  if (attack === 'garra') a = -1.45;
  if (attack === 'orbes') a = -1.1;
  ctx.rotate(a);
  ctx.fillStyle = flash ? '#fff' : '#3a2446';
  fillRoundRect(ctx, -3.4, 0, 6.8, 30, 3, flash ? '#fff' : '#3a2446');
  ctx.fillStyle = light;
  fillCircle(ctx, 0, 31, 3.2, light);
  ctx.strokeStyle = light;
  ctx.lineWidth = 1.4;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(i * 2, 31); ctx.lineTo(i * 5, 42); ctx.stroke();
  }
  ctx.restore();

  // cabeça caída
  ctx.save();
  ctx.translate(1, -78);
  ctx.rotate(0.08);
  ctx.fillStyle = flash ? '#fff' : '#9fae9a';
  fillRoundRect(ctx, -10, 0, 20, 21, 7, flash ? '#fff' : '#9fae9a');
  // cabelo comprido
  ctx.fillStyle = flash ? '#fff' : '#17121d';
  ctx.beginPath();
  ctx.moveTo(-11, 2);
  ctx.quadraticCurveTo(-14, -5, -2, -4);
  ctx.quadraticCurveTo(9, -7, 12, 2);
  ctx.lineTo(14, 26);
  ctx.lineTo(8, 18);
  ctx.lineTo(5, 28);
  ctx.lineTo(0, 18);
  ctx.lineTo(-5, 27);
  ctx.lineTo(-8, 17);
  ctx.lineTo(-13, 24);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-11, 1);
  ctx.quadraticCurveTo(-4, 4, 1, 1);
  ctx.quadraticCurveTo(7, 3, 12, 0);
  ctx.lineTo(12, 8);
  ctx.quadraticCurveTo(2, 11, -11, 7);
  ctx.closePath();
  ctx.fill();
  // olho roxo
  ctx.fillStyle = flash ? '#fff' : '#f1e9ff';
  fillCircle(ctx, 5, 9, 2.7, flash ? '#fff' : '#f1e9ff');
  ctx.fillStyle = accent;
  fillCircle(ctx, 5.4, 9, 1.6, accent);
  ctx.fillStyle = flash ? '#fff' : '#2a0f3a';
  fillCircle(ctx, 5.7, 9, 0.7, flash ? '#fff' : '#2a0f3a');
  // boca rasgada
  ctx.strokeStyle = flash ? '#fff' : '#3a1420';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 16.5);
  ctx.quadraticCurveTo(4, 18.5, 8, 16.2);
  ctx.stroke();
  ctx.fillStyle = flash ? '#fff' : '#f1e9ff';
  ctx.fillRect(2, 17, 1.3, 1.8);
  ctx.fillRect(5, 17.3, 1.3, 1.6);
  ctx.restore();

  // runas
  if (o.phase === 2) {
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 7; i++) {
      const ang = -t * 0.9 + i * 0.9;
      const rx = Math.cos(ang) * 34;
      const ry = -42 + Math.sin(ang * 1.3) * 24;
      drawPixelText(ctx, i % 2 ? '†' : 'ᛟ', rx, ry, 7, light, 'center');
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};

/* O Professor Esquecido */
BOSS_SPRITES.esquecido = function (ctx, o) {
  const t = o.t || 0;
  const flash = !!o.flash;
  const st = o.state || 'idle';
  const attack = o.attackName || '';
  const bob = st === 'walk' ? Math.abs(Math.sin(t * 10)) * 1.6 : Math.sin(t * 2.4) * 1.0;
  const walk = st === 'walk' ? Math.sin(t * 10) : 0;
  const main = bc('esquecido', 'main', flash);
  const dark = bc('esquecido', 'dark', flash);
  const light = bc('esquecido', 'light', flash);
  const accent = bc('esquecido', 'accent', flash);

  ctx.save();
  ctx.translate(0, bob);
  if (o.phase === 2) glowCircle(ctx, 0, -44, 64, main, 0.13);

  // pernas grossas
  ctx.fillStyle = flash ? '#fff' : '#3b1418';
  fillRoundRect(ctx, -15, -31, 12, 31, 4, flash ? '#fff' : '#3b1418');
  fillRoundRect(ctx, 3, -31, 12, 31, 4, flash ? '#fff' : '#3b1418');
  ctx.fillStyle = main;
  ctx.fillRect(-15, -18 + walk * 2, 12, 3);
  ctx.fillRect(3, -18 - walk * 2, 12, 3);
  ctx.fillStyle = flash ? '#fff' : '#e7e2d8';
  fillRoundRect(ctx, -17, -5, 15, 5, 2, flash ? '#fff' : '#e7e2d8');
  fillRoundRect(ctx, 2, -5, 15, 5, 2, flash ? '#fff' : '#e7e2d8');
  ctx.fillStyle = flash ? '#fff' : '#c33a3a';
  ctx.fillRect(-16, -4, 4, 4);
  ctx.fillRect(5, -4, 4, 4);

  // torso largo
  ctx.fillStyle = main;
  fillRoundRect(ctx, -19, -66, 38, 37, 6, main);
  ctx.fillStyle = dark;
  ctx.fillRect(-19, -58, 38, 4);
  ctx.fillStyle = flash ? '#fff' : '#f0e7d6';
  ctx.beginPath();
  ctx.moveTo(-8, -66); ctx.lineTo(8, -66); ctx.lineTo(5, -50); ctx.lineTo(0, -45); ctx.lineTo(-5, -50); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.fillRect(-1, -58, 2, 14);
  // apito
  ctx.strokeStyle = flash ? '#fff' : '#d8d2c8';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(8, -66); ctx.lineTo(15, -58); ctx.stroke();
  ctx.fillStyle = flash ? '#fff' : '#e6c76e';
  fillRoundRect(ctx, 14, -57, 7, 4, 2, flash ? '#fff' : '#e6c76e');
  // número
  drawPixelText(ctx, '66', 0, -58, 9, flash ? '#fff' : '#ffd8c2', 'center');

  // braços
  ctx.save();
  ctx.translate(-20, -62);
  ctx.rotate(0.3 + (attack === 'apito' ? -0.4 : 0));
  ctx.fillStyle = main;
  fillRoundRect(ctx, -4.5, 0, 9, 24, 4, main);
  ctx.fillStyle = light;
  fillCircle(ctx, 0, 25, 4.2, light);
  ctx.restore();

  ctx.save();
  ctx.translate(20, -62);
  let a = -0.3;
  if (attack === 'arremesso') a = -2.2;
  if (attack === 'entrada') a = -1.2;
  if (attack === 'drible') a = -0.9;
  ctx.rotate(a);
  ctx.fillStyle = main;
  fillRoundRect(ctx, -4.5, 0, 9, 24, 4, main);
  ctx.fillStyle = light;
  fillCircle(ctx, 0, 25, 4.2, light);
  // bola
  if (attack === 'arremesso' || attack === 'drible' || st === 'idle' || st === 'walk') {
    ctx.save();
    ctx.translate(0, 29);
    drawBasketball(ctx, 0, 0, 8, t, flash);
    ctx.restore();
  }
  ctx.restore();

  // cabeça
  const headY = -82;
  ctx.fillStyle = flash ? '#fff' : '#b98b6f';
  fillRoundRect(ctx, -12, headY, 24, 22, 8, flash ? '#fff' : '#b98b6f');
  // careca/brilho
  ctx.fillStyle = flash ? '#fff' : '#e0b493';
  ctx.beginPath();
  ctx.ellipse(-2, headY + 5, 8, 4, -0.15, 0, TAU);
  ctx.fill();
  // barba
  ctx.fillStyle = flash ? '#fff' : '#33241f';
  ctx.beginPath();
  ctx.moveTo(-11, headY + 14);
  ctx.quadraticCurveTo(-8, headY + 24, 0, headY + 23);
  ctx.quadraticCurveTo(8, headY + 24, 11, headY + 14);
  ctx.quadraticCurveTo(5, headY + 18, 0, headY + 17);
  ctx.quadraticCurveTo(-5, headY + 18, -11, headY + 14);
  ctx.fill();
  // olhos
  ctx.fillStyle = flash ? '#fff' : '#f4f0e6';
  fillCircle(ctx, -4.5, headY + 10, 2.4, flash ? '#fff' : '#f4f0e6');
  fillCircle(ctx, 4.5, headY + 10, 2.4, flash ? '#fff' : '#f4f0e6');
  ctx.fillStyle = flash ? '#fff' : '#2a1515';
  fillCircle(ctx, -4, headY + 10, 1.1, flash ? '#fff' : '#2a1515');
  fillCircle(ctx, 5, headY + 10, 1.1, flash ? '#fff' : '#2a1515');
  // faixa
  ctx.fillStyle = flash ? '#fff' : '#d33c3c';
  fillRoundRect(ctx, -13, headY + 1, 26, 4, 1, flash ? '#fff' : '#d33c3c');
  ctx.fillStyle = flash ? '#fff' : '#f5e6b3';
  ctx.fillRect(-2, headY + 1.5, 4, 3);
  ctx.restore();
};

/* O Guardião dos Sistemas */
BOSS_SPRITES.guardiao = function (ctx, o) {
  const t = o.t || 0;
  const flash = !!o.flash;
  const st = o.state || 'idle';
  const attack = o.attackName || '';
  const bob = Math.sin(t * 2.8) * 2.2;
  const main = bc('guardiao', 'main', flash);
  const dark = bc('guardiao', 'dark', flash);
  const light = bc('guardiao', 'light', flash);
  const accent = bc('guardiao', 'accent', flash);

  ctx.save();
  ctx.translate(0, bob);
  if (o.phase === 2) glowCircle(ctx, 0, -46, 68, main, 0.16);
  else glowCircle(ctx, 0, -46, 46, main, 0.08);

  // manto/tentáculos
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(-18, -58);
  ctx.quadraticCurveTo(-26, -24, -19, -3);
  ctx.quadraticCurveTo(-12, -10, -8, -1);
  ctx.quadraticCurveTo(-2, -12, 3, -1);
  ctx.quadraticCurveTo(10, -10, 15, -2);
  ctx.quadraticCurveTo(24, -22, 18, -58);
  ctx.closePath();
  ctx.fill();
  // energia nas bordas
  ctx.strokeStyle = withAlpha(main, 0.5);
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-16 + i * 9, -50);
    ctx.quadraticCurveTo(-20 + i * 10, -25, -15 + i * 9, -6);
    ctx.stroke();
  }
  // pernas robóticas ocultas
  ctx.fillStyle = flash ? '#fff' : '#0a1b12';
  fillRoundRect(ctx, -10, -30, 7, 28, 2, flash ? '#fff' : '#0a1b12');
  fillRoundRect(ctx, 3, -30, 7, 28, 2, flash ? '#fff' : '#0a1b12');

  // torso armadura
  ctx.fillStyle = flash ? '#fff' : '#102b1f';
  fillRoundRect(ctx, -16, -68, 32, 38, 5, flash ? '#fff' : '#102b1f');
  ctx.fillStyle = main;
  ctx.beginPath();
  ctx.moveTo(-14, -68); ctx.lineTo(-4, -62); ctx.lineTo(0, -50); ctx.lineTo(4, -62); ctx.lineTo(14, -68);
  ctx.lineTo(12, -38); ctx.lineTo(0, -30); ctx.lineTo(-12, -38); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = flash ? '#fff' : '#0a1b12';
  ctx.fillRect(-12, -48, 24, 3);
  // núcleo
  const corePulse = 0.7 + Math.sin(t * 8) * 0.25;
  ctx.globalAlpha = corePulse;
  fillCircle(ctx, 0, -46, 4.5, light);
  fillCircle(ctx, 0, -46, 2.2, '#fff');
  ctx.globalAlpha = 1;
  // circuitos
  ctx.strokeStyle = withAlpha(accent, 0.7);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-12, -64); ctx.lineTo(-12, -57); ctx.lineTo(-6, -57);
  ctx.moveTo(12, -64); ctx.lineTo(12, -57); ctx.lineTo(6, -57);
  ctx.moveTo(-9, -38); ctx.lineTo(-9, -33); ctx.lineTo(-3, -33);
  ctx.moveTo(9, -38); ctx.lineTo(9, -33); ctx.lineTo(3, -33);
  ctx.stroke();

  // braços
  ctx.save();
  ctx.translate(-18, -63);
  ctx.rotate(0.2 + (attack === 'firewall' ? -0.4 : 0));
  ctx.fillStyle = flash ? '#fff' : '#102b1f';
  fillRoundRect(ctx, -4, 0, 8, 24, 3, flash ? '#fff' : '#102b1f');
  // escudo
  ctx.fillStyle = withAlpha(main, 0.28);
  ctx.strokeStyle = main;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-7, 15, 11, 16, -0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = withAlpha(accent, 0.8);
  ctx.beginPath();
  ctx.ellipse(-7, 15, 7, 12, -0.2, 0, TAU);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(18, -63);
  let a = -0.25;
  if (attack === 'firewall' || attack === 'backup') a = -0.7;
  if (attack === 'varredura') a = -1.1;
  ctx.rotate(a);
  ctx.fillStyle = flash ? '#fff' : '#102b1f';
  fillRoundRect(ctx, -4, 0, 8, 24, 3, flash ? '#fff' : '#102b1f');
  // lâmina de energia
  ctx.fillStyle = withAlpha(accent, 0.9);
  ctx.beginPath();
  ctx.moveTo(-2, 23); ctx.lineTo(2, 23); ctx.lineTo(3, 56); ctx.lineTo(0, 64); ctx.lineTo(-3, 56); ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#fff';
  ctx.fillRect(-1, 25, 2, 34);
  ctx.globalAlpha = 1;
  ctx.restore();

  // cabeça encapuzada
  ctx.fillStyle = flash ? '#fff' : '#0b2117';
  ctx.beginPath();
  ctx.moveTo(-14, -68);
  ctx.quadraticCurveTo(-16, -86, 0, -88);
  ctx.quadraticCurveTo(16, -86, 14, -68);
  ctx.lineTo(8, -72);
  ctx.lineTo(0, -66);
  ctx.lineTo(-8, -72);
  ctx.closePath();
  ctx.fill();
  // rosto/visor
  ctx.fillStyle = flash ? '#fff' : '#06110c';
  fillRoundRect(ctx, -9, -82, 18, 12, 4, flash ? '#fff' : '#06110c');
  ctx.fillStyle = main;
  ctx.globalAlpha = 0.9;
  fillRoundRect(ctx, -8, -79, 16, 3.2, 1.5, main);
  ctx.globalAlpha = 0.25;
  fillRoundRect(ctx, -8, -75, 16, 1.2, 0.6, main);
  ctx.globalAlpha = 1;
  // olhos
  fillCircle(ctx, -4, -77.5, 1.2, '#fff');
  fillCircle(ctx, 4, -77.5, 1.2, '#fff');
  // capuz detalhe
  ctx.strokeStyle = withAlpha(main, 0.6);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-11, -72); ctx.lineTo(-5, -68);
  ctx.moveTo(11, -72); ctx.lineTo(5, -68);
  ctx.stroke();

  // orbes
  if (o.phase === 2 || attack === 'sistemas') {
    ctx.globalAlpha = 0.75;
    for (let i = 0; i < 4; i++) {
      const ang = t * 1.8 + i * TAU / 4;
      const ox = Math.cos(ang) * 32;
      const oy = -45 + Math.sin(ang) * 20;
      fillCircle(ctx, ox, oy, 2.4, accent);
      glowCircle(ctx, ox, oy, 8, accent, 0.25);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};

function drawBasketball(ctx, x, y, r, t, flash) {
  ctx.fillStyle = flash ? '#fff' : '#d8792e';
  fillCircle(ctx, x, y, r, flash ? '#fff' : '#d8792e');
  ctx.strokeStyle = flash ? '#fff' : '#3a1e0f';
  ctx.lineWidth = Math.max(0.7, r * 0.12);
  ctx.beginPath(); ctx.arc(x, y, r * 0.94, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
  ctx.beginPath(); ctx.arc(x - r * 0.5, y, r * 0.7, -1.1, 1.1); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + r * 0.5, y, r * 0.7, Math.PI - 1.1, Math.PI + 1.1); ctx.stroke();
}

/* ---------------- inimigos ---------------- */

function drawEnemySprite(ctx, type, x, y, opts) {
  const o = opts || {};
  const t = o.t || 0;
  const flash = !!o.flash;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(o.facing === -1 ? -1 : 1, o.scale || 1);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;

  if (type === 'eco') {
    const bob = Math.sin(t * 4 + x * 0.1) * 2.5;
    glowCircle(ctx, 0, -19 + bob, 18, '#d9fff0', 0.13);
    ctx.fillStyle = flash ? '#fff' : '#d6e6dd';
    ctx.beginPath();
    ctx.moveTo(-9, -10 + bob);
    ctx.quadraticCurveTo(-11, -27 + bob, 0, -29 + bob);
    ctx.quadraticCurveTo(11, -27 + bob, 9, -10 + bob);
    ctx.lineTo(6, -5 + bob);
    ctx.lineTo(3, -11 + bob);
    ctx.lineTo(0, -5 + bob);
    ctx.lineTo(-3, -11 + bob);
    ctx.lineTo(-6, -5 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = flash ? '#fff' : '#6e8a7e';
    ctx.fillRect(-5, -22 + bob, 3, 3);
    ctx.fillRect(2, -22 + bob, 3, 3);
    ctx.fillStyle = flash ? '#fff' : '#1a2b22';
    ctx.fillRect(-4.2, -21 + bob, 1.4, 1.4);
    ctx.fillRect(2.8, -21 + bob, 1.4, 1.4);
    ctx.strokeStyle = flash ? '#fff' : '#6e8a7e';
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-2, -15 + bob); ctx.lineTo(2, -15 + bob); ctx.stroke();
    // partículas de giz
    ctx.globalAlpha = 0.45;
    for (let i = 0; i < 3; i++) {
      const a = t * 2 + i * 2.1;
      fillCircle(ctx, Math.cos(a) * 12, -16 + Math.sin(a) * 8 + bob, 0.8, '#e8fff5');
    }
  } else if (type === 'bug') {
    const wob = Math.sin(t * 16 + x) * 1.2;
    glowCircle(ctx, 0, -8, 13, '#54ffb4', 0.12);
    ctx.fillStyle = flash ? '#fff' : '#142a20';
    fillRoundRect(ctx, -8, -10 + wob, 16, 8, 3, flash ? '#fff' : '#142a20');
    ctx.fillStyle = flash ? '#fff' : '#3dffa2';
    ctx.fillRect(-6, -8 + wob, 3, 2);
    ctx.fillRect(3, -8 + wob, 3, 2);
    ctx.fillStyle = flash ? '#fff' : '#0a140f';
    ctx.fillRect(-5.8, -7.8 + wob, 1.3, 1.3);
    ctx.fillRect(4.5, -7.8 + wob, 1.3, 1.3);
    ctx.strokeStyle = flash ? '#fff' : '#3dffa2';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * 4, -10 + wob); ctx.lineTo(i * 6, -15 + wob); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i * 4, -2 + wob); ctx.lineTo(i * 6, 3 + wob); ctx.stroke();
    }
    ctx.fillStyle = flash ? '#fff' : '#b7ffd6';
    ctx.fillRect(6.5, -6 + wob, 2, 1);
  } else if (type === 'spectral') {
    const bob = Math.sin(t * 3.2 + x * 0.07) * 3;
    glowCircle(ctx, 0, -18 + bob, 21, '#c77dff', 0.16);
    ctx.fillStyle = flash ? '#fff' : 'rgba(199,125,255,0.82)';
    ctx.beginPath();
    ctx.moveTo(-8, -7 + bob);
    ctx.quadraticCurveTo(-12, -24 + bob, 0, -27 + bob);
    ctx.quadraticCurveTo(12, -24 + bob, 8, -7 + bob);
    ctx.lineTo(5, -2 + bob);
    ctx.lineTo(2, -9 + bob);
    ctx.lineTo(-1, -3 + bob);
    ctx.lineTo(-4, -9 + bob);
    ctx.lineTo(-7, -2 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = flash ? '#fff' : '#210d30';
    ctx.fillRect(-5, -19 + bob, 3.2, 2.2);
    ctx.fillRect(2, -19 + bob, 3.2, 2.2);
    ctx.fillStyle = flash ? '#fff' : '#ff7de9';
    ctx.fillRect(-4.3, -18.6 + bob, 1.1, 1.1);
    ctx.fillRect(2.7, -18.6 + bob, 1.1, 1.1);
  } else if (type === 'book') {
    const bob = Math.sin(t * 5 + x) * 1.2;
    ctx.fillStyle = flash ? '#fff' : '#5c2a20';
    fillRoundRect(ctx, -8, -18 + bob, 16, 10, 1, flash ? '#fff' : '#5c2a20');
    ctx.fillStyle = flash ? '#fff' : '#d9b56c';
    ctx.fillRect(-7, -16 + bob, 14, 1.4);
    ctx.fillStyle = flash ? '#fff' : '#f3e2b0';
    ctx.fillRect(-6, -14 + bob, 5, 5);
  } else {
    fillCircle(ctx, 0, -8, 8, flash ? '#fff' : '#fff');
  }
  ctx.restore();
}

/* ---------------- projéteis ---------------- */

function drawProjectileSprite(ctx, p, t) {
  if (!p) return;
  const flash = !!p.flash;
  ctx.save();
  ctx.translate(p.x, p.y);
  const angle = p.angle != null ? p.angle : (p.spin || 0) * 0.2;
  ctx.rotate(angle);
  const scale = p.scale || 1;
  ctx.scale(scale, scale);
  if (p.alpha != null) ctx.globalAlpha = p.alpha;

  if (p.type === 'book') {
    glowCircle(ctx, 0, 0, 13, '#ffd98a', 0.12);
    ctx.fillStyle = flash ? '#fff' : '#76392b';
    fillRoundRect(ctx, -7, -5, 14, 10, 1.5, flash ? '#fff' : '#76392b');
    ctx.fillStyle = flash ? '#fff' : '#f4e3b0';
    fillRect(-5.5, -3.5, 11, 7);
    ctx.fillStyle = flash ? '#fff' : '#b99a62';
    fillRect(-1, -3.5, 2, 7);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = flash ? '#fff' : '#8d7856';
      ctx.fillRect(-4.5, -2 + i * 2, 8, 0.7);
    }
  } else if (p.type === 'paper') {
    glowCircle(ctx, 0, 0, 11, '#fff8cf', 0.1);
    ctx.fillStyle = flash ? '#fff' : '#f2ecd8';
    ctx.beginPath();
    ctx.moveTo(-5, -6); ctx.lineTo(5, -6); ctx.lineTo(6, 5); ctx.lineTo(-4, 6); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = flash ? '#fff' : '#a3a088';
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(-3, -3 + i * 3); ctx.lineTo(4, -3 + i * 3); ctx.stroke();
    }
  } else if (p.type === 'code') {
    glowCircle(ctx, 0, 0, 17, '#62c7ff', 0.18);
    ctx.fillStyle = flash ? '#fff' : '#0a1d32';
    fillRoundRect(ctx, -8, -7, 16, 14, 2, flash ? '#fff' : '#0a1d32');
    ctx.strokeStyle = flash ? '#fff' : '#62c7ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-8, -7, 16, 14);
    drawPixelText(ctx, '</>', 0, 0, 6.5, flash ? '#fff' : '#bff4ff', 'center');
  } else if (p.type === 'orb' || p.type === 'spectralOrb') {
    const col = p.type === 'orb' ? '#c77dff' : '#ff7de9';
    glowCircle(ctx, 0, 0, 18, col, 0.25);
    fillCircle(ctx, 0, 0, 6.5, flash ? '#fff' : col);
    fillCircle(ctx, 0, 0, 3.2, flash ? '#fff' : '#fff0ff');
    ctx.strokeStyle = withAlpha(col, 0.7);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, 9 + Math.sin(t * 6) * 1.2, 0, TAU); ctx.stroke();
  } else if (p.type === 'greenOrb') {
    glowCircle(ctx, 0, 0, 18, '#35e08b', 0.25);
    fillCircle(ctx, 0, 0, 6.2, flash ? '#fff' : '#35e08b');
    fillCircle(ctx, 0, 0, 2.8, flash ? '#fff' : '#d6fff0');
    ctx.strokeStyle = withAlpha('#62fff0', 0.7);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, 9.5, t * 2, t * 2 + 4.4); ctx.stroke();
  } else if (p.type === 'ball') {
    drawBasketball(ctx, 0, 0, 7, t, flash);
    ctx.save();
    ctx.globalAlpha = 0.25;
    fillCircle(ctx, 0, 0, 10, '#ffb347');
    ctx.restore();
  } else if (p.type === 'chalk') {
    glowCircle(ctx, 0, 0, 11, '#fff6b0', 0.16);
    ctx.fillStyle = flash ? '#fff' : '#f5efc0';
    fillRoundRect(ctx, -2.5, -7, 5, 14, 1.5, flash ? '#fff' : '#f5efc0');
    ctx.fillStyle = flash ? '#fff' : '#b7ac72';
    ctx.fillRect(-1, -5, 2, 3);
  } else if (p.type === 'blade') {
    glowCircle(ctx, 0, 0, 22, '#62fff0', 0.2);
    ctx.fillStyle = flash ? '#fff' : '#62fff0';
    ctx.beginPath();
    ctx.moveTo(-10, -2); ctx.lineTo(8, -2); ctx.lineTo(13, 0); ctx.lineTo(8, 2); ctx.lineTo(-10, 2); ctx.closePath();
    ctx.fill();
  } else {
    glowCircle(ctx, 0, 0, 12, p.color || '#fff', 0.2);
    fillCircle(ctx, 0, 0, 5, flash ? '#fff' : (p.color || '#fff'));
  }
  ctx.restore();
}

/* ---------------- perigos ---------------- */

function drawHazardSprite(ctx, h, t) {
  if (!h) return;
  const warn = h.state === 'warn';
  const prog = warn ? clamp(h.timer / Math.max(0.001, h.warnTime), 0, 1) : 1;
  const active = h.state === 'active';
  const kind = h.kind || 'zone';
  ctx.save();

  if (kind === 'laser') {
    const alpha = warn ? 0.16 + prog * 0.25 : 0.8;
    const col = h.color || '#ff5d5d';
    if (warn) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(h.x, h.y, h.w, h.h);
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.12 + Math.sin(t * 18) * 0.04;
      ctx.fillStyle = col;
      ctx.fillRect(h.x, h.y, h.w, h.h);
    } else if (active) {
      glowCircle(ctx, h.x + h.w / 2, h.y + h.h / 2, Math.max(h.w, 30) * 0.38, col, 0.2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = col;
      ctx.fillRect(h.x, h.y - 2, h.w, h.h + 4);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      const core = Math.max(2, h.h * 0.25);
      ctx.fillRect(h.x, h.y + h.h / 2 - core / 2, h.w, core);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = col;
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(h.x + ((t * 160 + i * 47) % Math.max(1, h.w)), h.y - 3 - i, 3, 2);
      }
    }
  } else if (kind === 'shockwave') {
    const r = h.radius || 0;
    ctx.globalAlpha = active ? 0.75 : 0.25;
    ctx.strokeStyle = h.color || '#ffb347';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, TAU); ctx.stroke();
    ctx.globalAlpha = active ? 0.25 : 0.12;
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(h.x, h.y, Math.max(1, r - 2), 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (kind === 'circle') {
    const col = h.color || '#c77dff';
    const cx = h.x + h.w / 2;
    const cy = h.y + h.h / 2;
    const r = Math.min(h.w, h.h) * 0.45;
    ctx.globalAlpha = warn ? 0.28 + prog * 0.35 : 0.85;
    ctx.strokeStyle = col;
    ctx.lineWidth = warn ? 1.2 : 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    ctx.globalAlpha = warn ? 0.1 : 0.25;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = col;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 6; i++) {
      const a = t * 0.8 + i * TAU / 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55);
      ctx.lineTo(cx + Math.cos(a) * r * 1.12, cy + Math.sin(a) * r * 1.12);
      ctx.stroke();
    }
    if (active) {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = col;
      for (let i = 0; i < 4; i++) {
        const a = i * TAU / 4 + t;
        const px = cx + Math.cos(a) * r * 0.5;
        ctx.beginPath();
        ctx.moveTo(px - 3, cy);
        ctx.lineTo(px + 3, cy);
        ctx.lineTo(px, cy - 18 - h.h * 0.3);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else if (kind === 'flame') {
    const col = h.color || '#c77dff';
    const base = h.y + h.h;
    ctx.globalAlpha = warn ? 0.2 : 0.8;
    for (let i = 0; i < 9; i++) {
      const fx = h.x + i * h.w / 9;
      const fh = 14 + Math.sin(t * 12 + i) * 8 + prog * 8;
      ctx.fillStyle = i % 2 ? col : '#ff7de9';
      ctx.beginPath();
      ctx.moveTo(fx, base);
      ctx.quadraticCurveTo(fx - 5, base - fh * 0.5, fx + h.w / 18, base - fh);
      ctx.quadraticCurveTo(fx + h.w / 9 + 5, base - fh * 0.5, fx + h.w / 9, base);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    // zonas de impacto / colunas de giz / espinhos
    const col = h.color || (h.kind === 'chalk' ? '#fff3b0' : '#ff6b6b');
    if (warn) {
      ctx.globalAlpha = 0.1 + prog * 0.22;
      ctx.fillStyle = col;
      ctx.fillRect(h.x, h.y, h.w, h.h);
      ctx.globalAlpha = 0.45 + Math.sin(t * 20) * 0.15;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(h.x, h.y, h.w, h.h);
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(h.x + h.w / 2 - 5, h.y + h.h / 2);
      ctx.lineTo(h.x + h.w / 2 + 5, h.y + h.h / 2);
      ctx.moveTo(h.x + h.w / 2, h.y + h.h / 2 - 5);
      ctx.lineTo(h.x + h.w / 2, h.y + h.h / 2 + 5);
      ctx.stroke();
    } else if (active) {
      glowCircle(ctx, h.x + h.w / 2, h.y + h.h / 2, Math.max(h.w, h.h) * 0.5, col, 0.2);
      ctx.globalAlpha = 0.85;
      if (h.kind === 'chalk') {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(h.x + 2, h.y + h.h);
        ctx.lineTo(h.x + h.w / 2, h.y);
        ctx.lineTo(h.x + h.w - 2, h.y + h.h);
        ctx.closePath();
        ctx.fill();
      } else if (h.kind === 'spike') {
        ctx.fillStyle = col;
        for (let i = 0; i < 4; i++) {
          const px = h.x + i * h.w / 4;
          ctx.beginPath();
          ctx.moveTo(px, h.y + h.h);
          ctx.lineTo(px + h.w / 8, h.y - 8);
          ctx.lineTo(px + h.w / 4, h.y + h.h);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        ctx.fillStyle = col;
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#fff';
        ctx.fillRect(h.x + h.w * 0.3, h.y, h.w * 0.12, h.h);
      }
    }
  }
  ctx.restore();
}

/* ---------------- HUD e itens ---------------- */

function drawKey(ctx, x, y, scale, t, color) {
  const s = scale || 1;
  const col = color || '#f2c45a';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(Math.sin(t * 2) * 0.08);
  glowCircle(ctx, 0, 0, 22, col, 0.25);
  ctx.strokeStyle = '#4a3310';
  ctx.lineWidth = 3;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(-5, 0, 7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-5, 0, 3, 0, TAU); ctx.stroke();
  ctx.fillStyle = col;
  fillRoundRect(ctx, -2, -2.5, 17, 5, 1.5, col);
  ctx.strokeStyle = '#4a3310';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-2, -2.5, 17, 5);
  ctx.fillStyle = col;
  ctx.fillRect(10, 2, 3, 5);
  ctx.fillRect(14, 2, 3, 7);
  ctx.strokeStyle = '#4a3310';
  ctx.strokeRect(10, 2, 3, 5);
  ctx.strokeRect(14, 2, 3, 7);
  ctx.restore();
}

function drawHeart(ctx, x, y, size, filled, color) {
  const s = size || 10;
  const col = color || '#ff5d7a';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 10, s / 10);
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.bezierCurveTo(-9, -3, -6, -9, 0, -5);
  ctx.bezierCurveTo(6, -9, 9, -3, 0, 3);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = '#3a0c18';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-2.8, -3.4, 1.7, 1.1, -0.5, 0, TAU);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,190,205,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawLoreIcon(ctx, x, y, t, scale) {
  const s = scale || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  glowCircle(ctx, 0, 0, 16, '#c77dff', 0.22);
  ctx.fillStyle = '#f1e6d0';
  ctx.rotate(Math.sin(t * 2) * 0.08);
  ctx.fillRect(-5, -7, 10, 14);
  ctx.fillStyle = '#c9bfa8';
  ctx.fillRect(-5, -7, 10, 1.5);
  ctx.fillStyle = '#8c6fae';
  for (let i = 0; i < 4; i++) ctx.fillRect(-3.5, -3 + i * 2.2, 7, 0.7);
  ctx.fillStyle = '#c77dff';
  ctx.fillRect(-5, -7, 2, 14);
  ctx.restore();
}

function drawBossPortrait(ctx, id, x, y, w, h, t, phase) {
  ctx.save();
  ctx.fillStyle = 'rgba(3,10,7,0.92)';
  fillRoundRect(ctx, x, y, w, h, 3, 'rgba(3,10,7,0.92)');
  ctx.beginPath();
  fillRoundRect(ctx, x, y, w, h, 3, 'rgba(3,10,7,0.92)');
  ctx.clip();
  const col = (ART.bosses[id] || ART.bosses.mestre).main;
  glowCircle(ctx, x + w * 0.5, y + h * 0.68, w * 0.55, col, 0.15);
  drawBossSprite(ctx, id, x + w * 0.5, y + h * 1.62, {
    t: t,
    state: 'idle',
    phase: phase || 1,
    scale: h / 100,
    facing: 1
  });
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = withAlpha(col, 0.75);
  ctx.lineWidth = 1.2;
  fillRoundRect(ctx, x, y, w, h, 3, 'rgba(0,0,0,0)');
  ctx.stroke();
  bracketCorner(ctx, x + 2, y + 2, w - 4, h - 4, withAlpha(col, 0.55), 8, 1);
  ctx.restore();
}

