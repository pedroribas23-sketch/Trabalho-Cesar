/* =========================================================
   KENNEDITO — entrada: teclado, mouse e toque
   ========================================================= */
'use strict';

(function () {
  const input = {
    left: false,
    right: false,
    jumpDown: false,
    attackDown: false,
    jumpPressed: false,
    attackPressed: false,
    mouseAttackPressed: false,
    dashPressed: false,
    bookPressed: false,
    specialPressed: false,
    interactPressed: false,
    pausePressed: false,
    advancePressed: false,
    mouseX: GAME_W / 2,
    mouseY: GAME_H / 2,
    mouseInside: false,
    mouseUsed: false,
    touchActive: false,
    hasTouch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0
  };

  let held = Object.create(null);
  let canvas = null;

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }

  function setGameKey(code, down) {
    if (code === 'ArrowLeft' || code === 'KeyA') input.left = down;
    if (code === 'ArrowRight' || code === 'KeyD') input.right = down;
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW' || code === 'KeyZ') {
      input.jumpDown = down;
      if (down) input.jumpPressed = true;
    }
    if (code === 'KeyJ' || code === 'KeyX') {
      input.attackDown = down;
      if (down) input.attackPressed = true;
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyK' || code === 'KeyC') {
      if (down) input.dashPressed = true;
    }
    if (code === 'KeyL' || code === 'KeyV') {
      if (down) input.bookPressed = true;
    }
    if (code === 'KeyU' || code === 'KeyI') {
      if (down) input.specialPressed = true;
    }
    if (code === 'KeyE') {
      if (down) input.interactPressed = true;
    }
    if (code === 'Escape' || code === 'KeyP') {
      if (down) input.pausePressed = true;
    }
    if (code === 'Enter' || code === 'Space') {
      if (down) input.advancePressed = true;
    }
  }

  function keyDown(e) {
    if (isTypingTarget(e.target)) return;
    const code = e.code;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].indexOf(code) >= 0) {
      e.preventDefault();
    }
    if (held[code]) return;
    held[code] = true;
    setGameKey(code, true);
  }

  function keyUp(e) {
    if (isTypingTarget(e.target)) return;
    const code = e.code;
    held[code] = false;
    setGameKey(code, false);
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  window.addEventListener('blur', function () {
    for (const k in held) held[k] = false;
    input.left = false;
    input.right = false;
    input.jumpDown = false;
    input.attackDown = false;
    input.jumpPressed = false;
    input.attackPressed = false;
    input.dashPressed = false;
    input.bookPressed = false;
    input.specialPressed = false;
    input.interactPressed = false;
    input.pausePressed = false;
    input.advancePressed = false;
    input.mouseInside = false;
  });

  function canvasPoint(e) {
    if (!canvas) return { x: GAME_W / 2, y: GAME_H / 2 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp((e.clientX - rect.left) / rect.width * GAME_W, 0, GAME_W),
      y: clamp((e.clientY - rect.top) / rect.height * GAME_H, 0, GAME_H)
    };
  }

  function bindCanvas(el) {
    canvas = el;
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    el.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      const p = canvasPoint(e);
      input.mouseX = p.x;
      input.mouseY = p.y;
      input.mouseInside = true;
      input.mouseUsed = true;
    });
    el.addEventListener('pointerleave', function () {
      input.mouseInside = false;
    });
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      const p = canvasPoint(e);
      input.mouseX = p.x;
      input.mouseY = p.y;
      input.mouseInside = true;
      input.mouseUsed = true;
      if (e.button === 0) {
        input.attackDown = true;
        input.attackPressed = true;
        input.mouseAttackPressed = true;
      } else if (e.button === 1) {
        input.bookPressed = true;
        e.preventDefault();
      } else if (e.button === 2) {
        input.dashPressed = true;
        e.preventDefault();
      }
    });
    window.addEventListener('pointerup', function (e) {
      if (e.pointerType === 'mouse' && e.button === 0) {
        input.attackDown = false;
      }
    });
    window.addEventListener('pointercancel', function () {
      input.attackDown = false;
    });
  }

  function setTouch(action, down, e) {
    if (e) e.preventDefault();
    input.touchActive = true;
    if (action === 'left') input.left = down;
    if (action === 'right') input.right = down;
    if (action === 'jump') {
      input.jumpDown = down;
      if (down) input.jumpPressed = true;
    }
    if (action === 'attack') {
      input.attackDown = down;
      if (down) input.attackPressed = true;
    }
    if (action === 'dash' && down) input.dashPressed = true;
    if (action === 'book' && down) input.bookPressed = true;
    if (action === 'special' && down) input.specialPressed = true;
    if (action === 'interact' && down) input.interactPressed = true;
    if (action === 'pause' && down) input.pausePressed = true;
    if (action === 'advance' && down) input.advancePressed = true;
  }

  function bindTouch(buttons) {
    buttons.forEach(function (btn) {
      const action = btn.getAttribute('data-action');
      if (!action) return;
      btn.addEventListener('pointerdown', function (e) {
        if (btn.setPointerCapture) {
          try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        btn.classList.add('pressed');
        setTouch(action, true, e);
      });
      const up = function (e) {
        btn.classList.remove('pressed');
        setTouch(action, false, e);
      };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('lostpointercapture', up);
      btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });
  }

  function endFrame() {
    input.jumpPressed = false;
    input.attackPressed = false;
    input.mouseAttackPressed = false;
    input.dashPressed = false;
    input.bookPressed = false;
    input.specialPressed = false;
    input.interactPressed = false;
    input.pausePressed = false;
    input.advancePressed = false;
  }

  function releaseAll() {
    for (const k in held) held[k] = false;
    input.left = false;
    input.right = false;
    input.jumpDown = false;
    input.attackDown = false;
    input.jumpPressed = false;
    input.attackPressed = false;
    input.mouseAttackPressed = false;
    input.dashPressed = false;
    input.bookPressed = false;
    input.specialPressed = false;
    input.interactPressed = false;
    input.pausePressed = false;
    input.advancePressed = false;
  }

  input.bindCanvas = bindCanvas;
  input.bindTouch = bindTouch;
  input.endFrame = endFrame;
  input.releaseAll = releaseAll;
  window.KC_INPUT = input;
})();
