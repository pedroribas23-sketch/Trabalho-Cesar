/* =========================================================
   KENNEDITO — interface DOM: telas, contas, ranking e diário
   ========================================================= */
'use strict';

(function () {
  const UI = {
    screens: {},
    active: null,
    handlers: {},
    toastTimer: null,
    accountMode: 'login',
    confirmCallback: null,
    confirmReturn: null
  };

  const $ = function (id) { return document.getElementById(id); };

  function call(name, a, b, c) {
    const fn = UI.handlers[name];
    if (typeof fn === 'function') {
      try { return fn(a, b, c); } catch (e) { console.error('UI handler ' + name, e); }
    }
    return undefined;
  }

  UI.init = function () {
    [
      'title', 'intro', 'pause', 'controls', 'difficulty', 'account', 'ranking', 'journal',
      'gameover', 'ending', 'confirm'
    ].forEach(function (name) {
      UI.screens[name] = $('screen-' + name);
    });

    UI.el = {
      title: $('screen-title'),
      titleMenu: $('title-menu'),
      btnContinue: $('btn-continue'),
      btnNew: $('btn-new'),
      btnRanking: $('btn-ranking'),
      btnControls: $('btn-controls'),
      btnDifficulty: $('btn-difficulty'),
      btnDifficultyClose: $('btn-difficulty-close'),
      difficultyGrid: $('difficulty-grid'),
      btnAccount: $('btn-account'),
      btnSound: $('btn-sound'),
      btnIntroNext: $('btn-intro-next'),
      btnIntroSkip: $('btn-intro-skip'),
      introTitle: $('intro-title'),
      introText: $('intro-text'),
      btnResume: $('btn-resume'),
      btnPauseControls: $('btn-pause-controls'),
      btnPauseDifficulty: $('btn-pause-difficulty'),
      btnPauseJournal: $('btn-pause-journal'),
      btnPauseRanking: $('btn-pause-ranking'),
      btnPauseAccount: $('btn-pause-account'),
      btnRestartRoom: $('btn-restart-room'),
      btnQuit: $('btn-quit'),
      btnControlsClose: $('btn-controls-close'),
      accountStatus: $('account-status'),
      tabLogin: $('tab-login'),
      tabCreate: $('tab-create'),
      accountForm: $('account-form'),
      accountName: $('account-name'),
      accountPin: $('account-pin'),
      btnAccountSubmit: $('btn-account-submit'),
      btnAccountClose: $('btn-account-close'),
      btnAccountClose2: $('btn-account-close-2'),
      accountLogged: $('account-logged'),
      accountNameDisplay: $('account-name-display'),
      btnSync: $('btn-sync'),
      btnLogout: $('btn-logout'),
      rankingStatus: $('ranking-status'),
      rankingList: $('ranking-list'),
      btnRankingRefresh: $('btn-ranking-refresh'),
      btnRankingClose: $('btn-ranking-close'),
      journalList: $('journal-list'),
      btnJournalClose: $('btn-journal-close'),
      btnRetry: $('btn-retry'),
      btnGameoverHub: $('btn-gameover-hub'),
      btnEndingRanking: $('btn-ending-ranking'),
      btnEndingTitle: $('btn-ending-title'),
      endingText: $('ending-text'),
      endingStats: $('ending-stats'),
      confirmTitle: $('confirm-title'),
      confirmText: $('confirm-text'),
      btnConfirmYes: $('btn-confirm-yes'),
      btnConfirmNo: $('btn-confirm-no'),
      cloudBadge: $('cloud-badge'),
      pauseBtn: $('pause-btn'),
      topControls: $('top-controls'),
      touchControls: $('touch-controls'),
      toast: $('toast'),
      rotate: $('rotate')
    };

    // título
    bind(UI.el.btnNew, function () { audio.init(); call('newGame'); });
    bind(UI.el.btnContinue, function () { audio.init(); call('continueGame'); });
    bind(UI.el.btnRanking, function () { audio.init(); call('openRanking', 'title'); });
    bind(UI.el.btnControls, function () { call('openControls', 'title'); });
    bind(UI.el.btnDifficulty, function () { call('openDifficulty', 'title'); });
    bind(UI.el.btnAccount, function () { call('openAccount', 'title'); });
    bind(UI.el.btnSound, function () { call('toggleSound'); });

    // introdução
    bind(UI.el.btnIntroNext, function () { call('introNext'); });
    bind(UI.el.btnIntroSkip, function () { call('introSkip'); });

    // pausa
    bind(UI.el.btnResume, function () { call('resume'); });
    bind(UI.el.btnPauseControls, function () { call('openControls', 'pause'); });
    bind(UI.el.btnPauseDifficulty, function () { call('openDifficulty', 'pause'); });
    bind(UI.el.btnPauseJournal, function () { call('openJournal'); });
    bind(UI.el.btnPauseRanking, function () { call('openRanking', 'pause'); });
    bind(UI.el.btnPauseAccount, function () { call('openAccount', 'pause'); });
    bind(UI.el.btnRestartRoom, function () { call('restartRoom'); });
    bind(UI.el.btnQuit, function () { call('quitToTitle'); });

    // controles
    bind(UI.el.btnControlsClose, function () { call('closeOverlay', 'controls'); });

    // dificuldade
    bind(UI.el.btnDifficultyClose, function () { call('closeDifficulty'); });
    if (UI.el.difficultyGrid) {
      UI.el.difficultyGrid.addEventListener('click', function (e) {
        const card = e.target.closest ? e.target.closest('.diff-card') : null;
        if (!card) return;
        call('setDifficulty', card.getAttribute('data-difficulty'));
      });
    }

    // conta
    bind(UI.el.tabLogin, function () { setAccountMode('login'); });
    bind(UI.el.tabCreate, function () { setAccountMode('create'); });
    UI.el.accountForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = String(UI.el.accountName.value || '').trim();
      const pin = String(UI.el.accountPin.value || '').trim();
      if (name.length < 3 || name.length > 18) {
        setAccountStatus('O apelido precisa ter entre 3 e 18 caracteres.', 'error');
        UI.el.accountName.focus();
        return;
      }
      if (!/^\d{4}$/.test(pin)) {
        setAccountStatus('O PIN precisa ter exatamente 4 dígitos.', 'error');
        UI.el.accountPin.focus();
        return;
      }
      call('accountSubmit', UI.accountMode, name, pin);
    });
    UI.el.accountPin.addEventListener('input', function () {
      const digits = String(UI.el.accountPin.value || '').replace(/\D/g, '').slice(0, 4);
      if (UI.el.accountPin.value !== digits) UI.el.accountPin.value = digits;
    });
    bind(UI.el.btnAccountClose, function () { call('closeAccount'); });
    bind(UI.el.btnAccountClose2, function () { call('closeAccount'); });
    bind(UI.el.btnSync, function () { call('syncNow'); });
    bind(UI.el.btnLogout, function () { call('logout'); });

    // ranking
    bind(UI.el.btnRankingRefresh, function () { call('refreshRanking'); });
    bind(UI.el.btnRankingClose, function () { call('closeOverlay', 'ranking'); });

    // diário
    bind(UI.el.btnJournalClose, function () { call('closeOverlay', 'journal'); });

    // game over
    bind(UI.el.btnRetry, function () { call('retryRoom'); });
    bind(UI.el.btnGameoverHub, function () { call('backToHub'); });

    // final
    bind(UI.el.btnEndingRanking, function () { call('openRanking', 'ending'); });
    bind(UI.el.btnEndingTitle, function () { call('endingToTitle'); });

    // confirmação
    bind(UI.el.btnConfirmYes, function () {
      const cb = UI.confirmCallback;
      UI.confirmCallback = null;
      UI.confirmReturn = null;
      UI.confirmOpen = false;
      hide();
      if (cb) cb();
    });
    bind(UI.el.btnConfirmNo, function () {
      UI.confirmCallback = null;
      const ret = UI.confirmReturn;
      UI.confirmReturn = null;
      UI.confirmOpen = false;
      hide();
      if (ret) UI.showScreen(ret);
    });

    // barra superior
    bind(UI.el.cloudBadge, function () {
      if (UI.active === 'account') return;
      call('openAccount', UI.active === 'pause' ? 'pause' : (UI.active === 'title' ? 'title' : 'title'));
    });
    bind(UI.el.pauseBtn, function () { call('togglePause'); });

    setAccountMode('login');
    UI.setSound(false);
    UI.setCloudBadge('LOCAL', '');
    UI.setContinueVisible(false);
    UI.setTopVisible(false);
    UI.setTouchVisible(false);
  };

  function bind(el, fn) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      try { fn(e); } catch (err) { console.error(err); }
    });
  }

  UI.bind = function (handlers) {
    UI.handlers = handlers || {};
  };

  UI.showScreen = function (name) {
    Object.keys(UI.screens).forEach(function (key) {
      if (UI.screens[key]) UI.screens[key].classList.remove('active');
    });
    UI.active = name || null;
    if (name && UI.screens[name]) UI.screens[name].classList.add('active');
  };

  UI.hideScreens = function () {
    UI.showScreen(null);
  };

  UI.activeScreen = function () {
    return UI.active;
  };

  UI.setTitleVisible = function (visible) {
    if (visible) UI.showScreen('title');
    else if (UI.active === 'title') UI.hideScreens();
  };

  UI.setContinueVisible = function (visible) {
    if (!UI.el.btnContinue) return;
    UI.el.btnContinue.classList.toggle('hidden', !visible);
    UI.el.btnNew.classList.toggle('primary', !visible);
    UI.el.btnContinue.classList.toggle('primary', !!visible);
  };

  UI.setSound = function (muted) {
    if (UI.el.btnSound) UI.el.btnSound.textContent = muted ? 'Som: Desligado' : 'Som: Ligado';
  };

  /* Difficulty: highlights the chosen card and updates the title button. */
  UI.setDifficulty = function (id) {
    const def = difficultyDef(id);
    if (UI.el.btnDifficulty) {
      UI.el.btnDifficulty.textContent = 'Dificuldade: ' + def.name;
    }
    if (UI.el.difficultyGrid) {
      const cards = UI.el.difficultyGrid.querySelectorAll('.diff-card');
      for (let i = 0; i < cards.length; i++) {
        cards[i].classList.toggle('selected', cards[i].getAttribute('data-difficulty') === def.id);
      }
    }
  };

  UI.setTopVisible = function (visible) {
    if (UI.el.topControls) UI.el.topControls.classList.toggle('hidden', !visible);
  };

  UI.setTouchVisible = function (visible) {
    if (UI.el.touchControls) UI.el.touchControls.classList.toggle('hidden', !visible);
  };

  UI.setCloudBadge = function (label, state) {
    const el = UI.el.cloudBadge;
    if (!el) return;
    el.textContent = label || 'LOCAL';
    el.className = 'cloud-badge' + (state ? ' ' + state : '');
    el.title = state === 'online' ? 'Conta conectada — clique para gerenciar'
      : state === 'offline' ? 'Servidor indisponível — progresso local ativo'
      : state === 'syncing' ? 'Sincronizando progresso...'
      : 'Progresso salvo somente neste dispositivo';
  };

  UI.setIntroPage = function (title, text, buttonLabel, canSkip) {
    if (UI.el.introTitle) UI.el.introTitle.textContent = title;
    if (UI.el.introText) UI.el.introText.textContent = text;
    if (UI.el.btnIntroNext) UI.el.btnIntroNext.textContent = buttonLabel || 'Continuar';
    if (UI.el.btnIntroSkip) UI.el.btnIntroSkip.classList.toggle('hidden', !canSkip);
  };

  UI.setAccountMode = function (mode) {
    setAccountMode(mode);
  };

  function setAccountMode(mode) {
    UI.accountMode = mode === 'create' ? 'create' : 'login';
    if (UI.el.tabLogin) UI.el.tabLogin.classList.toggle('active', UI.accountMode === 'login');
    if (UI.el.tabCreate) UI.el.tabCreate.classList.toggle('active', UI.accountMode === 'create');
    if (UI.el.btnAccountSubmit) UI.el.btnAccountSubmit.textContent = UI.accountMode === 'create' ? 'Criar conta' : 'Entrar';
  }

  UI.setAccountStatus = function (text, tone) {
    setAccountStatus(text, tone);
  };

  function setAccountStatus(text, tone) {
    const el = UI.el.accountStatus;
    if (!el) return;
    el.textContent = text;
    el.style.borderLeftColor = tone === 'error' ? 'var(--red)' : (tone === 'success' ? 'var(--green)' : 'var(--green-2)');
    el.style.color = tone === 'error' ? '#ffb4b4' : (tone === 'success' ? '#c7ffdd' : '#b8e9cd');
  }

  UI.setAccountLogged = function (account) {
    const logged = !!account;
    if (UI.el.accountLogged) UI.el.accountLogged.classList.toggle('hidden', !logged);
    if (UI.el.accountForm) UI.el.accountForm.classList.toggle('hidden', logged);
    if (UI.el.tabLogin) UI.el.tabLogin.classList.toggle('hidden', logged);
    if (UI.el.tabCreate) UI.el.tabCreate.classList.toggle('hidden', logged);
    if (logged) {
      if (UI.el.accountNameDisplay) UI.el.accountNameDisplay.textContent = 'Conectado como ' + account.name + '. O progresso será sincronizado com a nuvem.';
      setAccountStatus('Conta conectada. O progresso local e o da nuvem serão mantidos em sincronia.', 'success');
    } else {
      setAccountMode('login');
    }
  };

  UI.setAccountBusy = function (busy, label) {
    const b = UI.el.btnAccountSubmit;
    if (b) {
      b.disabled = !!busy;
      b.textContent = busy ? (label || 'Aguarde...') : (UI.accountMode === 'create' ? 'Criar conta' : 'Entrar');
    }
    if (UI.el.btnSync) UI.el.btnSync.disabled = !!busy;
    if (UI.el.btnLogout) UI.el.btnLogout.disabled = !!busy;
  };

  UI.setRankingStatus = function (text, tone) {
    if (!UI.el.rankingStatus) return;
    UI.el.rankingStatus.textContent = text;
    UI.el.rankingStatus.style.borderLeftColor = tone === 'error' ? 'var(--red)' : 'var(--green-2)';
    UI.el.rankingStatus.style.color = tone === 'error' ? '#ffb4b4' : '#b8e9cd';
  };

  UI.setRanking = function (entries, selfName) {
    const list = UI.el.rankingList;
    if (!list) return;
    list.textContent = '';
    if (!entries || !entries.length) {
      UI.setRankingStatus('Nenhum tempo registrado ainda. Termine o jogo para entrar no ranking.', 'info');
      return;
    }
    UI.setRankingStatus('Melhores tempos da CEPK', 'info');
    entries.forEach(function (entry, index) {
      const li = document.createElement('li');
      if (selfName && entry.name && String(entry.name).toLowerCase() === String(selfName).toLowerCase()) {
        li.classList.add('me');
      }
      const rank = document.createElement('span');
      rank.className = 'rank';
      rank.textContent = '#' + (entry.rank || index + 1);
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = entry.name || '???';
      if (entry.difficulty) {
        const tag = document.createElement('em');
        tag.className = 'diff-tag-inline';
        tag.textContent = difficultyDef(entry.difficulty).name;
        name.appendChild(tag);
      }
      const time = document.createElement('span');
      time.className = 'time';
      time.textContent = fmtTimeMs(entry.timeMs);
      const deaths = document.createElement('span');
      deaths.className = 'deaths';
      deaths.textContent = (entry.deaths || 0) + ' morte' + ((entry.deaths || 0) === 1 ? '' : 's');
      li.appendChild(rank);
      li.appendChild(name);
      li.appendChild(time);
      li.appendChild(deaths);
      list.appendChild(li);
    });
  };

  UI.setJournal = function (save) {
    const list = UI.el.journalList;
    if (!list) return;
    list.textContent = '';
    const collected = (save && Array.isArray(save.lore)) ? save.lore : [];
    if (typeof LORE_ENTRIES === 'undefined') return;
    LORE_ENTRIES.forEach(function (entry) {
      const div = document.createElement('div');
      const has = collected.indexOf(entry.id) >= 0;
      div.className = 'journal-entry' + (has ? '' : ' locked');
      const title = document.createElement('b');
      title.textContent = has ? entry.title : '???';
      const text = document.createElement('span');
      text.textContent = has ? entry.text : 'Página ainda não encontrada. Explore a escola.';
      div.appendChild(title);
      div.appendChild(text);
      list.appendChild(div);
    });
  };

  UI.setEnding = function (stats, text) {
    if (UI.el.endingText) UI.el.endingText.textContent = text || 'Mas, por enquanto... ela dorme.';
    const wrap = UI.el.endingStats;
    if (!wrap) return;
    wrap.textContent = '';
    const items = [
      ['Tempo total', fmtTimeMs(stats && stats.timeMs)],
      ['Mortes', String((stats && stats.deaths) || 0)],
      ['Inimigos', String((stats && stats.kills) || 0)],
      ['Chefes', String((stats && stats.bosses) || 0) + '/5'],
      ['Chaves', String((stats && stats.keys) || 0) + '/5'],
      ['Diário', String((stats && stats.lore) || 0) + '/6'],
      ['Dificuldade', difficultyDef(stats && stats.difficulty).name]
    ];
    items.forEach(function (item) {
      const d = document.createElement('div');
      d.textContent = item[0];
      const b = document.createElement('b');
      b.textContent = item[1];
      d.appendChild(b);
      wrap.appendChild(d);
    });
  };

  UI.toast = function (text, ms) {
    const el = UI.el.toast;
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
    if (UI.toastTimer) clearTimeout(UI.toastTimer);
    UI.toastTimer = setTimeout(function () {
      el.classList.add('hidden');
    }, Math.max(700, ms || 2400));
  };

  UI.confirm = function (title, text, onYes) {
    if (UI.confirmOpen) return;
    UI.confirmOpen = true;
    UI.confirmReturn = UI.active;
    UI.confirmCallback = onYes || null;
    if (UI.el.confirmTitle) UI.el.confirmTitle.textContent = title || 'Confirmar?';
    if (UI.el.confirmText) UI.el.confirmText.textContent = text || '';
    UI.showScreen('confirm');
  };

  UI.isConfirmOpen = function () {
    return !!UI.confirmOpen;
  };

  UI.closeConfirm = function () {
    UI.confirmOpen = false;
    UI.confirmCallback = null;
    const ret = UI.confirmReturn;
    UI.confirmReturn = null;
    hide();
    if (ret) UI.showScreen(ret);
  };

  function hide() {
    Object.keys(UI.screens).forEach(function (key) {
      if (UI.screens[key]) UI.screens[key].classList.remove('active');
    });
    UI.active = null;
  }

  UI.showAccount = function () {
    UI.showScreen('account');
  };

  window.KC_UI = UI;
  UI.init();
})();
