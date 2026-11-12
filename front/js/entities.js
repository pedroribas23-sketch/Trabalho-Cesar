/* =========================================================
   KENNEDITO — entidades: jogador, projéteis, perigos,
   inimigos, partículas e itens
   ========================================================= */
'use strict';

class Player {
  constructor(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.w = 20;
    this.h = 42;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.jumpsUsed = 0;
    this.airDashUsed = false;
    this.maxHp = 6;
    this.hp = 6;
    this.state = 'idle';
    this.animTime = 0;
    this.attackIndex = 0;
    this.attackTimer = 0;
    this.attackDuration = 0;
    this.attackCooldown = 0;
    this.attackHit = false;
    this.attackHits = new Set();
    this.attackBuffered = false;
    this.comboWindow = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashDir = 1;
    this.bookCooldown = 0;
    this.specialCooldown = 0;
    this.invuln = 0;
    this.hurtTimer = 0;
    this.flashTimer = 0;
    this.dead = false;
    this.deathTimer = 0;
    this.stepTimer = 0;
    this.locked = false;
    this.wallHit = false;
  }

  get box() {
    return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h };
  }

  hasAbility(id) {
    return this.game && this.game.hasAbility ? this.game.hasAbility(id) : false;
  }

  syncAbilities() {
    this.bookUnlocked = this.hasAbility('book');
    this.specialUnlocked = this.hasAbility('warcry');
    this.airDashUnlocked = this.hasAbility('airDash');
    this.maxJumps = 1 + (this.hasAbility('doubleJump') ? 1 : 0);
    this.maxHp = this.game.save ? (this.game.save.maxHearts || 6) : 6;
    if (this.hp > this.maxHp) this.hp = this.maxHp;
  }

  reset(x, y, fullHeal) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.state = 'idle';
    this.dead = false;
    this.deathTimer = 0;
    this.invuln = 1.0;
    this.hurtTimer = 0;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.jumpsUsed = 0;
    this.airDashUsed = false;
    this.syncAbilities();
    if (fullHeal) this.hp = this.maxHp;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.flashTimer = 0.18;
    this.game.spawnParticles(this.x, this.y - 26, 10, '#58ff9d', 'heal');
  }

  hurt(amount, sourceX, sourceY) {
    if (this.dead || this.invuln > 0 || this.state === 'dash') return false;
    const dmg = Math.max(1, amount || 1);
    this.hp -= dmg;
    this.invuln = 1.15;
    this.flashTimer = 0.5;
    this.hurtTimer = 0.33;
    this.state = 'hurt';
    const dir = sourceX != null ? (this.x < sourceX ? -1 : 1) : -this.facing;
    this.vx = dir * 135;
    this.vy = -170;
    this.onGround = false;
    this.game.onPlayerHurt(dmg, sourceX, sourceY);
    if (this.hp <= 0) this.die();
    return true;
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.hp = 0;
    this.state = 'dead';
    this.deathTimer = 0;
    this.vx = -this.facing * 80;
    this.vy = -230;
    this.game.onPlayerDeath();
  }

  update(dt) {
    const game = this.game;
    const input = game.input;
    const room = game.room;
    this.animTime += dt;
    this.syncAbilities();

    if (this.dead) {
      this.deathTimer += dt;
      this.vx = approach(this.vx, 0, 300 * dt);
      this.vy = Math.min(560, this.vy + 1000 * dt);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y > (room ? room.floorY : 300)) {
        this.y = room ? room.floorY : 300;
        this.vy = 0;
      }
      return;
    }

    // temporizadores
    this.invuln = Math.max(0, this.invuln - dt);
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.bookCooldown = Math.max(0, this.bookCooldown - dt);
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    this.comboWindow = Math.max(0, this.comboWindow - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.coyote = Math.max(0, this.coyote - dt);
    if (this.hurtTimer > 0) this.hurtTimer -= dt;

    if (this.locked) {
      this.vx = approach(this.vx, 0, 2200 * dt);
      this.vy = Math.min(560, this.vy + 980 * dt);
      this.applyPhysics(dt);
      return;
    }

    // ataque
    if (input.attackPressed || input.mouseAttackPressed) {
      if (this.attackTimer > 0) this.attackBuffered = true;
      else if (this.attackCooldown <= 0) this.startAttack(input);
    }
    if (this.attackTimer > 0) this.updateAttack(dt);

    // dash
    if (input.dashPressed && this.dashCooldown <= 0 && this.dashTimer <= 0) {
      if (this.onGround || (this.airDashUnlocked && !this.airDashUsed)) {
        this.startDash(input);
      }
    }

    // caderno
    if (input.bookPressed) this.tryBook(input);
    // grito de guerra
    if (input.specialPressed) this.trySpecial();
    // interagir
    if (input.interactPressed && game.tryInteract) game.tryInteract(this);

    if (this.hurtTimer > 0) {
      this.vx = approach(this.vx, 0, 500 * dt);
      this.vy = Math.min(560, this.vy + 1000 * dt);
      this.applyPhysics(dt);
      this.updateState();
      return;
    }

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.vx = this.dashDir * 430;
      this.vy = 0;
      this.x += this.vx * dt;
      this.clampAndWalls();
      if (this.animTime % 0.05 < dt && game.spawnDashGhost) game.spawnDashGhost(this);
      if (this.dashTimer <= 0) {
        this.dashTimer = 0;
        this.dashCooldown = 0.5;
        this.vx = this.dashDir * 120;
        this.updateState();
      }
      // ainda cai se estiver no ar? dash planar
      return;
    }

    // movimento horizontal
    const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (move !== 0) this.facing = move;
    const target = move * 155;
    const accel = this.onGround ? 1500 : 1050;
    if (move !== 0) this.vx = approach(this.vx, target, accel * dt);
    else this.vx = approach(this.vx, 0, (this.onGround ? 1900 : 650) * dt);

    if (this.attackTimer > 0) this.vx = approach(this.vx, this.facing * 38, 800 * dt);

    // pulo
    if (input.jumpPressed) this.jumpBuffer = 0.12;
    if (this.jumpBuffer > 0) {
      if (this.coyote > 0 || this.onGround) {
        this.doJump(false);
        this.jumpBuffer = 0;
      } else if (this.jumpsUsed < this.maxJumps && this.hasAbility('doubleJump')) {
        this.doJump(true);
        this.jumpBuffer = 0;
      }
    }
    if (!input.jumpDown && this.vy < 0) this.vy += 1000 * 1.5 * dt;

    this.vy = Math.min(560, this.vy + 1000 * dt);
    this.applyPhysics(dt);
    this.updateState();
    this.stepTimer -= dt;
    if (this.onGround && Math.abs(this.vx) > 40 && this.stepTimer <= 0) {
      this.stepTimer = 0.24;
      if (game.audio) game.audio.sfx('step');
    }
    if (this.onGround) {
      this.jumpsUsed = 0;
      this.airDashUsed = false;
    }
  }

  doJump(double) {
    this.vy = double ? -315 : -355;
    this.onGround = false;
    this.jumpsUsed++;
    this.coyote = 0;
    this.state = double ? 'jump' : 'jump';
    if (this.game.audio) this.game.audio.sfx(double ? 'doubleJump' : 'jump');
    this.game.spawnParticles(this.x, this.y, double ? 10 : 6, double ? '#62fff0' : '#b8ffd6', 'dust');
  }

  startDash(input) {
    let dir = this.facing;
    if (input.left && !input.right) dir = -1;
    if (input.right && !input.left) dir = 1;
    this.dashDir = dir;
    this.facing = dir;
    this.dashTimer = 0.16;
    this.dashCooldown = 0.58;
    this.invuln = Math.max(this.invuln, 0.24);
    this.state = 'dash';
    this.vx = dir * 430;
    this.vy = 0;
    if (!this.onGround) this.airDashUsed = true;
    if (this.game.audio) this.game.audio.sfx('dash');
    this.game.spawnParticles(this.x, this.y - 20, 8, '#62c7ff', 'dash');
    this.game.shake(2.2, 0.12);
  }

  startAttack(input) {
    const aim = this.getAimDir(input);
    if (aim) this.facing = aim;
    if (this.comboWindow > 0) this.attackIndex = (this.attackIndex + 1) % 3;
    else this.attackIndex = 0;
    this.attackDuration = [0.23, 0.23, 0.36][this.attackIndex];
    this.attackTimer = this.attackDuration;
    this.attackHit = false;
    this.attackHits.clear();
    this.attackBuffered = false;
    this.comboWindow = 0;
    this.state = 'attack';
    this.attackCooldown = 0;
    if (this.game.audio) this.game.audio.sfx('attack');
    if (this.attackIndex === 2) this.game.shake(1.8, 0.12);
  }

  updateAttack(dt) {
    this.attackTimer -= dt;
    const prog = 1 - this.attackTimer / this.attackDuration;
    const active = (this.attackIndex === 2 ? (prog > 0.2 && prog < 0.72) : (prog > 0.12 && prog < 0.62));
    if (active && !this.attackHit) {
      this.attackHit = true;
      // o ataque base e a distancia: arremessa um giz na direcao da mira
      this.throwChalk();
    }
    if (this.attackTimer <= 0) {
      this.attackTimer = 0;
      this.attackCooldown = 0.06;
      this.comboWindow = 0.36;
      this.state = 'idle';
      if (this.attackBuffered) {
        this.attackBuffered = false;
        this.startAttack(this.game.input);
      }
    }
  }

  /* Angulo de mira em radianos: usa o mouse quando houver, senao a direcao do olhar. */
  getAimAngle(input) {
    if (input && input.mouseUsed && input.mouseInside) {
      const wx = this.game.camera.x + input.mouseX;
      const wy = input.mouseY;
      const dx = wx - this.x;
      const dy = wy - (this.y - 24);
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        const angle = Math.atan2(dy, dx);
        this.facing = Math.cos(angle) >= 0 ? 1 : -1;
        return angle;
      }
    }
    return this.facing === 1 ? 0 : Math.PI;
  }

  /* Arremesso de giz: o ataque basico do Kennedito. */
  throwChalk() {
    const input = this.game.input;
    const angle = this.getAimAngle(input);
    const heavy = this.attackIndex === 2;
    const speed = heavy ? 340 : 400;
    const life = heavy ? 1.5 : 1.1;
    const damage = heavy ? 13 : 6;
    this.game.spawnProjectile({
      type: 'chalk',
      owner: 'player',
      x: this.x + Math.cos(angle) * 16,
      y: this.y - 24 + Math.sin(angle) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 10,
      h: 10,
      damage: damage,
      life: life,
      angle: angle,
      spin: heavy ? 14 : 9,
      gravity: heavy ? 60 : 30,
      color: '#f5efc0',
      scale: heavy ? 1.5 : 1
    });
    if (this.game.audio) this.game.audio.sfx(heavy ? 'shock' : 'book');
    this.game.spawnParticles(
      this.x + Math.cos(angle) * 16,
      this.y - 24 + Math.sin(angle) * 10,
      heavy ? 8 : 5,
      heavy ? '#fff3b0' : '#d9d2a8',
      'spark'
    );
    if (heavy) this.game.shake(2.2, 0.14);
  }

  getAttackBox() {
    const reach = this.attackIndex === 2 ? 42 : 32;
    const x = this.facing === 1 ? this.x + 3 : this.x - 3 - reach;
    return { x, y: this.y - 38, w: reach, h: this.attackIndex === 2 ? 40 : 32 };
  }

  getAimDir(input) {
    if (!input.mouseUsed || !input.mouseInside) return 0;
    const worldX = this.game.camera.x + input.mouseX;
    if (Math.abs(worldX - this.x) < 4) return 0;
    return worldX > this.x ? 1 : -1;
  }

  /* Lancamento pesado: o lapis da escola, perfura um inimigo. */
  tryBook(input) {
    if (this.bookCooldown > 0) return;
    this.bookCooldown = 0.9;
    let angle = 0;
    if (input.mouseUsed && input.mouseInside) {
      const wx = this.game.camera.x + input.mouseX;
      const wy = input.mouseY;
      angle = Math.atan2(wy - (this.y - 25), wx - this.x);
      this.facing = Math.cos(angle) >= 0 ? 1 : -1;
    } else {
      angle = this.facing === 1 ? 0 : Math.PI;
    }
    const speed = 330;
    this.game.spawnProjectile({
      type: 'code',
      owner: 'player',
      x: this.x + Math.cos(angle) * 15,
      y: this.y - 25 + Math.sin(angle) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 16,
      h: 14,
      damage: 11,
      life: 1.6,
      angle: angle,
      spin: 10,
      gravity: 30,
      pierce: true,
      color: '#62c7ff'
    });
    if (this.game.audio) this.game.audio.sfx('laser');
    this.game.spawnParticles(this.x + this.facing * 14, this.y - 25, 8, '#62c7ff', 'spark');
    this.state = 'attack';
    this.attackIndex = 2;
    this.attackTimer = 0.16;
    this.attackDuration = 0.16;
    this.attackHit = true;
  }

  trySpecial() {
    if (!this.specialUnlocked) {
      this.game.toastOnce('warcry', 'Grito de Guerra bloqueado. Derrote três chefes de sala.');
      return;
    }
    if (this.specialCooldown > 0) return;
    this.specialCooldown = 9;
    this.invuln = Math.max(this.invuln, 0.45);
    if (this.game.doWarCry) this.game.doWarCry(this);
  }

  applyPhysics(dt) {
    const room = this.game.room;
    const floorY = room ? room.floorY : 300;
    this.x += this.vx * dt;
    this.clampAndWalls();

    const prevBottom = this.y;
    this.y += this.vy * dt;
    this.onGround = false;
    if (this.vy >= 0) {
      if (this.y >= floorY) {
        this.y = floorY;
        this.vy = 0;
        this.onGround = true;
      }
      if (room && room.platforms) {
        for (const p of room.platforms) {
          if (this.x + this.w / 2 > p.x && this.x - this.w / 2 < p.x + p.w &&
              prevBottom <= p.y + 5 && this.y >= p.y) {
            this.y = p.y;
            this.vy = 0;
            this.onGround = true;
            break;
          }
        }
      }
    }
    if (this.onGround) this.coyote = 0.1;
    else if (this.coyote > 0) this.coyote -= dt;
  }

  clampAndWalls() {
    const room = this.game.room;
    if (!room) return;
    let left = 10;
    let right = room.width - 10;
    if (this.game.bossActive && room.arena) {
      left = room.arena.left + this.w / 2;
      right = room.arena.right - this.w / 2;
    }
    if (this.x < left) { this.x = left; if (this.vx < 0) this.vx = 0; }
    if (this.x > right) { this.x = right; if (this.vx > 0) this.vx = 0; }
  }

  updateState() {
    if (this.hurtTimer > 0) { this.state = 'hurt'; return; }
    if (this.attackTimer > 0) { this.state = 'attack'; return; }
    if (this.dashTimer > 0) { this.state = 'dash'; return; }
    if (!this.onGround) { this.state = this.vy < 0 ? 'jump' : 'fall'; return; }
    if (Math.abs(this.vx) > 16) this.state = 'run';
    else this.state = 'idle';
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX;
    const sy = this.y - camY;
    ctx.save();
    if (this.invuln > 0 && !this.dead && Math.floor(this.invuln * 22) % 2 === 0) ctx.globalAlpha = 0.45;
    groundShadow(ctx, sx, sy, 15, this.onGround ? 0.35 : 0.18);
    const flash = this.flashTimer > 0 && Math.floor(this.flashTimer * 30) % 2 === 0;
    const pose = this.attackTimer > 0 ? (this.attackIndex + 1) : 0;
    drawKennedito(ctx, sx, sy, {
      facing: this.facing,
      t: this.animTime,
      state: this.state,
      flash: flash,
      attackPose: pose,
      dashTimer: this.dashTimer
    });
    ctx.restore();
  }
}

/* ---------------- projéteis ---------------- */

class Projectile {
  constructor(opts) {
    const o = opts || {};
    this.game = o.game || null;
    this.type = o.type || 'orb';
    this.owner = o.owner || 'boss';
    this.x = o.x || 0;
    this.y = o.y || 0;
    this.vx = o.vx || 0;
    this.vy = o.vy || 0;
    this.w = o.w || 12;
    this.h = o.h || 12;
    this.damage = o.damage || 1;
    this.life = o.life != null ? o.life : 4;
    this.maxLife = this.life;
    this.gravity = o.gravity || 0;
    this.bounce = o.bounce || 0;
    this.angle = o.angle != null ? o.angle : 0;
    this.spin = o.spin || 0;
    this.scale = o.scale || 1;
    this.color = o.color || '#c77dff';
    this.pierce = !!o.pierce;
    this.homing = o.homing || 0;
    this.sway = o.sway || 0;
    this.dead = false;
    this.t = 0;
    this.hitSet = new Set();
    this.flash = !!o.flash;
    this.alpha = o.alpha != null ? o.alpha : 1;
  }

  update(dt, game) {
    this.t += dt;
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    const room = game.room;
    if (this.homing > 0 && game.player) {
      const dx = game.player.x - this.x;
      const dy = (game.player.y - 20) - this.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      this.vx += (dx / d) * this.homing * dt;
      this.vy += (dy / d) * this.homing * dt;
    }
    if (this.sway) this.vx += Math.sin(this.t * 5 + this.x) * this.sway * dt;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.spin * dt;

    if (this.bounce > 0 && room && this.y + this.h / 2 > room.floorY) {
      this.y = room.floorY - this.h / 2;
      this.vy = -Math.abs(this.vy) * this.bounce;
      if (Math.abs(this.vy) < 35) this.vy = 0;
      this.vx *= 0.985;
      if (game.audio) game.audio.sfx('step');
    }
    if (room && (this.x < -40 || this.x > room.width + 40 || this.y > 380 || this.y < -80)) {
      this.dead = true;
    }

    const pbox = this.getBox();
    if (this.owner === 'player') {
      if (game.boss && !game.boss.dead && !this.hitSet.has(game.boss)) {
        if (aabb(pbox, game.boss.box)) {
          this.hitSet.add(game.boss);
          game.boss.takeDamage(this.damage, this, this.x, this.y);
          game.spawnHitParticles(this.x, this.y, this.color, 9);
          game.shake(1.5, 0.08);
          if (!this.pierce) { this.dead = true; return; }
        }
      }
      for (const e of game.enemies) {
        if (e.dead || this.hitSet.has(e)) continue;
        if (aabb(pbox, e.box)) {
          this.hitSet.add(e);
          e.hurt(this.damage, this);
          game.spawnHitParticles(this.x, this.y, this.color, 7);
          if (!this.pierce) { this.dead = true; return; }
        }
      }
    } else {
      const player = game.player;
      if (player && !player.dead && player.invuln <= 0) {
        if (aabb(pbox, player.box) || circleRect(this.x, this.y, Math.max(this.w, this.h) * 0.4, player.box)) {
          const hit = player.hurt(this.damage, this.x, this.y);
          if (hit) {
            game.spawnHitParticles(this.x, this.y, this.color, 10);
            if (!this.pierce) { this.dead = true; return; }
          }
        }
      }
    }
  }

  getBox() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  draw(ctx, camX, camY) {
    if (this.dead) return;
    ctx.save();
    ctx.translate(-camX, -camY);
    if (this.sway || this.type === 'paper') {
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.sin(this.t * 4) * 0.18);
      ctx.translate(-this.x, -this.y);
    }
    drawProjectileSprite(ctx, this, this.t);
    ctx.restore();
  }
}

/* ---------------- perigos ---------------- */

class Hazard {
  constructor(opts) {
    const o = opts || {};
    this.game = o.game || null;
    this.kind = o.kind || 'zone';
    this.x = o.x || 0;
    this.y = o.y || 0;
    this.w = o.w || 24;
    this.h = o.h || 24;
    this.warnTime = o.warnTime != null ? o.warnTime : 0.65;
    this.activeTime = o.activeTime != null ? o.activeTime : 0.35;
    this.damage = o.damage || 1;
    this.color = o.color || '#ff6b6b';
    this.owner = o.owner || 'boss';
    this.state = o.state || 'warn';
    this.timer = 0;
    this.t = 0;
    this.dead = false;
    this.hitPlayer = false;
    this.radius = o.radius || 0;
    this.expandSpeed = o.expandSpeed || 380;
    this.maxRadius = o.maxRadius || 220;
    this.requiresGround = !!o.requiresGround;
    this.sfx = o.sfx || null;
  }

  getBox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(dt, game) {
    this.t += dt;
    this.timer += dt;
    if (this.state === 'warn') {
      if (this.timer >= this.warnTime) {
        this.state = 'active';
        this.timer = 0;
        if (this.sfx && game.audio) game.audio.sfx(this.sfx);
        if (this.kind === 'laser' || this.kind === 'shockwave') game.shake(2.5, 0.18);
        game.spawnParticles(this.x + this.w / 2, this.y + this.h / 2, 8, this.color, 'spark');
      }
      return;
    }
    if (this.state === 'active') {
      if (this.kind === 'shockwave') {
        this.radius += this.expandSpeed * dt;
        if (this.radius >= this.maxRadius) { this.dead = true; return; }
        const player = game.player;
        if (player && !player.dead && !this.hitPlayer) {
          const d = dist(player.x, player.y, this.x, this.y);
          const nearGround = player.onGround || player.y > (game.room ? game.room.floorY - 12 : 288);
          if (d < this.radius + 10 && d > this.radius - 24 && nearGround) {
            if (player.hurt(this.damage, this.x, this.y)) {
              this.hitPlayer = true;
              game.spawnHitParticles(player.x, player.y - 20, this.color, 12);
            }
          }
        }
      } else {
        const player = game.player;
        if (player && !player.dead && !this.hitPlayer && player.invuln <= 0) {
          if (aabb(player.box, this.getBox())) {
            if (player.hurt(this.damage, this.x + this.w / 2, this.y + this.h / 2)) {
              this.hitPlayer = true;
              game.spawnHitParticles(player.x, player.y - 20, this.color, 10);
            }
          }
        }
      }
      if (this.timer >= this.activeTime) this.dead = true;
    }
  }

  draw(ctx, t) {
    if (this.dead) return;
    drawHazardSprite(ctx, this, t);
  }
}

/* ---------------- inimigos ---------------- */

class Enemy {
  constructor(game, type, x, y, opts) {
    const o = opts || {};
    this.game = game;
    this.type = type || 'eco';
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.w = this.type === 'bug' ? 18 : 18;
    this.h = this.type === 'bug' ? 14 : 26;
    this.hp = this.type === 'spectral' ? 4 : (this.type === 'bug' ? 2 : 3);
    this.maxHp = this.hp;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    this.dead = false;
    this.flash = 0;
    this.t = Math.random() * 10;
    this.speed = this.type === 'bug' ? 62 : (this.type === 'spectral' ? 50 : 38);
    this.contactCooldown = 0;
    this.phase = o.phase || 0;
    this.scale = o.scale || 1;
    this.hpBar = this.hp;
  }

  get box() {
    return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h };
  }

  update(dt, game) {
    if (this.dead) return;
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.contactCooldown = Math.max(0, this.contactCooldown - dt);
    const player = game.player;
    const room = game.room;
    if (!player || player.dead) return;

    const dx = player.x - this.x;
    const dy = (player.y - player.h / 2) - (this.y - this.h / 2);
    const d = Math.max(1, Math.hypot(dx, dy));
    if (Math.abs(dx) > 3) this.facing = dx > 0 ? 1 : -1;

    if (this.type === 'bug') {
      this.y = room ? room.floorY : this.baseY;
      this.vx = approach(this.vx, sign(dx) * this.speed, 280 * dt);
      this.x += this.vx * dt;
      this.y += Math.sin(this.t * 14) * 0.3;
    } else {
      const speed = this.speed * (this.type === 'spectral' ? 1.1 : 1);
      this.x += (dx / d) * speed * dt;
      this.baseY += (player.y - 40 - this.baseY) * 0.35 * dt;
      this.y = this.baseY + Math.sin(this.t * 3.2) * 5;
      this.x += Math.sin(this.t * 2 + this.phase) * 8 * dt;
    }

    if (room) {
      this.x = clamp(this.x, 20, room.width - 20);
      if (game.bossActive && room.arena) this.x = clamp(this.x, room.arena.left + 16, room.arena.right - 16);
    }

    if (!this.dead && this.contactCooldown <= 0 && aabb(this.box, player.box)) {
      if (player.hurt(1, this.x, this.y)) {
        this.contactCooldown = 1.0;
        this.vx = -sign(dx) * 80;
        game.spawnHitParticles(this.x, this.y - this.h / 2, '#ff8b8b', 8);
      }
    }
  }

  hurt(amount, source) {
    if (this.dead) return;
    this.hp -= amount;
    this.flash = 0.12;
    if (source && source.x != null) this.vx = sign(this.x - source.x) * 110;
    if (this.hp <= 0) this.kill();
  }

  kill() {
    if (this.dead) return;
    this.dead = true;
    this.game.onEnemyKilled(this);
    this.game.spawnParticles(this.x, this.y - this.h / 2, 18, this.type === 'bug' ? '#54ffb4' : (this.type === 'spectral' ? '#c77dff' : '#d9fff0'), 'enemy');
    this.game.shake(1.8, 0.12);
    if (this.game.audio) this.game.audio.sfx('hit');
  }

  draw(ctx, t) {
    if (this.dead) return;
    const sx = this.x;
    const sy = this.y;
    groundShadow(ctx, sx, this.baseY, 11, this.type === 'bug' ? 0.22 : 0.1);
    if (this.flash > 0 && Math.floor(this.flash * 40) % 2 === 0) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      drawEnemySprite(ctx, this.type, sx, sy, { t: this.t, facing: this.facing, flash: true, scale: this.scale });
      ctx.restore();
    } else {
      drawEnemySprite(ctx, this.type, sx, sy, { t: this.t, facing: this.facing, scale: this.scale });
    }
  }
}

/* ---------------- partículas ---------------- */

class Particle {
  constructor(opts) {
    const o = opts || {};
    this.x = o.x || 0;
    this.y = o.y || 0;
    this.vx = o.vx || 0;
    this.vy = o.vy || 0;
    this.life = o.life != null ? o.life : 0.5;
    this.maxLife = this.life;
    this.size = o.size || 2;
    this.color = o.color || '#fff';
    this.gravity = o.gravity || 0;
    this.drag = o.drag != null ? o.drag : 0.94;
    this.kind = o.kind || 'dot';
    this.text = o.text || '';
    this.angle = o.angle || 0;
    this.spin = o.spin || 0;
    this.alpha = o.alpha != null ? o.alpha : 1;
    this.additive = !!o.additive;
    this.facing = o.facing || 1;
    this.state = o.state || 'idle';
    this.scale = o.scale || 1;
    this.bossId = o.bossId || null;
    this.phase = o.phase || 1;
    this.dead = false;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.vx *= Math.pow(this.drag, dt * 60);
    this.vy *= Math.pow(this.drag, dt * 60);
    this.angle += this.spin * dt;
  }

  draw(ctx) {
    if (this.dead) return;
    const p = 1 - this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = clamp(this.alpha * (1 - p * 0.85), 0, 1);
    if (this.additive) ctx.globalCompositeOperation = 'lighter';
    if (this.kind === 'dot') {
      fillCircle(ctx, this.x, this.y, Math.max(0.4, this.size * (1 - p * 0.45)), this.color);
    } else if (this.kind === 'square') {
      ctx.fillStyle = this.color;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else if (this.kind === 'spark' || this.kind === 'ember') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(0.7, this.size * 0.45);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 0.035, this.y - this.vy * 0.035);
      ctx.stroke();
    } else if (this.kind === 'ring') {
      const r = this.size + p * (this.maxLife * 110);
      ctx.globalAlpha *= 0.75;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(1, 3 * (1 - p));
      ctx.beginPath(); ctx.arc(this.x, this.y, Math.max(1, r), 0, TAU); ctx.stroke();
    } else if (this.kind === 'text') {
      drawOutlinedText(ctx, this.text, this.x, this.y, this.size, this.color, '#07110b');
    } else if (this.kind === 'ghost') {
      ctx.globalAlpha *= 0.28;
      drawKennedito(ctx, this.x, this.y, {
        facing: this.facing,
        t: this.life * 5,
        state: this.state,
        scale: this.scale
      });
    } else if (this.kind === 'bossghost') {
      ctx.globalAlpha *= 0.42;
      drawBossSprite(ctx, this.bossId || 'mestre', this.x, this.y - 42, {
        t: this.life * 6,
        state: 'idle',
        phase: this.phase,
        facing: this.facing,
        scale: this.scale || 1
      });
    } else if (this.kind === 'slash') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(1, this.size * (1 - p));
      ctx.beginPath();
      ctx.arc(this.x, this.y, 28 + p * 12, -1.1 + this.angle, 1.1 + this.angle);
      ctx.stroke();
    } else if (this.kind === 'heal') {
      drawHeart(ctx, this.x, this.y, 7 * (1 - p * 0.4), true, this.color);
    } else {
      fillCircle(ctx, this.x, this.y, Math.max(0.4, this.size), this.color);
    }
    ctx.restore();
  }
}

/* ---------------- itens ---------------- */

class Pickup {
  constructor(game, type, x, y, opts) {
    const o = opts || {};
    this.game = game;
    this.type = type || 'heart';
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.t = Math.random() * 6;
    this.dead = false;
    this.amount = o.amount || 1;
    this.label = o.label || '';
    this.bob = Math.sin(this.t * 2.4) * 3;
  }

  get box() {
    return { x: this.x - 10, y: this.y - 18, w: 20, h: 20 };
  }

  update(dt, game) {
    this.t += dt;
    this.bob = Math.sin(this.t * 2.4) * 3;
    if (this.type === 'heart') {
      if (game.player && !game.player.dead && aabb(this.box, game.player.box)) {
        if (game.player.hp < game.player.maxHp) {
          game.player.heal(this.amount);
          this.dead = true;
          if (game.audio) game.audio.sfx('heal');
          game.toast('+1 coração');
        }
      }
    } else if (this.type === 'key') {
      if (game.player && !game.player.dead && aabb(this.box, game.player.box)) {
        this.dead = true;
        if (game.audio) game.audio.sfx('key');
        if (game.onKeyPicked) game.onKeyPicked(this);
      }
    }
  }

  draw(ctx, t) {
    if (this.dead) return;
    const y = this.baseY + this.bob;
    if (this.type === 'heart') {
      glowCircle(ctx, this.x, y - 8, 16, '#ff5d7a', 0.2);
      drawHeart(ctx, this.x, y - 8, 11, true, '#ff5d7a');
    } else {
      glowCircle(ctx, this.x, y - 8, 18, '#f2c45a', 0.22);
      drawKey(ctx, this.x, y - 8, 0.9, t, '#f2c45a');
    }
  }
}

class LoreItem {
  constructor(game, data) {
    this.game = game;
    this.id = data.id;
    this.title = data.title;
    this.text = data.text;
    this.x = data.x;
    this.y = data.y;
    this.collected = false;
    this.t = Math.random() * 5;
  }

  get near() {
    const p = this.game.player;
    return p && !p.dead && dist(p.x, p.y - 20, this.x, this.y - 10) < 42;
  }

  update(dt) {
    this.t += dt;
    if (this.game.save && this.game.save.lore && this.game.save.lore.indexOf(this.id) >= 0) this.collected = true;
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    this.game.collectLore(this);
  }

  draw(ctx, t) {
    if (this.collected) return;
    glowCircle(ctx, this.x, this.y - 10, 22, '#c77dff', 0.2);
    drawLoreIcon(ctx, this.x, this.y - 8 + Math.sin(this.t * 2) * 3, t, 1);
    if (this.near) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      drawOutlinedText(ctx, 'E', this.x, this.y - 34, 8, '#e2b6ff', '#07110b');
      ctx.restore();
    }
  }
}

