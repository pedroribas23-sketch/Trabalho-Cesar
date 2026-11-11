/* =========================================================
   KENNEDITO — cenários procedurais (corredor, salas, quadra,
   laboratório, portão da escola e chuva)
   ========================================================= */
'use strict';

/* ---------------- pequenos cenários ---------------- */

function drawCeilingLight(ctx, x, y, t, color, broken) {
  const flicker = broken ? (Math.sin(t * 17 + x) > 0.5 ? 0.15 : 0.8) : 0.8;
  ctx.save();
  ctx.globalAlpha = flicker;
  ctx.fillStyle = '#0b120e';
  ctx.fillRect(x - 26, y, 52, 3);
  ctx.fillStyle = color || '#d9ffe9';
  ctx.fillRect(x - 21, y + 3, 42, 2);
  glowCircle(ctx, x, y + 4, 38, color || '#d9ffe9', 0.16);
  ctx.globalAlpha = flicker * 0.08;
  ctx.fillStyle = color || '#d9ffe9';
  ctx.beginPath();
  ctx.moveTo(x - 21, y + 5);
  ctx.lineTo(x + 21, y + 5);
  ctx.lineTo(x + 43, 300);
  ctx.lineTo(x - 43, 300);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWindow(ctx, x, y, w, h, t, rain, frost) {
  ctx.save();
  ctx.fillStyle = '#050d0b';
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#0a1b21');
  sky.addColorStop(0.6, '#0c2526');
  sky.addColorStop(1, '#071311');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // lua
  ctx.fillStyle = 'rgba(210,255,230,0.15)';
  fillCircle(ctx, x + w * 0.72, y + h * 0.22, Math.min(w, h) * 0.12, 'rgba(210,255,230,0.15)');
  // chuva
  if (rain) {
    ctx.strokeStyle = 'rgba(150,220,200,0.28)';
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 14; i++) {
      const rx = x + ((hash(i + x) * w + t * (17 + i * 2)) % w);
      const ry = y + ((hash(i * 3 + x) * h + t * (45 + i * 5)) % h);
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 1.5, ry + 5); ctx.stroke();
    }
  }
  // reflexo/brilho
  ctx.fillStyle = 'rgba(150,220,200,0.045)';
  ctx.beginPath(); ctx.moveTo(x, y + h * 0.6); ctx.lineTo(x + w, y + h * 0.3); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
  // grades
  ctx.strokeStyle = '#1f3028';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
  if (frost) {
    ctx.strokeStyle = 'rgba(210,255,235,0.22)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x + w * 0.3, y + h * 0.4); ctx.lineTo(x + w * 0.2, y + h - 2); ctx.stroke();
  }
  ctx.strokeStyle = '#263b30';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function drawLockerBank(ctx, x, y, w, h, t, acid) {
  ctx.save();
  ctx.fillStyle = '#111b16';
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  const cols = Math.max(1, Math.floor(w / 30));
  const cw = w / cols;
  for (let i = 0; i < cols; i++) {
    const lx = x + i * cw;
    ctx.fillStyle = i % 2 ? '#1b2b22' : '#17251d';
    ctx.fillRect(lx, y, cw - 2, h);
    ctx.fillStyle = '#0b120e';
    ctx.fillRect(lx + 3, y + 6, cw - 8, 2);
    ctx.fillRect(lx + 3, y + 10, cw - 8, 1);
    ctx.fillRect(lx + cw - 8, y + h * 0.45, 3, 2);
    ctx.fillStyle = 'rgba(88,255,157,0.12)';
    ctx.fillRect(lx + 2, y + 2, cw - 6, 1);
    if (hash(i + x) > 0.72) {
      ctx.fillStyle = '#2c3f34';
      ctx.fillRect(lx + cw * 0.3, y + h * 0.35, cw * 0.4, h * 0.12);
      ctx.fillStyle = acid || '#8dff6a';
      ctx.fillRect(lx + cw * 0.35, y + h * 0.38, cw * 0.3, 1.5);
    }
    if (hash(i * 2 + x) > 0.88) {
      ctx.strokeStyle = '#3b2b24';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx + 4, y + h - 4); ctx.lineTo(lx + cw * 0.5, y + h * 0.7); ctx.lineTo(lx + cw - 4, y + h - 2);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#2b4034';
  ctx.fillRect(x, y - 8, w, 5);
  ctx.restore();
}

function drawPoster(ctx, x, y, w, h, kind, t) {
  ctx.save();
  ctx.fillStyle = kind === 'red' ? '#3a1616' : (kind === 'purple' ? '#2c1838' : '#1a2a22');
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(220,255,235,0.18)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  if (kind === 'red') {
    ctx.fillStyle = '#ff8a7a';
    drawPixelText(ctx, 'NÃO', x + w / 2, y + 7, 6, '#ffb0a6', 'center');
    ctx.fillStyle = '#ff5d5d';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 14); ctx.lineTo(x + w * 0.36, y + h - 4); ctx.lineTo(x + w * 0.64, y + h - 4); ctx.closePath(); ctx.fill();
  } else if (kind === 'purple') {
    ctx.strokeStyle = '#c77dff';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.28, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w / 2, y + 5); ctx.lineTo(x + w / 2, y + h - 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 6, y + h / 2); ctx.lineTo(x + w - 6, y + h / 2); ctx.stroke();
    ctx.fillStyle = '#e2b6ff';
    drawPixelText(ctx, '†', x + w / 2, y + h - 5, 7, '#e2b6ff', 'center');
  } else {
    ctx.fillStyle = '#b8ffd6';
    drawPixelText(ctx, 'CEPK', x + w / 2, y + 8, 7, '#b8ffd6', 'center');
    ctx.fillStyle = '#6d8a79';
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 5, y + 16 + i * 4, w - 10, 1);
    ctx.fillStyle = '#1fc46f';
    ctx.fillRect(x + 4, y + h - 5, w - 8, 2);
  }
  ctx.restore();
}

function drawCrack(ctx, x, y, len, t, color) {
  ctx.save();
  ctx.strokeStyle = color || 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 0.8;
  let cx = x, cy = y;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  for (let i = 0; i < len; i++) {
    cx += hash(i + x) * 8 - 3;
    cy += 4 + hash(i * 2 + y) * 4;
    ctx.lineTo(cx, cy);
    if (i % 3 === 0) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + hash(i * 3) * 8 - 4, cy + 6);
      ctx.moveTo(cx, cy);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawDesk(ctx, x, y, w, h, t, color, broken) {
  ctx.save();
  const base = color || '#2a2119';
  ctx.fillStyle = base;
  fillRoundRect(ctx, x - w / 2, y - 6, w, 6, 1.5, base);
  ctx.fillStyle = mixColor(base, '#000000', 0.25);
  ctx.fillRect(x - w / 2 + 3, y, 3, h);
  ctx.fillRect(x + w / 2 - 6, y, 3, h);
  ctx.fillStyle = mixColor(base, '#ffffff', 0.08);
  ctx.fillRect(x - w / 2 + 2, y - 6, w - 4, 1);
  if (broken) {
    ctx.strokeStyle = '#0a0806';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.2, y - 6); ctx.lineTo(x + w * 0.05, y - 1); ctx.lineTo(x - w * 0.1, y + 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawChalkboard(ctx, x, y, w, h, text, accent, t) {
  ctx.save();
  ctx.fillStyle = '#16100a';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = '#1a2b21';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  ctx.fillRect(x, y, w, 2);
  ctx.strokeStyle = 'rgba(220,255,230,0.1)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = withAlpha(accent || '#b8ffd6', 0.72);
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  const lines = String(text || '').split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, x + w / 2, y + 15 + i * 13);
  });
  // rabiscos
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = accent || '#b8ffd6';
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 5; i++) {
    const sx = x + 12 + hash(i + x) * (w - 24);
    const sy = y + 10 + hash(i * 3 + y) * (h - 20);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + 10, sy - 8, sx + 18, sy + 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.5;
  // giz
  ctx.fillStyle = 'rgba(240,255,240,0.35)';
  ctx.fillRect(x + w - 22, y + h - 5, 9, 1.5);
  ctx.fillStyle = '#0e1712';
  ctx.fillRect(x - 4, y + h + 4, w + 8, 4);
  ctx.restore();
}

function drawBookshelf(ctx, x, y, w, h, t) {
  ctx.save();
  ctx.fillStyle = '#1c130d';
  ctx.fillRect(x, y, w, h);
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    const ry = y + r * h / rows;
    ctx.fillStyle = '#2b1d12';
    ctx.fillRect(x + 3, ry + h / rows - 4, w - 6, 3);
    let bx = x + 5;
    while (bx < x + w - 5) {
      const bw = 3 + hash(r * 10 + bx) * 4;
      const bh = 7 + hash(r * 3 + bx) * 7;
      ctx.fillStyle = ['#5b3a23', '#394c33', '#4a2a31', '#6a5432'][Math.floor(hash(bx + r) * 4)];
      ctx.fillRect(bx, ry + h / rows - 4 - bh, bw, bh);
      bx += bw + 1.5;
    }
  }
  ctx.strokeStyle = '#0a0705';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

/* ---------------- fundos por sala ---------------- */

function drawRoomBackground(ctx, room, camX, t, game) {
  ctx.fillStyle = '#030806';
  ctx.fillRect(0, 0, GAME_W, GAME_H);
  if (!room) return;
  if (room.bg === 'hub') drawHubBackground(ctx, room, camX, t, game);
  else if (room.bg === 'classroom') drawClassroomBackground(ctx, room, camX, t, game);
  else if (room.bg === 'gym') drawGymBackground(ctx, room, camX, t, game);
  else if (room.bg === 'lab') drawLabBackground(ctx, room, camX, t, game);
  else drawGateScene(ctx, t, 'title');
}

function drawWorldDoor(ctx, door, camX, floorY, state, t) {
  const x = door.x - camX;
  if (x < -80 || x > GAME_W + 80) return;
  const w = 58;
  const h = 96;
  const y = floorY - h;
  const locked = state === 'locked';
  const cleared = state === 'cleared';
  const accent = door.color || '#58ff9d';
  ctx.save();
  // moldura
  ctx.fillStyle = '#0a0e0c';
  ctx.fillRect(x - w / 2 - 5, y - 6, w + 10, h + 6);
  ctx.fillStyle = '#202b24';
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.fillStyle = locked ? '#1a1714' : '#1b2a21';
  ctx.fillRect(x - w / 2 + 3, y + 3, w - 6, h - 6);
  // painéis
  ctx.strokeStyle = '#0a100c';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2 + 6, y + 8, w - 12, h * 0.38);
  ctx.strokeRect(x - w / 2 + 6, y + h * 0.5, w - 12, h * 0.38);
  // vidro
  ctx.fillStyle = 'rgba(88,255,157,0.045)';
  ctx.fillRect(x - 13, y + 12, 26, 22);
  ctx.strokeStyle = 'rgba(88,255,157,0.18)';
  ctx.strokeRect(x - 13, y + 12, 26, 22);
  // maçaneta
  ctx.fillStyle = locked ? '#4a3a22' : accent;
  fillCircle(ctx, x + w / 2 - 11, y + h * 0.58, 2, locked ? '#4a3a22' : accent);
  // placa
  ctx.fillStyle = '#07110b';
  ctx.fillRect(x - w / 2 - 2, y - 25, w + 4, 18);
  ctx.strokeStyle = withAlpha(accent, 0.55);
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2 - 2, y - 25, w + 4, 18);
  drawPixelText(ctx, door.label || 'SALA', x, y - 16, 6.5, locked ? '#7c8d82' : accent, 'center');
  // status
  if (locked) {
    // correntes
    ctx.strokeStyle = '#6d6a5c';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 2, y + h * 0.35); ctx.lineTo(x + w / 2 - 2, y + h * 0.52); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w / 2 - 2, y + h * 0.35); ctx.lineTo(x - w / 2 + 2, y + h * 0.52); ctx.stroke();
    // cadeado
    ctx.fillStyle = '#b08b35';
    fillRoundRect(ctx, x - 7, y + h * 0.48, 14, 11, 2, '#b08b35');
    ctx.strokeStyle = '#b08b35';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y + h * 0.48, 5, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#34240c';
    ctx.fillRect(x - 1, y + h * 0.51, 2, 3);
    ctx.globalAlpha = 0.25 + Math.sin(t * 3) * 0.1;
    glowCircle(ctx, x, y + h * 0.5, 28, '#ff5d5d', 0.2);
    ctx.globalAlpha = 1;
  } else if (cleared) {
    drawPixelText(ctx, '✓', x + w / 2 - 9, y + h * 0.34, 10, accent, 'center');
    ctx.globalAlpha = 0.18 + Math.sin(t * 2) * 0.05;
    glowCircle(ctx, x, y + h * 0.5, 34, accent, 0.18);
    ctx.globalAlpha = 1;
  } else {
    ctx.globalAlpha = 0.16 + Math.sin(t * 2.2) * 0.05;
    glowCircle(ctx, x, y + h * 0.5, 34, accent, 0.18);
    ctx.globalAlpha = 0.5;
    drawPixelText(ctx, '→', x + w / 2 - 9, y + h * 0.34, 9, accent, 'center');
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawHubBackground(ctx, room, camX, t, game) {
  // parede e piso
  ctx.fillStyle = '#101814';
  ctx.fillRect(0, 0, GAME_W, 360);
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 300);
  wallGrad.addColorStop(0, '#0b120f');
  wallGrad.addColorStop(0.55, '#152019');
  wallGrad.addColorStop(1, '#0c1410');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, GAME_W, 300);
  // painéis distantes
  const far = camX * 0.35;
  ctx.strokeStyle = 'rgba(88,255,157,0.045)';
  ctx.lineWidth = 1;
  for (let x = -((far) % 90); x < GAME_W; x += 90) {
    ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, 295); ctx.stroke();
  }
  // janelas ao fundo
  for (let i = 0; i < 5; i++) {
    const wx = i * 360 + 120 - camX * 0.55;
    if (wx > -100 && wx < GAME_W + 30) drawWindow(ctx, wx, 88, 86, 92, t, true, false);
  }
  // rodapé
  ctx.fillStyle = '#0a100d';
  ctx.fillRect(0, 288, GAME_W, 12);
  // piso
  const floorGrad = ctx.createLinearGradient(0, 300, 0, 360);
  floorGrad.addColorStop(0, '#1b251f');
  floorGrad.addColorStop(1, '#080d0a');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 300, GAME_W, 60);
  // linhas do piso
  ctx.strokeStyle = 'rgba(130,190,155,0.08)';
  ctx.lineWidth = 1;
  for (let i = -1; i < 12; i++) {
    const gx = i * 80 - (camX % 80);
    ctx.beginPath(); ctx.moveTo(gx, 300); ctx.lineTo(gx - 28, 360); ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 0.1;
    ctx.beginPath(); ctx.moveTo(0, 306 + i * 14); ctx.lineTo(GAME_W, 306 + i * 14); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // armários e portas
  drawLockerBank(ctx, 60 - camX, 168, 230, 120, t, '#8dff6a');
  drawLockerBank(ctx, 330 - camX, 168, 190, 120, t, '#8dff6a');
  drawLockerBank(ctx, 1480 - camX, 168, 240, 120, t, '#8dff6a');
  if (room.doors) {
    room.doors.forEach((door) => {
      let state = 'available';
      if (game && game.getDoorState) state = game.getDoorState(door);
      drawWorldDoor(ctx, door, camX, room.floorY || 300, state, t);
    });
  }
  // luminárias
  for (let i = 0; i < 7; i++) {
    const lx = i * 330 + 180 - camX * 0.35;
    if (lx > -50 && lx < GAME_W + 50) drawCeilingLight(ctx, lx, 24, t, '#d9ffe9', i === 3);
  }
  // cartazes e rachaduras
  drawPoster(ctx, 40 - camX, 90, 44, 58, 'green', t);
  drawPoster(ctx, 560 - camX, 100, 40, 52, 'red', t);
  drawPoster(ctx, 1180 - camX, 92, 44, 58, 'green', t);
  drawPoster(ctx, 1820 - camX, 100, 40, 52, 'purple', t);
  drawCrack(ctx, 760 - camX, 70, 12, t, 'rgba(0,0,0,0.5)');
  drawCrack(ctx, 1360 - camX, 120, 9, t, 'rgba(0,0,0,0.45)');
  // planta morta
  const px = 1290 - camX;
  if (px > -50 && px < GAME_W + 20) {
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(px - 10, 272, 20, 28);
    ctx.fillStyle = '#3a2c1d';
    ctx.fillRect(px - 12, 270, 24, 5);
    ctx.strokeStyle = '#2f4a32';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(px, 272);
      ctx.quadraticCurveTo(px + Math.sin(i * 2) * 16, 248 - i * 3, px + Math.sin(i * 1.3) * 24, 236 + i * 5);
      ctx.stroke();
    }
  }
  // neblina no chão
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 3; i++) {
    const fx = (i * 260 - camX * 0.2 + t * 8) % (GAME_W + 200) - 100;
    ctx.fillStyle = '#b8ffd6';
    ctx.beginPath(); ctx.ellipse(fx, 296, 120, 12, 0, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // escurecimento
  const vg = ctx.createRadialGradient(GAME_W / 2, 180, 120, GAME_W / 2, 180, 390);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
}

function drawClassroomBackground(ctx, room, camX, t, game) {
  const boss = room.boss || 'mestre';
  const palettes = {
    mestre: { wall: '#282116', wall2: '#1a150e', floor: '#1b1610', accent: '#d7a64a', board: '#1c2b20', window: '#f5d58a' },
    programas: { wall: '#101a2b', wall2: '#0b111c', floor: '#0c121b', accent: '#4fa3ff', board: '#0e2330', window: '#8ad9ff' },
    feiura: { wall: '#1f1228', wall2: '#120a17', floor: '#100a14', accent: '#a45bd8', board: '#241430', window: '#d9a7ff' },
    esquecido: { wall: '#261816', wall2: '#160d0c', floor: '#1d1411', accent: '#e05252', board: '#231b17', window: '#ffb37a' }
  };
  const p = palettes[boss] || palettes.mestre;
  // parede
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 300);
  wallGrad.addColorStop(0, p.wall2);
  wallGrad.addColorStop(0.6, p.wall);
  wallGrad.addColorStop(1, p.wall2);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, GAME_W, 300);
  // painéis
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const x = i * 110 - (camX * 0.22) % 110;
    ctx.beginPath(); ctx.moveTo(x, 35); ctx.lineTo(x, 292); ctx.stroke();
  }
  // janelas
  const winAt = [80, 470, 880, 1290];
  winAt.forEach((wx, i) => {
    const x = wx - camX * 0.55;
    if (x > -120 && x < GAME_W + 40) drawWindow(ctx, x, 82, 88, 104, t, true, boss === 'feiura');
  });
  // lousa
  const boardText = {
    mestre: 'PROVA FINAL\nSEGUNDA CHAMADA: NUNCA',
    programas: 'while (vivo) {\n  estudar();\n}',
    feiura: 'A ESCOLA NUNCA MORRE\nVOCÊ TAMBÉM NÃO',
    esquecido: ''
  }[boss] || '';
  if (boss !== 'esquecido') {
    const bx = 215 - camX * 0.78;
    if (bx > -100 && bx < GAME_W + 20) drawChalkboard(ctx, bx, 60, 210, 78, boardText, p.accent, t);
  }
  // relógio quebrado
  const clockX = 560 - camX * 0.65;
  if (clockX > -30 && clockX < GAME_W + 30) {
    ctx.fillStyle = '#0b0c0a';
    fillCircle(ctx, clockX, 62, 15, '#0b0c0a');
    ctx.strokeStyle = '#4f4535';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(clockX, 62, 12, 0, TAU); ctx.stroke();
    ctx.strokeStyle = p.accent;
    ctx.beginPath(); ctx.moveTo(clockX, 62); ctx.lineTo(clockX + 2, 54); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(clockX, 62); ctx.lineTo(clockX + 7, 65); ctx.stroke();
  }
  // cartazes
  drawPoster(ctx, 20 - camX, 120, 44, 58, boss === 'feiura' ? 'purple' : (boss === 'programas' ? 'green' : 'red'), t);
  drawPoster(ctx, 960 - camX, 108, 42, 56, boss === 'mestre' ? 'red' : 'green', t);
  // prateleiras/monitores específicos
  if (boss === 'mestre') {
    drawBookshelf(ctx, 1130 - camX, 150, 80, 110, t);
    drawBookshelf(ctx, 1230 - camX, 180, 66, 80, t);
  } else if (boss === 'programas') {
    for (let i = 0; i < 3; i++) {
      drawMonitorStack(ctx, 1080 + i * 68 - camX, 188 - i * 12, t, i, p.accent);
    }
  } else if (boss === 'feiura') {
    // runas na parede
    ctx.globalAlpha = 0.35 + Math.sin(t * 2) * 0.1;
    for (let i = 0; i < 4; i++) {
      const rx = 1080 + i * 46 - camX;
      drawPixelText(ctx, i % 2 ? 'ᛟ' : '†', rx, 140 + Math.sin(t + i) * 6, 22, p.accent, 'center');
    }
    ctx.globalAlpha = 1;
    drawCrack(ctx, 980 - camX, 44, 16, t, 'rgba(199,125,255,0.45)');
    drawCrack(ctx, 380 - camX, 100, 12, t, 'rgba(0,0,0,0.5)');
  }
  // chão
  const floorGrad = ctx.createLinearGradient(0, 300, 0, 360);
  floorGrad.addColorStop(0, p.floor);
  floorGrad.addColorStop(1, '#070907');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 300, GAME_W, 60);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const gx = i * 72 - (camX % 72);
    ctx.beginPath(); ctx.moveTo(gx, 300); ctx.lineTo(gx - 20, 360); ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 0.12;
    ctx.beginPath(); ctx.moveTo(0, 306 + i * 14); ctx.lineTo(GAME_W, 306 + i * 14); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // carteiras ao fundo
  for (let i = 0; i < 6; i++) {
    const dx = 180 + i * 170 - camX * 0.82;
    if (dx > -60 && dx < GAME_W + 40) {
      drawDesk(ctx, dx, 282, 42, 18, t, boss === 'feiura' ? '#2a1b2c' : '#2b2119', i % 3 === 0);
    }
  }
  // luzes
  for (let i = 0; i < 5; i++) {
    const lx = i * 150 + 120 - camX * 0.4;
    if (lx > -40 && lx < GAME_W + 20) drawCeilingLight(ctx, lx, 20, t, p.window, i === 2);
  }
  // névoa colorida
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = p.accent;
  ctx.beginPath(); ctx.ellipse(GAME_W / 2, 280, 330, 55, 0, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
  // vinheta
  const vg = ctx.createRadialGradient(GAME_W / 2, 180, 110, GAME_W / 2, 180, 380);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
}

function drawMonitorStack(ctx, x, y, t, seed, accent) {
  ctx.save();
  ctx.fillStyle = '#0a1119';
  ctx.fillRect(x, y, 54, 44);
  ctx.fillStyle = '#0c1a22';
  ctx.fillRect(x + 3, y + 3, 48, 34);
  ctx.fillStyle = withAlpha(accent, 0.22);
  ctx.fillRect(x + 3, y + 3, 48, 34);
  ctx.fillStyle = accent;
  ctx.fillRect(x + 6, y + 7, 18 + (seed * 7) % 20, 1.5);
  ctx.fillRect(x + 6, y + 11, 30, 1);
  ctx.fillRect(x + 6, y + 15, 12, 1);
  ctx.globalAlpha = 0.5 + Math.sin(t * 4 + seed) * 0.2;
  ctx.fillRect(x + 6, y + 22, 26, 1);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1b2b32';
  ctx.fillRect(x + 24, y + 37, 6, 4);
  ctx.fillRect(x + 14, y + 41, 26, 2);
  ctx.restore();
}

function drawGymBackground(ctx, room, camX, t, game) {
  // parede
  const wall = ctx.createLinearGradient(0, 0, 0, 300);
  wall.addColorStop(0, '#120c0c');
  wall.addColorStop(0.55, '#281817');
  wall.addColorStop(1, '#120c0b');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, GAME_W, 300);
  // blocos de concreto
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  for (let y = 40; y < 290; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_W, y); ctx.stroke();
  }
  for (let i = 0; i < 9; i++) {
    const x = i * 80 - (camX * 0.18) % 80;
    ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, 290); ctx.stroke();
  }
  // arquibancadas
  for (let row = 0; row < 4; row++) {
    const y = 208 + row * 22;
    const h = 14;
    ctx.fillStyle = row % 2 ? '#241715' : '#1e1312';
    ctx.fillRect(0, y, GAME_W, h);
    ctx.fillStyle = '#3a2520';
    ctx.fillRect(0, y, GAME_W, 2);
    // torcida vazia / vultos
    for (let i = 0; i < 20; i++) {
      const sx = i * 38 + row * 13 - (camX * 0.45) % 38;
      if (hash(i * 3 + row) > 0.75) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        fillCircle(ctx, sx, y - 4, 4, 'rgba(0,0,0,0.65)');
        ctx.fillRect(sx - 4, y - 1, 8, 5);
        ctx.fillStyle = 'rgba(255,120,100,0.25)';
        ctx.fillRect(sx - 1, y - 5, 1.5, 1.5);
      }
    }
  }
  // faixas
  const banners = [
    { x: 110, text: 'CEPK', color: '#b03030' },
    { x: 320, text: 'CAMPEÕES', color: '#a07b35' },
    { x: 530, text: '1998', color: '#7d3030' }
  ];
  banners.forEach((b) => {
    const x = b.x - camX * 0.7;
    if (x < -80 || x > GAME_W + 80) return;
    ctx.fillStyle = '#0c0807';
    ctx.fillRect(x - 38, 44, 76, 5);
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(x - 34, 49); ctx.lineTo(x + 34, 49); ctx.lineTo(x + 27, 94); ctx.lineTo(x, 84); ctx.lineTo(x - 27, 94); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,230,200,0.8)';
    drawPixelText(ctx, b.text, x, 68, 7, 'rgba(255,230,200,0.85)', 'center');
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - 30, 86); ctx.lineTo(x - 34, 50); ctx.stroke();
  });
  // placar
  const sbX = 404 - camX * 0.75;
  if (sbX > -80 && sbX < GAME_W + 80) {
    ctx.fillStyle = '#080807';
    ctx.fillRect(sbX - 48, 102, 96, 44);
    ctx.strokeStyle = '#4a3a22';
    ctx.lineWidth = 2;
    ctx.strokeRect(sbX - 46, 104, 92, 40);
    ctx.fillStyle = '#ff8a5a';
    ctx.globalAlpha = 0.8 + Math.sin(t * 5) * 0.15;
    drawPixelText(ctx, '66 : 0', sbX, 120, 13, '#ff8a5a', 'center');
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#8a6a3a';
    drawPixelText(ctx, '4º TEMPO', sbX, 135, 5, '#8a6a3a', 'center');
  }
  // cestas
  for (let i = 0; i < 3; i++) {
    const hx = 200 + i * 310 - camX * 0.82;
    if (hx < -100 || hx > GAME_W + 100) continue;
    ctx.strokeStyle = '#4a3424';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(hx, 150); ctx.lineTo(hx, 46); ctx.stroke();
    ctx.fillStyle = '#d7d0c2';
    ctx.fillRect(hx - 32, 54, 64, 36);
    ctx.strokeStyle = '#4a3424';
    ctx.lineWidth = 2;
    ctx.strokeRect(hx - 32, 54, 64, 36);
    ctx.fillStyle = '#b03030';
    ctx.fillRect(hx - 12, 62, 24, 14);
    ctx.strokeStyle = '#e06a2e';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hx, 94, 14, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,220,220,0.5)';
    ctx.lineWidth = 1;
    for (let j = 0; j < 7; j++) {
      const a = j / 7 * TAU;
      ctx.beginPath(); ctx.moveTo(hx + Math.cos(a) * 14, 94 + Math.sin(a) * 3); ctx.lineTo(hx + Math.cos(a) * 16, 106 + Math.sin(a) * 3); ctx.stroke();
    }
  }
  // luzes de emergência
  for (let i = 0; i < 4; i++) {
    const lx = 160 + i * 260 - camX * 0.5;
    if (lx < -40 || lx > GAME_W + 40) continue;
    ctx.fillStyle = '#1a1210';
    fillRoundRect(ctx, lx - 14, 24, 28, 8, 2, '#1a1210');
    ctx.fillStyle = '#ff5d5d';
    ctx.globalAlpha = 0.55 + Math.sin(t * 4 + i) * 0.25;
    fillCircle(ctx, lx, 30, 3.5, '#ff5d5d');
    glowCircle(ctx, lx, 32, 32, '#ff5d5d', 0.1);
    ctx.globalAlpha = 1;
  }
  // piso de quadra
  const floor = ctx.createLinearGradient(0, 300, 0, 360);
  floor.addColorStop(0, '#3a2519');
  floor.addColorStop(1, '#150d09');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 300, GAME_W, 60);
  // tábuas
  for (let i = 0; i < 12; i++) {
    const y = 302 + i * 5;
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, y, GAME_W, 1);
    ctx.globalAlpha = 1;
  }
  // linhas da quadra
  ctx.strokeStyle = 'rgba(240,220,180,0.23)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 328); ctx.lineTo(GAME_W, 328); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 306); ctx.lineTo(GAME_W, 306); ctx.stroke();
  const center = 700 - camX * 0.6;
  if (center > -100 && center < GAME_W + 100) {
    ctx.beginPath(); ctx.arc(center, 330, 46, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(center, 306); ctx.lineTo(center, 354); ctx.stroke();
  }
  // sujeira
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 8; i++) {
    const sx = (hash(i + 40) * 1200 - camX) % GAME_W;
    ctx.fillStyle = '#0a0705';
    ctx.beginPath(); ctx.ellipse(sx, 318 + hash(i) * 32, 12 + hash(i * 2) * 20, 2, 0, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // vinheta
  const vg = ctx.createRadialGradient(GAME_W / 2, 180, 110, GAME_W / 2, 180, 380);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
}

function drawLabBackground(ctx, room, camX, t, game) {
  // parede
  const wall = ctx.createLinearGradient(0, 0, 0, 300);
  wall.addColorStop(0, '#030b08');
  wall.addColorStop(0.6, '#0a1a14');
  wall.addColorStop(1, '#030906');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, GAME_W, 300);
  // painéis metálicos
  ctx.strokeStyle = 'rgba(53,224,139,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const x = i * 74 - (camX * 0.2) % 74;
    ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, 292); ctx.stroke();
  }
  for (let y = 44; y < 290; y += 62) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_W, y); ctx.stroke();
  }
  // racks de servidores
  for (let i = 0; i < 6; i++) {
    const rx = 60 + i * 230 - camX * 0.68;
    if (rx > -80 && rx < GAME_W + 80) drawServerRack(ctx, rx, 92, 84, 188, t, i);
  }
  // tubos de vidro
  const tubeX = 330 - camX * 0.9;
  if (tubeX > -80 && tubeX < GAME_W + 80) drawLabTube(ctx, tubeX, 152, 44, 128, t, 1);
  const tube2 = 860 - camX * 0.9;
  if (tube2 > -80 && tube2 < GAME_W + 80) drawLabTube(ctx, tube2, 170, 40, 110, t, 2);
  // tela holográfica
  const hx = 520 - camX * 0.75;
  if (hx > -140 && hx < GAME_W + 140) {
    ctx.save();
    ctx.globalAlpha = 0.32 + Math.sin(t * 3) * 0.06;
    ctx.fillStyle = 'rgba(53,224,139,0.12)';
    ctx.fillRect(hx, 56, 190, 104);
    ctx.strokeStyle = 'rgba(53,224,139,0.7)';
    ctx.lineWidth = 1;
    ctx.strokeRect(hx, 56, 190, 104);
    ctx.globalAlpha = 0.75;
    drawPixelText(ctx, 'PROJETO ATLAS', hx + 95, 72, 8, '#8affc1', 'center');
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#35e08b' : '#62fff0';
      ctx.fillRect(hx + 14 + i * 27, 88, 18, 1.2);
      ctx.fillRect(hx + 14 + i * 27, 94 + i * 4, 25 - i * 2, 1);
    }
    // gráfico
    ctx.strokeStyle = '#35e08b';
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const px = hx + 14 + i * 7;
      const py = 142 - Math.abs(Math.sin(i * 0.8 + t * 2)) * 24;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#62fff0';
    ctx.strokeRect(hx + 12, 128, 166, 24);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  // cabos
  ctx.strokeStyle = 'rgba(20,60,40,0.9)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const cx = i * 120 - camX * 0.55;
    ctx.beginPath();
    ctx.moveTo(cx, 34);
    ctx.bezierCurveTo(cx + 30, 90, cx - 20, 160, cx + 15, 292);
    ctx.stroke();
  }
  // chão metálico
  const floor = ctx.createLinearGradient(0, 300, 0, 360);
  floor.addColorStop(0, '#0b1a14');
  floor.addColorStop(1, '#020705');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 300, GAME_W, 60);
  ctx.strokeStyle = 'rgba(53,224,139,0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const gx = i * 58 - (camX % 58);
    ctx.beginPath(); ctx.moveTo(gx, 300); ctx.lineTo(gx - 18, 360); ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 0.12;
    ctx.beginPath(); ctx.moveTo(0, 306 + i * 14); ctx.lineTo(GAME_W, 306 + i * 14); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // faixas de alerta
  for (let i = 0; i < 3; i++) {
    const ax = 80 + i * 260 - camX * 0.8;
    ctx.globalAlpha = 0.4;
    for (let j = 0; j < 8; j++) {
      ctx.fillStyle = j % 2 ? '#1a1a10' : '#d7a64a';
      ctx.fillRect(ax + j * 12, 284, 12, 5);
    }
    ctx.globalAlpha = 1;
  }
  // luzes verdes
  for (let i = 0; i < 7; i++) {
    const lx = 120 + i * 120 - camX * 0.45;
    if (lx < -30 || lx > GAME_W + 30) continue;
    ctx.fillStyle = '#04140d';
    fillRoundRect(ctx, lx - 10, 22, 20, 6, 2, '#04140d');
    ctx.fillStyle = '#35e08b';
    ctx.globalAlpha = 0.5 + Math.sin(t * 3 + i) * 0.2;
    ctx.fillRect(lx - 7, 24, 14, 2);
    glowCircle(ctx, lx, 28, 28, '#35e08b', 0.09);
    ctx.globalAlpha = 1;
  }
  // partículas
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 16; i++) {
    const px = (hash(i + 5) * 1200 - camX + t * 8) % GAME_W;
    const py = 80 + hash(i * 3) * 210 + Math.sin(t + i) * 4;
    fillCircle(ctx, px, py, 0.8, '#8affc1');
  }
  ctx.globalAlpha = 1;
  // vinheta
  const vg = ctx.createRadialGradient(GAME_W / 2, 180, 100, GAME_W / 2, 180, 380);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
}

function drawServerRack(ctx, x, y, w, h, t, seed) {
  ctx.fillStyle = '#050d0a';
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = '#0a1711';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(53,224,139,0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  const rows = Math.floor(h / 14);
  for (let i = 0; i < rows; i++) {
    const ry = y + 6 + i * 14;
    ctx.fillStyle = '#0d2118';
    ctx.fillRect(x + 5, ry, w - 10, 9);
    ctx.fillStyle = '#050907';
    for (let j = 0; j < 5; j++) ctx.fillRect(x + 7, ry + 2 + j * 1.4, w - 16, 0.6);
    const blink = hash(seed * 11 + i) > 0.5;
    if (blink) {
      ctx.fillStyle = Math.sin(t * 6 + i) > 0 ? '#35e08b' : '#0c3a24';
      ctx.fillRect(x + w - 11, ry + 2, 2, 2);
    }
    if (i % 3 === 0) {
      ctx.fillStyle = 'rgba(98,255,240,0.55)';
      ctx.fillRect(x + 7, ry + 7, 10 + (seed * 3) % 12, 0.8);
    }
  }
  // ventilador
  const fy = y + h - 14;
  ctx.strokeStyle = 'rgba(53,224,139,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x + w / 2, fy, 6, 0, TAU); ctx.stroke();
  ctx.beginPath();
  const a = t * 4 + seed;
  ctx.moveTo(x + w / 2, fy);
  ctx.lineTo(x + w / 2 + Math.cos(a) * 5, fy + Math.sin(a) * 5);
  ctx.stroke();
}

function drawLabTube(ctx, x, y, w, h, t, seed) {
  ctx.save();
  ctx.fillStyle = '#06120d';
  fillRoundRect(ctx, x - 4, y - 4, w + 8, h + 8, 6, '#06120d');
  ctx.fillStyle = 'rgba(53,224,139,0.12)';
  fillRoundRect(ctx, x, y, w, h, 5, 'rgba(53,224,139,0.12)');
  ctx.strokeStyle = 'rgba(138,255,193,0.55)';
  ctx.lineWidth = 1.3;
  roundRectPath(ctx, x, y, w, h, 5);
  ctx.stroke();
  // líquido
  const liquid = 0.5 + Math.sin(t * 1.4 + seed) * 0.04;
  ctx.fillStyle = 'rgba(53,224,139,0.18)';
  ctx.fillRect(x + 4, y + h * (1 - liquid), w - 8, h * liquid - 4);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#8affc1';
  ctx.fillRect(x + 4, y + h * (1 - liquid), w - 8, 1.5);
  ctx.globalAlpha = 1;
  // silhueta
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#06120d';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.55, w * 0.16, w * 0.14, 0, 0, TAU);
  ctx.fill();
  ctx.fillRect(x + w * 0.34, y + h * 0.63, w * 0.32, h * 0.25);
  ctx.globalAlpha = 1;
  // bolhas
  for (let i = 0; i < 5; i++) {
    const by = y + h - ((t * (10 + i * 3) + i * 23) % (h - 12));
    fillCircle(ctx, x + w * (0.25 + hash(i + seed) * 0.5), by, 1 + hash(i) * 1.5, 'rgba(138,255,193,0.6)');
  }
  ctx.restore();
}

/* ---------------- plataformas ---------------- */

function drawPlatform(ctx, p, camX, t, room) {
  const x = p.x - camX;
  if (x > GAME_W + 20 || x + p.w < -20) return;
  const style = room && room.bg;
  const y = p.y;
  ctx.save();
  if (style === 'classroom') {
    const col = room.boss === 'feiura' ? '#2c1d30' : (room.boss === 'programas' ? '#1c2936' : '#34281b');
    ctx.fillStyle = '#0a0806';
    ctx.fillRect(x, y, p.w, p.h);
    ctx.fillStyle = col;
    ctx.fillRect(x + 2, y + 2, p.w - 4, 5);
    ctx.fillStyle = mixColor(col, '#ffffff', 0.12);
    ctx.fillRect(x + 2, y + 2, p.w - 4, 1);
    // pernas
    for (let i = 0; i < Math.max(2, Math.floor(p.w / 22)); i++) {
      const lx = x + 6 + i * (p.w - 12) / Math.max(1, Math.floor(p.w / 22) - 1);
      ctx.fillStyle = mixColor(col, '#000000', 0.35);
      ctx.fillRect(lx, y + 7, 3, Math.max(0, p.h - 7));
    }
    // livros
    if (p.w > 32) {
      ctx.fillStyle = '#5a3a23';
      ctx.fillRect(x + 6, y - 4, 9, 3);
      ctx.fillStyle = '#3d4d35';
      ctx.fillRect(x + 17, y - 3, 7, 2);
    }
  } else if (style === 'gym') {
    ctx.fillStyle = '#1a100c';
    ctx.fillRect(x, y, p.w, p.h);
    ctx.fillStyle = '#4a2e1e';
    ctx.fillRect(x + 2, y + 2, p.w - 4, 4);
    ctx.fillStyle = '#7a4a2c';
    ctx.fillRect(x + 2, y + 2, p.w - 4, 1);
    ctx.fillStyle = '#2e1b12';
    ctx.fillRect(x + 5, y + 6, 4, p.h - 6);
    ctx.fillRect(x + p.w - 9, y + 6, 4, p.h - 6);
    // linha de quadra
    ctx.strokeStyle = 'rgba(240,220,180,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 2, y + 4); ctx.lineTo(x + p.w - 2, y + 4); ctx.stroke();
  } else if (style === 'lab') {
    ctx.fillStyle = '#04100b';
    ctx.fillRect(x, y, p.w, p.h);
    ctx.fillStyle = '#0c281a';
    ctx.fillRect(x + 2, y + 2, p.w - 4, 5);
    ctx.strokeStyle = 'rgba(53,224,139,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, p.w - 4, 5);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = 'rgba(53,224,139,0.45)';
      ctx.fillRect(x + 8 + i * 14, y + 4, 4, 1.2);
    }
  } else {
    ctx.fillStyle = '#1a1510';
    ctx.fillRect(x, y, p.w, p.h);
    ctx.fillStyle = '#3a2c1d';
    ctx.fillRect(x + 2, y + 2, p.w - 4, 4);
    ctx.fillStyle = '#5b4630';
    ctx.fillRect(x + 2, y + 2, p.w - 4, 1);
  }
  ctx.restore();
}

/* ---------------- portão / título ---------------- */

function drawGateScene(ctx, t, mode) {
  const cutscene = mode === 'cutscene';
  let kennX = 286;
  let kennFacing = 1;
  let gateOpen = 0;
  let lightsOut = 0;
  let keyGlow = 0;
  let keyInserted = 0;
  let walking = false;
  let kennAlpha = 1;
  let flash = 0;

  if (cutscene) {
    if (t < 3.2) {
      const p = clamp(t / 3.2, 0, 1);
      kennX = lerp(96, 286, easeInOut(p));
      walking = true;
      kennFacing = 1;
    } else if (t < 5.4) {
      kennX = 286;
      kennFacing = 1;
      keyGlow = clamp((t - 3.2) / 0.8, 0, 1) * (t < 5.0 ? 1 : 1 - (t - 5.0) / 0.4);
    } else if (t < 6.2) {
      kennX = 286;
      kennFacing = 1;
      keyInserted = clamp((t - 5.4) / 0.8, 0, 1);
      keyGlow = keyInserted < 1 ? 0.6 : 1;
    } else if (t < 9.4) {
      kennX = 286;
      kennFacing = 1;
      gateOpen = clamp((t - 6.2) / 1.8, 0, 1);
    } else if (t < 12.8) {
      const p = clamp((t - 9.4) / 3.0, 0, 1);
      kennX = lerp(286, 500, easeInOut(p));
      kennFacing = 1;
      gateOpen = 1;
      walking = p < 0.85;
      kennAlpha = t > 12.4 ? 1 - (t - 12.4) / 0.4 : 1;
    } else {
      gateOpen = clamp(1 - (t - 12.8) / 1.5, 0, 1);
      lightsOut = clamp((t - 14.0) / 2.4, 0, 1);
      kennAlpha = 0;
    }
    if (t > 1 && t < 1.2) flash = 0.35;
    if (t > 10.2 && t < 10.4) flash = 0.2;
  } else {
    const drift = Math.sin(t * 0.25) * 8;
    kennX = 292 + drift;
    kennFacing = 1;
    flash = (t % 9.5) > 9.28 ? 0.4 : 0;
  }

  // céu
  const sky = ctx.createLinearGradient(0, 0, 0, 320);
  sky.addColorStop(0, '#010504');
  sky.addColorStop(0.55, '#06120f');
  sky.addColorStop(1, '#0b1d17');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, GAME_W, 360);
  // lua
  ctx.globalAlpha = 0.55;
  fillCircle(ctx, 505, 52, 20, '#c8ffee');
  glowCircle(ctx, 505, 52, 60, '#8affc1', 0.13);
  ctx.globalAlpha = 0.25;
  fillCircle(ctx, 505, 52, 30, '#c8ffee');
  ctx.globalAlpha = 1;
  // nuvens
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 170 + t * 5) % 820) - 90;
    ctx.fillStyle = '#0b1a16';
    ctx.beginPath(); ctx.ellipse(cx, 42 + i * 9, 90, 14, 0, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // árvores
  for (let i = 0; i < 7; i++) {
    const tx = i * 112 - 40;
    ctx.fillStyle = '#030807';
    ctx.beginPath();
    ctx.moveTo(tx, 318); ctx.lineTo(tx + 26, 210 + hash(i) * 45); ctx.lineTo(tx + 52, 318); ctx.closePath(); ctx.fill();
    ctx.fillRect(tx + 22, 260, 6, 60);
  }
  // prédio
  drawSchoolBuilding(ctx, t, lightsOut);
  // portão e cerca
  drawSchoolFence(ctx, 0, 220, 214, 10);
  drawSchoolFence(ctx, 426, 220, 214, 10);
  drawGate(ctx, 320, 218, 108, 102, gateOpen, t);
  // calçada/rua
  ctx.fillStyle = '#0a100e';
  ctx.fillRect(0, 314, GAME_W, 46);
  ctx.fillStyle = '#0d1512';
  ctx.fillRect(0, 314, GAME_W, 6);
  ctx.fillStyle = '#070b09';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(i * 86, 330, 2, 30);
  }
  ctx.fillStyle = 'rgba(120,255,190,0.045)';
  ctx.fillRect(0, 344, GAME_W, 2);
  // poças
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? '#8affc1' : '#d7a64a';
    ctx.beginPath();
    ctx.ellipse(70 + i * 132, 342 + hash(i) * 10, 28, 3, 0, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // poste
  drawStreetLamp(ctx, 78, 312, t);
  // kennedito
  if (kennAlpha > 0.01) {
    if (o_pauseShadow()) { /* no-op */ }
    ctx.save();
    ctx.globalAlpha = kennAlpha;
    groundShadow(ctx, kennX, 326, 16, 0.35);
    drawKennedito(ctx, kennX, 326, {
      facing: kennFacing,
      t: t,
      state: walking ? 'run' : 'idle',
      scale: 0.86,
      attackPose: keyInserted > 0 && keyInserted < 1 ? 1 : 0,
      showBook: keyInserted > 0 && keyInserted < 1
    });
    ctx.restore();
  }
  // chave brilhando
  if (keyGlow > 0 && kennAlpha > 0.01) {
    const kx = kennX + 8;
    const ky = 326 - 23 + (keyInserted > 0 ? keyInserted * 3 : 0);
    ctx.globalAlpha = 0.5 + keyGlow * 0.5;
    drawKey(ctx, kx, ky, 0.55 + Math.sin(t * 4) * 0.04, t, '#f2c45a');
    ctx.globalAlpha = 1;
  }
  // chuva
  drawRain(ctx, t, 0.55);
  // relâmpago
  if (flash > 0) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#d9ffe9';
    ctx.fillRect(0, 0, GAME_W, 360);
    ctx.globalAlpha = 1;
  }
  // escurecer janelas
  if (lightsOut > 0) {
    ctx.globalAlpha = lightsOut * 0.75;
    ctx.fillStyle = '#020504';
    ctx.fillRect(0, 0, GAME_W, 360);
    ctx.globalAlpha = 1;
  }
  // vinheta
  const vg = ctx.createRadialGradient(GAME_W / 2, 190, 120, GAME_W / 2, 190, 430);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
}

/* ---------------- cena de entrada na sala do chefe ---------------- */

function drawBossEntryScene(ctx, t, room, bossId, game) {
  // t: 0 -> 6.4s
  const floorY = room.floorY || 300;
  const arena = room.arena || { left: 20, right: room.width - 20, bossX: room.width - 260, camX: 0 };
  const bossDef = (typeof BOSS_DEFS !== 'undefined' && BOSS_DEFS[bossId]) ? BOSS_DEFS[bossId] : null;
  const bossColor = (bossDef && bossDef.color) || '#58ff9d';

  // câmera: começa na porta e desliza até a arena
  const panStart = 1.5;
  const panEnd = 4.4;
  const camX = t <= panStart ? 0 : lerp(0, arena.camX, easeInOut(clamp((t - panStart) / (panEnd - panStart), 0, 1)));
  const camMax = Math.max(0, room.width - GAME_W);
  const cam = clamp(camX, 0, camMax);

  // jogador entra pela porta
  const walkEnd = 2.6;
  const playerX = t < walkEnd ? lerp(70, 330, easeInOut(clamp(t / walkEnd, 0, 1))) : 330;
  const playerAlpha = t > 2.4 ? clamp(1 - (t - 2.4) / 0.7, 0, 1) : 1;

  // porta fechando
  const doorClose = clamp((t - 0.7) / 0.55, 0, 1);
  const doorX = 60;
  const doorW = 56 * (1 - doorClose);

  // luzes acendendo
  const lightsOn = clamp((t - 1.9) / 1.4, 0, 1);
  const flicker = (t > 1.9 && t < 2.9) ? (Math.sin(t * 46) > 0 ? 1 : 0.25) : 1;

  // chefe aparece
  const bossAlpha = clamp((t - 3.1) / 1.1, 0, 1);
  const bossX = arena.bossX;

  drawRoomBackground(ctx, room, cam, t, game);

  // plataformas
  if (room.platforms) {
    for (let i = 0; i < room.platforms.length; i++) {
      drawPlatform(ctx, room.platforms[i], cam, t, room);
    }
  }

  // escurecer antes das luzes
  if (lightsOn < 1) {
    ctx.save();
    ctx.globalAlpha = (1 - lightsOn) * 0.72;
    ctx.fillStyle = '#010403';
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.restore();
  }

  // porta que fecha
  if (doorW > 1) {
    ctx.save();
    ctx.fillStyle = '#131b16';
    ctx.fillRect(doorX - cam - 4, floorY - 96, 8 + doorW, 96);
    ctx.fillStyle = '#1c2620';
    ctx.fillRect(doorX - cam, floorY - 92, doorW, 92);
    ctx.strokeStyle = 'rgba(88,255,157,0.22)';
    ctx.lineWidth = 1;
    ctx.strokeRect(doorX - cam + 3, floorY - 88, Math.max(1, doorW - 6), 84);
    ctx.restore();
  }

  // poeira da porta batendo
  if (t > 0.75 && t < 1.5) {
    ctx.save();
    ctx.globalAlpha = clamp(1 - (t - 0.75) / 0.75, 0, 1) * 0.5;
    ctx.fillStyle = '#9fb8a8';
    for (let i = 0; i < 16; i++) {
      const px = doorX - cam + rand(-26, 26);
      const py = floorY - rand(2, 60);
      fillCircle(ctx, px, py, rand(0.7, 2.1), '#9fb8a8');
    }
    ctx.restore();
  }

  // chefe ao fundo
  if (bossAlpha > 0.01 && bossId) {
    ctx.save();
    ctx.globalAlpha = bossAlpha * 0.95;
    glowCircle(ctx, bossX - cam, floorY - 44, 62, bossColor, 0.13);
    drawBossSprite(ctx, bossId, bossX - cam, floorY, {
      t: t,
      state: 'idle',
      phase: 1,
      facing: -1,
      scale: 1
    });
    ctx.restore();
  }

  // jogador
  if (playerAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = playerAlpha;
    groundShadow(ctx, playerX - cam, floorY, 15, 0.32);
    drawKennedito(ctx, playerX - cam, floorY, {
      facing: 1,
      t: t,
      state: t < walkEnd ? 'run' : 'idle',
      scale: 1
    });
    ctx.restore();
  }

  // escurecimento de borda
  const vg = ctx.createRadialGradient(GAME_W / 2, 190, 90, GAME_W / 2, 190, 400);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // tarjas de cinema
  const bar = 22;
  ctx.fillStyle = '#02060a';
  ctx.fillRect(0, 0, GAME_W, bar);
  ctx.fillRect(0, GAME_H - bar, GAME_W, bar);

  // placa com o nome da sala
  const plateIn = clamp((t - 3.5) / 0.6, 0, 1);
  if (plateIn > 0) {
    ctx.save();
    ctx.globalAlpha = plateIn;
    const pw = 300;
    const ph = 44;
    const px = GAME_W / 2 - pw / 2;
    const py = 52;
    ctx.fillStyle = 'rgba(3,10,7,0.86)';
    fillRoundRect(ctx, px, py, pw, ph, 3, 'rgba(3,10,7,0.86)');
    ctx.strokeStyle = withAlpha(bossColor, 0.6);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(px, py, pw, ph);
    bracketCorner(ctx, px + 3, py + 3, pw - 6, ph - 6, withAlpha(bossColor, 0.4), 9, 1);
    drawOutlinedText(ctx, room.name || '', GAME_W / 2, py + 16, 10, '#d9ffe9', '#04100b');
    if (bossDef) drawOutlinedText(ctx, bossDef.name, GAME_W / 2, py + 32, 9, bossColor, '#04100b');
    ctx.restore();
  }
}

function o_pauseShadow() { return false; }

/* ---------------- cena de entrada na escola ---------------- */

function drawEntranceScene(ctx, t) {
  // t: 0 -> 12s
  let kennX = 556;
  let kennFacing = -1;
  let walking = false;
  let kennAlpha = 1;
  let gateOpen = 0;
  let lightProgress = 0;
  let keyGlow = 0;
  let flash = 0;
  let doorOpen = 0;

  if (t < 2.0) {
    const p = clamp(t / 2.0, 0, 1);
    kennX = lerp(556, 344, easeInOut(p));
    walking = true;
  } else if (t < 3.4) {
    kennX = 344;
    keyGlow = clamp((t - 2.0) / 1.0, 0, 1);
  } else if (t < 5.4) {
    kennX = 344;
    gateOpen = clamp((t - 3.4) / 1.6, 0, 1);
    lightProgress = clamp((t - 3.4) / 2.2, 0, 0.35);
  } else if (t < 8.2) {
    const p = clamp((t - 5.4) / 2.8, 0, 1);
    kennX = lerp(344, 306, easeInOut(p));
    walking = p < 0.9;
    gateOpen = 1;
    lightProgress = clamp(0.35 + (t - 5.4) / 2.8 * 0.65, 0, 1);
  } else if (t < 9.8) {
    const p = clamp((t - 8.2) / 1.6, 0, 1);
    kennX = 306;
    doorOpen = easeInOut(p);
    lightProgress = 1;
    kennAlpha = 1 - clamp((t - 9.2) / 0.6, 0, 1);
  } else {
    kennAlpha = 0;
    lightProgress = 1;
    doorOpen = 1 - clamp((t - 10.0) / 1.0, 0, 1);
    gateOpen = 1 - clamp((t - 10.2) / 1.4, 0, 1);
  }
  if (t > 1.1 && t < 1.3) flash = 0.4;
  if (t > 6.4 && t < 6.55) flash = 0.22;

  // céu
  const sky = ctx.createLinearGradient(0, 0, 0, 320);
  sky.addColorStop(0, '#010504');
  sky.addColorStop(0.55, '#06120f');
  sky.addColorStop(1, '#0b1d17');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, GAME_W, 360);
  // lua
  ctx.globalAlpha = 0.5;
  fillCircle(ctx, 508, 50, 19, '#c8ffee');
  glowCircle(ctx, 508, 50, 58, '#8affc1', 0.13);
  ctx.globalAlpha = 0.22;
  fillCircle(ctx, 508, 50, 29, '#c8ffee');
  ctx.globalAlpha = 1;
  // nuvens
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 170 + t * 6) % 820) - 90;
    ctx.fillStyle = '#0b1a16';
    ctx.beginPath(); ctx.ellipse(cx, 40 + i * 9, 90, 14, 0, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // árvores
  for (let i = 0; i < 7; i++) {
    const tx = i * 112 - 40;
    ctx.fillStyle = '#030807';
    ctx.beginPath();
    ctx.moveTo(tx, 318); ctx.lineTo(tx + 26, 206 + hash(i) * 45); ctx.lineTo(tx + 52, 318); ctx.closePath(); ctx.fill();
    ctx.fillRect(tx + 22, 260, 6, 60);
  }
  // prédio (luzes acendendo)
  drawSchoolBuilding(ctx, t, 0, lightProgress);
  // porta principal abrindo
  if (doorOpen > 0) {
    ctx.save();
    ctx.globalAlpha = doorOpen * 0.85;
    ctx.fillStyle = '#020806';
    ctx.fillRect(320 - 28 + doorOpen * 26, 262, 28 * doorOpen, 52);
    ctx.globalAlpha = doorOpen * 0.5;
    glowCircle(ctx, 320, 288, 46, '#8affc1', 0.2);
    ctx.restore();
  }
  // portão e cerca
  drawSchoolFence(ctx, 0, 220, 214, 10);
  drawSchoolFence(ctx, 426, 220, 214, 10);
  drawGate(ctx, 320, 218, 108, 102, gateOpen, t);
  // calçada/rua
  ctx.fillStyle = '#0a100e';
  ctx.fillRect(0, 314, GAME_W, 46);
  ctx.fillStyle = '#0d1512';
  ctx.fillRect(0, 314, GAME_W, 6);
  ctx.fillStyle = '#070b09';
  for (let i = 0; i < 8; i++) ctx.fillRect(i * 86, 330, 2, 30);
  // poste
  drawStreetLamp(ctx, 78, 312, t);
  // kennedito
  if (kennAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = kennAlpha;
    groundShadow(ctx, kennX, 326, 16, 0.35);
    drawKennedito(ctx, kennX, 326, {
      facing: kennFacing,
      t: t,
      state: walking ? 'run' : 'idle',
      scale: 0.86,
      attackPose: 0,
      showBook: false
    });
    ctx.restore();
  }
  // chave brilhando
  if (keyGlow > 0 && kennAlpha > 0.01) {
    const kx = kennX - 8;
    const ky = 326 - 23;
    ctx.globalAlpha = 0.45 + keyGlow * 0.55;
    glowCircle(ctx, kx, ky, 22, '#f2c45a', 0.22 * keyGlow);
    drawKey(ctx, kx, ky, 0.6, t, '#f2c45a');
    ctx.globalAlpha = 1;
  }
  // chuva
  drawRain(ctx, t, 0.6);
  // relâmpago
  if (flash > 0) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#d9ffe9';
    ctx.fillRect(0, 0, GAME_W, 360);
    ctx.globalAlpha = 1;
  }
  // vinheta
  const vg = ctx.createRadialGradient(GAME_W / 2, 190, 120, GAME_W / 2, 190, 430);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
}

function drawSchoolBuilding(ctx, t, lightsOut, lightProgress) {
  const x = 104;
  const y = 86;
  const w = 432;
  const h = 228;
  const litTotal = Math.max(0, Math.min(15, Math.round((lightProgress == null ? 1 : lightProgress) * 15)));
  // silhueta
  ctx.fillStyle = '#0a100e';
  ctx.fillRect(x - 10, y + 26, w + 20, h - 26);
  // fachada
  ctx.fillStyle = '#141b17';
  ctx.fillRect(x, y + 34, w, h - 34);
  ctx.fillStyle = '#0e1512';
  ctx.fillRect(x + 8, y + 42, w - 16, h - 42);
  // telhado
  ctx.fillStyle = '#090e0b';
  ctx.beginPath();
  ctx.moveTo(x - 16, y + 34);
  ctx.lineTo(x + w / 2, y - 10);
  ctx.lineTo(x + w + 16, y + 34);
  ctx.closePath();
  ctx.fill();
  // torre
  ctx.fillStyle = '#111a15';
  ctx.fillRect(x + w / 2 - 54, y - 18, 108, 54);
  ctx.fillStyle = '#080d0a';
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 60, y - 18);
  ctx.lineTo(x + w / 2, y - 48);
  ctx.lineTo(x + w / 2 + 60, y - 18);
  ctx.closePath();
  ctx.fill();
  // placa CEPK
  const signOn = 0.7 + Math.sin(t * 2.2) * 0.15;
  ctx.globalAlpha = signOn * (1 - lightsOut * 0.9);
  ctx.fillStyle = '#0a1d13';
  ctx.fillRect(x + w / 2 - 50, y - 12, 100, 30);
  ctx.strokeStyle = 'rgba(88,255,157,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + w / 2 - 50, y - 12, 100, 30);
  drawPixelText(ctx, 'CEPK', x + w / 2, y + 3, 15, '#8affc1', 'center');
  glowCircle(ctx, x + w / 2, y + 3, 46, '#58ff9d', 0.12);
  ctx.globalAlpha = 1;
  // janelas
  let winIndex = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const wx = x + 26 + col * 82;
      const wy = y + 56 + row * 54;
      const lit = hash(row * 13 + col * 7) > 0.36;
      const flick = Math.sin(t * (1.2 + hash(row + col) * 2.5) + col) > 0.1;
      const isOn = lit && winIndex < litTotal;
      winIndex++;
      ctx.fillStyle = '#060b09';
      ctx.fillRect(wx - 3, wy - 3, 48, 38);
      if (isOn && !(lightsOut > 0)) {
        ctx.fillStyle = flick ? 'rgba(180,255,210,0.48)' : 'rgba(100,140,110,0.18)';
        ctx.fillRect(wx, wy, 42, 32);
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#b8ffd6';
        ctx.fillRect(wx, wy, 42, 1);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = 'rgba(5,12,9,0.9)';
        ctx.fillRect(wx, wy, 42, 32);
      }
      ctx.strokeStyle = '#1f2b24';
      ctx.lineWidth = 1;
      ctx.strokeRect(wx, wy, 42, 32);
      ctx.beginPath(); ctx.moveTo(wx + 21, wy); ctx.lineTo(wx + 21, wy + 32); ctx.stroke();
      // vulto
      if (isOn && lightsOut === 0 && hash(row * 4 + col) > 0.82) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#0a1510';
        fillCircle(ctx, wx + 21, wy + 16, 4, '#0a1510');
        ctx.fillRect(wx + 17, wy + 20, 8, 12);
        ctx.globalAlpha = 1;
      }
    }
  }
  // porta central
  ctx.fillStyle = '#080c0a';
  ctx.fillRect(x + w / 2 - 28, y + h - 52, 56, 52);
  ctx.fillStyle = '#1b2b22';
  ctx.fillRect(x + w / 2 - 22, y + h - 48, 44, 48);
  ctx.fillStyle = 'rgba(88,255,157,0.2)';
  ctx.fillRect(x + w / 2 - 16, y + h - 42, 32, 14);
  // rachaduras e hera
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 42, y + 50); ctx.lineTo(x + 56, y + 90); ctx.lineTo(x + 44, y + 120); ctx.lineTo(x + 60, y + 150);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(30,80,45,0.6)';
  for (let i = 0; i < 7; i++) {
    const vx = x + 12 + i * 64;
    ctx.beginPath();
    ctx.moveTo(vx, y + 34);
    ctx.quadraticCurveTo(vx + 8, y + 90, vx + 3, y + 130 + hash(i) * 50);
    ctx.stroke();
  }
  // placa de "escola abandonada"
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#d9c7a2';
  ctx.fillRect(x + 24, y + 172, 48, 16);
  drawPixelText(ctx, 'CEPK', x + 48, y + 180, 6, '#211a10', 'center');
  ctx.globalAlpha = 1;
}

function drawSchoolFence(ctx, x, y, w, h) {
  ctx.strokeStyle = '#18221d';
  ctx.lineWidth = 2;
  for (let i = 0; i < w; i += 18) {
    ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i, y + h); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x + w, y + 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + h - 2); ctx.lineTo(x + w, y + h - 2); ctx.stroke();
}

function drawGate(ctx, cx, y, w, h, open, t) {
  // arco
  ctx.fillStyle = '#0b120e';
  ctx.fillRect(cx - w / 2 - 10, y - 12, w + 20, 12);
  ctx.fillStyle = '#1d2a22';
  ctx.fillRect(cx - w / 2 - 8, y - 8, w + 16, 5);
  // interior escuro
  ctx.fillStyle = '#020604';
  ctx.fillRect(cx - w / 2, y, w, h);
  ctx.globalAlpha = 0.25 + Math.sin(t * 2) * 0.05;
  ctx.fillStyle = '#58ff9d';
  ctx.fillRect(cx - 22, y + 12, 44, h - 12);
  ctx.globalAlpha = 0.08;
  glowCircle(ctx, cx, y + h * 0.5, 70, '#58ff9d', 0.18);
  ctx.globalAlpha = 1;
  // portões
  const half = w / 2;
  const slide = open * (half - 4);
  drawGateHalf(ctx, cx - half - slide, y, half, h, 1, t);
  drawGateHalf(ctx, cx + slide, y, half, h, -1, t);
  // luz do poste no portão
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.moveTo(cx - 30, y);
  ctx.lineTo(cx + 30, y);
  ctx.lineTo(cx + 70, 320);
  ctx.lineTo(cx - 70, 320);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawGateHalf(ctx, x, y, w, h, dir, t) {
  ctx.save();
  ctx.fillStyle = '#0c1410';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#1e2c24';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  // barras
  ctx.strokeStyle = '#26372d';
  ctx.lineWidth = 2;
  for (let i = 6; i < w; i += 12) {
    ctx.beginPath(); ctx.moveTo(x + i, y + 4); ctx.lineTo(x + i, y + h - 4); ctx.stroke();
  }
  // travessas
  ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x + w, y + 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + h * 0.55); ctx.lineTo(x + w, y + h * 0.55); ctx.stroke();
  // pontas
  ctx.fillStyle = '#26372d';
  for (let i = 6; i < w; i += 12) {
    ctx.beginPath();
    ctx.moveTo(x + i - 2, y + 2);
    ctx.lineTo(x + i, y - 5);
    ctx.lineTo(x + i + 2, y + 2);
    ctx.closePath();
    ctx.fill();
  }
  // ferrugem
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#5a3a20';
  for (let i = 0; i < 4; i++) {
    const rx = x + hash(i + dir * 9) * w;
    ctx.fillRect(rx, y + 20 + hash(i * 3) * (h - 30), 3, 8);
  }
  ctx.globalAlpha = 1;
  // fechadura
  if (dir === 1) {
    ctx.fillStyle = '#b08b35';
    fillRoundRect(ctx, x + w - 9, y + h * 0.46, 8, 10, 1.5, '#b08b35');
    ctx.strokeStyle = '#b08b35';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x + w - 5, y + h * 0.46, 3, Math.PI, 0); ctx.stroke();
  }
  ctx.restore();
}

function drawStreetLamp(ctx, x, y, t) {
  ctx.fillStyle = '#050a08';
  ctx.fillRect(x - 2, y - 86, 4, 86);
  ctx.fillRect(x - 2, y - 86, 34, 4);
  ctx.fillStyle = '#1a241e';
  fillRoundRect(ctx, x + 26, y - 86, 16, 8, 2, '#1a241e');
  const flick = Math.sin(t * 13) > 0.2 ? 1 : 0.3;
  ctx.fillStyle = '#ffe4a3';
  ctx.globalAlpha = 0.8 * flick;
  ctx.fillRect(x + 29, y - 79, 10, 2);
  glowCircle(ctx, x + 34, y - 76, 58, '#ffd98a', 0.15 * flick);
  ctx.globalAlpha = 0.07 * flick;
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.moveTo(x + 20, y - 76);
  ctx.lineTo(x + 50, y - 76);
  ctx.lineTo(x + 86, y);
  ctx.lineTo(x - 16, y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawRain(ctx, t, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha || 0.55;
  ctx.strokeStyle = 'rgba(150,220,200,0.3)';
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 90; i++) {
    const rx = (hash(i * 3.7) * 700 - 30 + (t * (24 + hash(i) * 20))) % 700;
    const ry = (hash(i * 9.1) * 380 + t * (130 + hash(i * 2) * 80)) % 380;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 2, ry + 6 + hash(i) * 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#b8ffd6';
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const rx = (hash(i * 5.3) * 700 + t * 40) % 700;
    const ry = (hash(i * 7.7) * 380 + t * 180) % 380;
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 14); ctx.stroke();
  }
  ctx.restore();
}

function drawRoomForeground(ctx, room, camX, t, game) {
  // poeira flutuante
  ctx.save();
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 18; i++) {
    const px = (hash(i * 2.1 + 4) * 1300 - camX * 0.4 + Math.sin(t * 0.3 + i) * 12) % (GAME_W + 40) - 20;
    const py = 70 + hash(i * 3.3) * 220 + Math.sin(t * 0.5 + i * 2) * 8;
    fillCircle(ctx, px, py, 0.7 + hash(i) * 0.7, room.bg === 'lab' ? '#8affc1' : '#d9ffe9');
  }
  ctx.restore();
  // névoa no chão
  ctx.save();
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 3; i++) {
    const fx = ((i * 280 + t * 10) % (GAME_W + 280)) - 140;
    ctx.fillStyle = room.bg === 'lab' ? '#35e08b' : '#b8ffd6';
    ctx.beginPath(); ctx.ellipse(fx, 330, 140, 12, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

