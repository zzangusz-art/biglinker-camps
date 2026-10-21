/* BigLinker Camps — interactions */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  root.classList.add('js');

  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  var I18N = window.I18N = window.I18N || {};
  var CAMPS = window.CAMPS || [];
  var FILTERS = window.FILTERS || {};
  var QUICK = window.QUICK || [];
  var ARTICLES = window.ARTICLES || [];
  var LANGS = window.LANGS || [['ko', '한국어']];
  var LANG_CODES = LANGS.map(function (l) { return l[0]; });
  var IMG = 'assets/img/';
  var GROUPS = ['cat', 'age', 'with', 'len', 'region'];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };

  var state = {
    lang: 'ko',
    f: { cat: new Set(), age: new Set(), with: new Set(), len: new Set(), region: new Set() },
    sort: 'rec',
    compare: [],
    quick: null,
    gridReady: false
  };

  var ICON_X = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.5"/></svg>';
  var ICON_X_SM = '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M3 3l6 6M9 3 3 9" stroke="currentColor" stroke-width="1.4"/></svg>';
  var ICON_ADD = '<svg class="i-plus" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.4"/></svg><svg class="i-check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

  /* ---------- i18n ---------- */
  function t(key, vars) {
    var d = I18N[state.lang];
    var v = d && d[key];
    if (v == null && I18N.en) v = I18N.en[key];
    if (v == null && I18N.ko) v = I18N.ko[key];
    if (v == null) return key;
    if (vars && typeof v === 'string') {
      v = v.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    }
    return v;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function plain(s) { return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
  function list(arr) { return '<ul>' + (arr || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }
  function byId(id) { for (var i = 0; i < CAMPS.length; i++) if (CAMPS[i].id === id) return CAMPS[i]; return null; }
  function ct(id, f) { return t('camp.' + id + '.' + f); }
  function label(g, v) { return t({ cat: 'cat.', age: 'age.', with: 'with.', len: 'len.', region: 'region.' }[g] + v); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function applyStatic() {
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $$('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var i = pair.indexOf(':');
        if (i < 1) return;
        el.setAttribute(pair.slice(0, i).trim(), plain(t(pair.slice(i + 1).trim())));
      });
    });
    $$('[data-fig]').forEach(function (el) { el.textContent = t('fig') + ' ' + el.getAttribute('data-fig'); });
    $$('[data-min]').forEach(function (el) { el.textContent = t('journal.min', { n: el.getAttribute('data-min') }); });
    doc.title = t('meta.title');
    root.lang = state.lang;
  }

  var FONT_FAMILIES = {
    ja: 'Noto+Serif+JP:wght@400;500;600;700&family=IBM+Plex+Sans+JP:wght@400;500;600',
    zh: 'Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600',
    th: 'Noto+Serif+Thai:wght@400;500;600;700&family=IBM+Plex+Sans+Thai:wght@400;500;600'
  };
  var fontsLoaded = {};
  function ensureFonts(lang) {
    var q = FONT_FAMILIES[lang];
    if (!q || fontsLoaded[lang]) return;
    fontsLoaded[lang] = true;
    var l = doc.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + q + '&display=swap';
    doc.head.appendChild(l);
  }
  function ensureLang(lang) {
    if (I18N[lang]) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = doc.createElement('script');
      s.src = 'i18n/' + lang + '.js';
      s.onload = function () { I18N[lang] ? resolve() : reject(new Error('empty')); };
      s.onerror = reject;
      doc.head.appendChild(s);
    });
  }

  function setLang(lang, opts) {
    opts = opts || {};
    if (LANG_CODES.indexOf(lang) < 0) lang = 'ko';
    if (opts.announce) root.classList.add('is-switching');
    return ensureLang(lang).catch(function () { lang = 'ko'; }).then(function () {
      ensureFonts(lang);
      state.lang = lang;
      store.set('blc.lang', lang);
      applyStatic();
      renderDynamic();
      root.classList.remove('is-switching');
      if (opts.announce) {
        toast(t('toast.lang'));
        try { history.replaceState(null, '', '#' + lang); } catch (e) { /* sandboxed */ }
      }
    });
  }

  function renderDynamic() {
    renderLangMenus();
    renderChips();
    renderSort();
    if (state.gridReady) renderGrid(false); else renderStatus(CAMPS.filter(match).length);
    renderTray();
    syncQuick();
  }

  /* ---------- Language menus ---------- */
  function langButtons(withCode) {
    return LANGS.map(function (l) {
      return '<button type="button" data-lang="' + l[0] + '" lang="' + l[0] + '" aria-current="' + (l[0] === state.lang) + '">' +
        '<span>' + esc(l[1]) + '</span>' + (withCode ? '<span class="code">' + l[0] + '</span>' : '') + '</button>';
    });
  }
  function renderLangMenus() {
    $('#langMenu').innerHTML = langButtons(true).join('');
    $('#drawerLangs').innerHTML = langButtons(false).map(function (b) { return '<li>' + b + '</li>'; }).join('');
    $('#footLangs').innerHTML = langButtons(false).map(function (b) { return '<li>' + b + '</li>'; }).join('');
  }
  var langBtn = $('#langBtn');
  var langMenu = $('#langMenu');
  function toggleLangMenu(open) {
    if (open == null) open = langMenu.hidden;
    langMenu.hidden = !open;
    langBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      var cur = langMenu.querySelector('[aria-current="true"]') || langMenu.querySelector('button');
      if (cur) cur.focus();
    }
  }
  langBtn.addEventListener('click', function () { toggleLangMenu(); });
  doc.addEventListener('click', function (e) {
    if (!langMenu.hidden && !e.target.closest('#lang')) toggleLangMenu(false);
  });
  langMenu.addEventListener('keydown', function (e) {
    var items = $$('button', langMenu);
    var i = items.indexOf(doc.activeElement);
    if (e.key === 'Escape') { toggleLangMenu(false); langBtn.focus(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });

  /* ---------- Toasts (top layer via popover when available) ---------- */
  var toastBox = $('#toasts');
  var canPopover = typeof toastBox.showPopover === 'function';
  if (canPopover) toastBox.setAttribute('popover', 'manual');
  function raiseToasts() {
    if (!canPopover) return;
    try {
      if (toastBox.matches(':popover-open')) toastBox.hidePopover();
      toastBox.showPopover();
    } catch (e) { /* ignore */ }
  }
  function toast(msg, dur) {
    dur = dur || 3400;
    var el = doc.createElement('div');
    el.className = 'toast glass';
    el.setAttribute('role', 'status');
    el.style.setProperty('--dur', dur + 'ms');
    el.innerHTML = '<span class="toast__dot" aria-hidden="true"></span><span class="toast__msg"></span>' +
      '<button class="toast__x" type="button" aria-label="' + esc(t('toast.close')) + '">' + ICON_X_SM + '</button>' +
      '<span class="toast__bar" aria-hidden="true"></span>';
    el.querySelector('.toast__msg').textContent = msg;
    toastBox.appendChild(el);
    while (toastBox.children.length > 3) toastBox.firstElementChild.remove();
    raiseToasts();
    var timer = setTimeout(leave, dur);
    el.addEventListener('mouseenter', function () { clearTimeout(timer); el.querySelector('.toast__bar').style.animationPlayState = 'paused'; });
    el.addEventListener('mouseleave', function () { timer = setTimeout(leave, 1400); });
    el.querySelector('.toast__x').addEventListener('click', leave);
    function leave() {
      clearTimeout(timer);
      if (el.classList.contains('is-leaving')) return;
      el.classList.add('is-leaving');
      setTimeout(function () {
        el.remove();
        if (canPopover && !toastBox.children.length) { try { toastBox.hidePopover(); } catch (e) { /* ignore */ } }
      }, reduce ? 0 : 260);
    }
  }

  /* ---------- Dialogs ---------- */
  var triggers = new WeakMap();
  function openDialog(d, trigger) {
    if (d.open) return;
    triggers.set(d, trigger || doc.activeElement);
    d.classList.remove('is-closing');
    d.showModal();
    root.classList.add('has-dialog');
    if (toastBox.children.length) raiseToasts();
  }
  function closeDialog(d) {
    if (!d || !d.open) return Promise.resolve();
    if (d.classList.contains('is-closing')) return wait(240);
    return new Promise(function (resolve) {
      d.classList.add('is-closing');
      setTimeout(function () {
        d.classList.remove('is-closing');
        d.close();
        if (!$$('dialog[open]').length) root.classList.remove('has-dialog');
        var tr = triggers.get(d);
        if (tr && tr.focus && doc.contains(tr)) { try { tr.focus({ preventScroll: true }); } catch (e) { tr.focus(); } }
        resolve();
      }, reduce ? 0 : 230);
    });
  }
  function closeAll(except) {
    return Promise.all($$('dialog[open]').filter(function (d) { return d !== except; }).map(closeDialog));
  }
  $$('dialog').forEach(function (d) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(d); });
    d.addEventListener('click', function (e) {
      if (e.target !== d) return;
      var r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(d);
    });
  });

  /* ---------- Images: skeleton until loaded ---------- */
  function wireImages(scope) {
    $$('.frame.is-loading img', scope).forEach(function (img) {
      var done = function () { var f = img.closest('.frame'); if (f) f.classList.remove('is-loading'); };
      if (img.complete && img.naturalWidth) done();
      else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
    });
  }

  /* ---------- Camp Lab ---------- */
  function lenBucket(w) { return w <= 1 ? '1' : w === 2 ? '2' : w <= 4 ? '3' : '5'; }
  function hasAny(arr, set) { for (var i = 0; i < arr.length; i++) if (set.has(arr[i])) return true; return false; }
  function match(c) {
    var f = state.f;
    if (f.cat.size && !hasAny(c.cats, f.cat)) return false;
    if (f.age.size && !hasAny(c.ages, f.age)) return false;
    if (f.with.size && !f.with.has(c.with)) return false;
    if (f.len.size && !f.len.has(lenBucket(c.weeks))) return false;
    if (f.region.size && !f.region.has(c.region)) return false;
    return true;
  }
  function sorted(arr) {
    var idx = function (c) { return CAMPS.indexOf(c); };
    var fns = {
      rec: function (a, b) { return idx(a) - idx(b); },
      short: function (a, b) { return a.weeks - b.weeks || idx(a) - idx(b); },
      cost: function (a, b) { return a.cost - b.cost || a.weeks - b.weeks; },
      study: function (a, b) { return b.study - a.study || idx(a) - idx(b); },
      act: function (a, b) { return a.study - b.study || idx(a) - idx(b); }
    };
    return arr.slice().sort(fns[state.sort] || fns.rec);
  }
  function ratioHTML(study) {
    var act = 100 - study;
    return '<div class="ratio"><div class="ratio__bar" role="img" aria-label="' + esc(t('card.study') + ' ' + study + '% · ' + t('card.act') + ' ' + act + '%') + '"><i style="width:' + study + '%"></i></div>' +
      '<div class="ratio__labels" aria-hidden="true"><span>' + esc(t('card.study')) + ' ' + study + '</span><span>' + esc(t('card.act')) + ' ' + act + '</span></div></div>';
  }
  function cardHTML(c) {
    var on = state.compare.indexOf(c.id) > -1;
    var title = ct(c.id, 't');
    return '<article class="card" data-id="' + c.id + '" style="view-transition-name:card-' + c.id + '">' +
      '<button class="card__media" type="button" data-detail="' + c.id + '" aria-label="' + esc(title + ' · ' + t('card.more')) + '">' +
        '<span class="frame is-loading"><img src="' + IMG + c.img + '" alt="" loading="lazy" width="1536" height="' + (c.tall ? 2304 : 1024) + '"></span>' +
        '<span class="card__tag glass">' + esc(t('example')) + '</span>' +
      '</button>' +
      '<div class="card__body">' +
        '<p class="card__meta mono"><span>' + esc(ct(c.id, 'p')) + '</span><span>' + esc(t('card.weeks', { n: c.weeks })) + '</span></p>' +
        '<h3 class="card__title"><button type="button" data-detail="' + c.id + '">' + esc(title) + '</button></h3>' +
        '<p class="card__cats">' + c.cats.map(function (k) { return esc(t('cat.' + k)); }).join(' · ') + ' · ' + esc(t('with.' + c.with)) + '</p>' +
        '<p class="card__desc">' + esc(ct(c.id, 'd')) + '</p>' +
        ratioHTML(c.study) +
        '<div class="card__foot">' +
          '<p class="card__cost"><b aria-hidden="true">' + new Array(c.cost + 1).join('₩') + '</b>' + esc(t('cost.' + c.cost)) + '</p>' +
          '<div class="card__actions">' +
            '<button class="linkbtn" type="button" data-detail="' + c.id + '">' + esc(t('card.more')) + '</button>' +
            '<button class="addbtn" type="button" data-compare="' + c.id + '" aria-pressed="' + on + '" aria-label="' + esc((on ? t('card.added') : t('card.add')) + ': ' + title) + '" title="' + esc(on ? t('card.added') : t('card.add')) + '">' + ICON_ADD + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</article>';
  }
  function skeletonHTML(n) {
    var one = '<div class="card card--sk" aria-hidden="true"><div class="sk sk-media"></div><div class="card__body">' +
      '<div class="sk sk-line" style="width:42%"></div><div class="sk sk-title"></div><div class="sk sk-line"></div><div class="sk sk-line" style="width:72%"></div><div class="sk sk-line" style="width:100%;height:3px;margin-top:6px"></div></div></div>';
    return new Array(n + 1).join(one);
  }
  var grid = $('#campGrid');
  function renderGrid(animate) {
    var items = sorted(CAMPS.filter(match));
    var update = function () {
      grid.innerHTML = items.map(cardHTML).join('');
      grid.setAttribute('aria-busy', 'false');
      $('#campEmpty').hidden = items.length > 0;
      wireImages(grid);
    };
    if (animate && doc.startViewTransition && !reduce && !$$('dialog[open]').length) doc.startViewTransition(update);
    else update();
    renderStatus(items.length);
  }
  function renderStatus(n) {
    $('#campCount').textContent = t('f.count', { n: n });
    var pills = [];
    ['age', 'with', 'len', 'region'].forEach(function (g) {
      state.f[g].forEach(function (v) {
        pills.push('<button class="chip chip--sm" type="button" data-unset="' + g + ':' + v + '" aria-label="' + esc(t('f.remove') + ': ' + label(g, v)) + '">' + esc(label(g, v)) + ' ' + ICON_X_SM + '</button>');
      });
    });
    $('#activeFilters').innerHTML = pills.join('');
    var total = GROUPS.reduce(function (a, g) { return a + state.f[g].size; }, 0);
    $('#resetFilters').hidden = total === 0;
    var badge = $('#moreCount');
    badge.hidden = pills.length === 0;
    badge.textContent = pills.length;
    var apply = $('#applyFilters');
    if (apply) apply.textContent = t('f.apply', { n: n });
  }
  function renderChips() {
    var allOn = state.f.cat.size === 0;
    $('#catChips').innerHTML = '<button class="chip" type="button" data-cat="" aria-pressed="' + allOn + '">' + esc(t('f.all')) + '</button>' +
      FILTERS.cat.map(function (k) {
        return '<button class="chip" type="button" data-cat="' + k + '" aria-pressed="' + state.f.cat.has(k) + '">' + esc(t('cat.' + k)) + '</button>';
      }).join('');
  }
  function renderSort() {
    $('#sortSel').innerHTML = ['rec', 'short', 'cost', 'study', 'act'].map(function (k) {
      return '<option value="' + k + '"' + (state.sort === k ? ' selected' : '') + '>' + esc(t('sort.' + k)) + '</option>';
    }).join('');
  }
  function syncQuick() {
    $$('[data-quick]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-quick') === state.quick)); });
  }
  function clearFilters() { GROUPS.forEach(function (g) { state.f[g].clear(); }); state.quick = null; }
  function filtersChanged(animate) {
    renderChips();
    syncQuick();
    renderGrid(animate);
    if ($('#filterDrawer').open) syncDrawerChips();
  }
  function scrollToGrid() {
    var top = grid.getBoundingClientRect().top + window.scrollY - ($('#filterbar').offsetHeight + 120);
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
  }

  $('#catChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    var k = b.getAttribute('data-cat');
    if (!k) state.f.cat.clear();
    else if (state.f.cat.has(k)) state.f.cat.delete(k);
    else state.f.cat.add(k);
    state.quick = null;
    filtersChanged(true);
  });
  $$('[data-quick]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-quick');
      var q = QUICK.filter(function (x) { return x.id === id; })[0];
      var wasOn = state.quick === id;
      clearFilters();
      if (q && !wasOn) {
        Object.keys(q.set).forEach(function (g) { q.set[g].forEach(function (v) { state.f[g].add(v); }); });
        state.quick = id;
        toast(t('toast.quick', { name: t('quick.' + id + '.t') }));
      }
      filtersChanged(true);
      scrollToGrid();
    });
  });
  $('#sortSel').addEventListener('change', function (e) { state.sort = e.target.value; renderGrid(true); });
  $('#activeFilters').addEventListener('click', function (e) {
    var b = e.target.closest('[data-unset]');
    if (!b) return;
    var p = b.getAttribute('data-unset').split(':');
    state.f[p[0]].delete(p[1]);
    state.quick = null;
    filtersChanged(true);
  });
  function resetFilters() {
    clearFilters();
    filtersChanged(true);
    toast(t('toast.reset'));
  }
  $('#resetFilters').addEventListener('click', resetFilters);

  /* Filter drawer */
  var filterDrawer = $('#filterDrawer');
  function renderFilterDrawer() {
    var titles = { cat: 'f.cat', age: 'f.age', with: 'f.with', len: 'f.len', region: 'f.region' };
    filterDrawer.innerHTML =
      '<div class="drawer__head"><h2 class="drawer__title display" id="filterTitle">' + esc(t('f.title')) + '</h2>' +
      '<button class="iconbtn" type="button" data-close aria-label="' + esc(t('nav.close')) + '">' + ICON_X + '</button></div>' +
      '<div class="drawer__body"><div class="filters">' +
      GROUPS.map(function (g) {
        return '<fieldset><legend>' + esc(t(titles[g])) + '</legend><div class="chips">' +
          FILTERS[g].map(function (v) {
            return '<button class="chip" type="button" data-fgroup="' + g + '" data-fval="' + v + '" aria-pressed="' + state.f[g].has(v) + '">' + esc(label(g, v)) + '</button>';
          }).join('') + '</div></fieldset>';
      }).join('') +
      '</div></div>' +
      '<div class="drawer__foot"><button class="linkbtn" type="button" data-reset-filters>' + esc(t('f.reset')) + '</button>' +
      '<button class="btn btn--ink" type="button" data-close id="applyFilters">' + esc(t('f.apply', { n: CAMPS.filter(match).length })) + '</button></div>';
  }
  function syncDrawerChips() {
    $$('[data-fgroup]', filterDrawer).forEach(function (b) {
      b.setAttribute('aria-pressed', String(state.f[b.getAttribute('data-fgroup')].has(b.getAttribute('data-fval'))));
    });
  }
  filterDrawer.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fgroup]');
    if (!b) return;
    var g = b.getAttribute('data-fgroup');
    var v = b.getAttribute('data-fval');
    if (state.f[g].has(v)) state.f[g].delete(v); else state.f[g].add(v);
    state.quick = null;
    filtersChanged(false);
  });
  $('#moreFilters').addEventListener('click', function (e) {
    renderFilterDrawer();
    openDialog(filterDrawer, e.currentTarget);
  });

  /* ---------- Compare ---------- */
  function saveCompare() { store.set('blc.compare', JSON.stringify(state.compare)); }
  function loadCompare() {
    try {
      var v = JSON.parse(store.get('blc.compare') || '[]');
      if (Array.isArray(v)) state.compare = v.filter(function (id) { return byId(id); }).slice(0, 3);
    } catch (e) { state.compare = []; }
  }
  function syncCompareButtons() {
    $$('[data-compare]').forEach(function (b) {
      var id = b.getAttribute('data-compare');
      var on = state.compare.indexOf(id) > -1;
      b.setAttribute('aria-pressed', String(on));
      if (b.hasAttribute('data-compare-text')) b.textContent = on ? t('card.added') : t('modal.add');
      else {
        b.setAttribute('aria-label', (on ? t('card.added') : t('card.add')) + ': ' + ct(id, 't'));
        b.title = on ? t('card.added') : t('card.add');
      }
    });
  }
  function toggleCompare(id) {
    var i = state.compare.indexOf(id);
    if (i > -1) { state.compare.splice(i, 1); toast(t('toast.removed')); }
    else {
      if (state.compare.length >= 3) { toast(t('toast.full'), 4200); return; }
      state.compare.push(id);
      toast(t('toast.added', { name: ct(id, 't') }));
    }
    saveCompare();
    syncCompareButtons();
    renderTray();
  }
  function renderTray() {
    var tray = $('#tray');
    var n = state.compare.length;
    tray.hidden = n === 0;
    root.classList.toggle('has-tray', n > 0);
    $('#trayCount').textContent = n + '/3';
    $('#trayItems').innerHTML = state.compare.map(function (id) {
      var c = byId(id);
      var name = ct(id, 't');
      return '<li class="tray__item"><img src="' + IMG + c.img + '" alt="' + esc(name) + '" title="' + esc(name) + '">' +
        '<button type="button" data-uncompare="' + id + '" aria-label="' + esc(t('compare.remove') + ': ' + name) + '">' + ICON_X_SM + '</button></li>';
    }).join('') + new Array(4 - n).join('<li class="tray__slot" aria-hidden="true"></li>');
  }
  function removeCompare(id) {
    var i = state.compare.indexOf(id);
    if (i < 0) return;
    state.compare.splice(i, 1);
    saveCompare();
    syncCompareButtons();
    renderTray();
    toast(t('toast.removed'));
    var m = $('#compareModal');
    if (m.open) { if (state.compare.length) fillCompare(); else closeDialog(m); }
  }
  function fillCompare() {
    var cs = state.compare.map(byId);
    var rows = [
      ['spec.region', function (c) { return esc(ct(c.id, 'p')); }],
      ['spec.target', function (c) { return esc(c.ages.map(function (a) { return t('age.' + a); }).join(', ')); }],
      ['spec.with', function (c) { return esc(t('with.' + c.with)); }],
      ['spec.len', function (c) { return esc(t('card.weeks', { n: c.weeks })); }],
      ['spec.stay', function (c) { return esc(ct(c.id, 's')); }],
      ['spec.cost', function (c) { return esc(new Array(c.cost + 1).join('₩') + ' · ' + t('cost.' + c.cost)); }],
      ['spec.care', function (c) { return esc(ct(c.id, 'c')); }],
      ['spec.ratio', function (c) { return ratioHTML(c.study); }],
      ['compare.summary', function (c) { return esc(ct(c.id, 'd')); }]
    ];
    var m = $('#compareModal');
    m.innerHTML = '<button class="modal__close glass" type="button" data-close aria-label="' + esc(t('modal.close')) + '">' + ICON_X + '</button>' +
      '<div class="cmp"><header class="cmp__head"><p class="mono">' + esc(t('compare.tray')) + ' · ' + cs.length + '/3</p>' +
      '<h2 class="cmp__title display" id="compareTitle">' + esc(t('compare.title')) + '</h2><p class="cmp__deck">' + esc(t('compare.deck')) + '</p></header>' +
      '<div class="cmp__scroll"><table><thead><tr><td></td>' + cs.map(function (c) {
        return '<th scope="col"><div class="cmp__camp"><img src="' + IMG + c.img + '" alt="" loading="lazy"><strong>' + esc(ct(c.id, 't')) + '</strong>' +
          '<button class="linkbtn" type="button" data-uncompare="' + c.id + '">' + esc(t('compare.remove')) + '</button></div></th>';
      }).join('') + '</tr></thead><tbody>' + rows.map(function (r) {
        return '<tr><th scope="row">' + esc(t(r[0])) + '</th>' + cs.map(function (c) { return '<td>' + r[1](c) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="cmp__actions"><button class="btn btn--ink" type="button" data-open-inquiry data-interest-ids="' + state.compare.join(',') + '">' + esc(t('compare.cta')) + '</button>' +
      '<button class="btn btn--line" type="button" data-close>' + esc(t('modal.close')) + '</button></div></div>';
  }
  $('#trayOpen').addEventListener('click', function (e) { fillCompare(); openDialog($('#compareModal'), e.currentTarget); });
  $('#trayClear').addEventListener('click', function () {
    state.compare = [];
    saveCompare();
    syncCompareButtons();
    renderTray();
    toast(t('toast.cleared'));
  });

  /* ---------- Camp detail modal ---------- */
  function accItem(id, title, body, open) {
    return '<div class="acc"><h3 class="acc__h"><button class="acc__btn" type="button" id="' + id + 'b" aria-expanded="' + !!open + '" aria-controls="' + id + '">' +
      '<span>' + esc(title) + '</span><span class="acc__icon" aria-hidden="true"></span></button></h3>' +
      '<div class="acc__panel' + (open ? ' is-open' : '') + '" id="' + id + '" role="region" aria-labelledby="' + id + 'b"><div class="acc__inner">' + body + '</div></div></div>';
  }
  function openCamp(id, trigger) {
    var c = byId(id);
    if (!c) return;
    var on = state.compare.indexOf(id) > -1;
    var day = ct(id, 'day');
    var specs = [
      ['spec.region', ct(id, 'p')],
      ['spec.target', c.ages.map(function (a) { return t('age.' + a); }).join(', ')],
      ['spec.with', t('with.' + c.with)],
      ['spec.len', t('card.weeks', { n: c.weeks })],
      ['spec.stay', ct(id, 's')],
      ['spec.care', ct(id, 'c')],
      ['spec.cost', new Array(c.cost + 1).join('₩') + ' · ' + t('cost.' + c.cost)],
      ['spec.ratio', c.study + ' : ' + (100 - c.study)]
    ];
    var m = $('#campModal');
    m.innerHTML = '<button class="modal__close glass" type="button" data-close aria-label="' + esc(t('modal.close')) + '">' + ICON_X + '</button>' +
      '<div class="modal__grid">' +
        '<figure class="modal__media"><span class="frame is-loading"><img src="' + IMG + c.img + '" alt="' + esc(ct(id, 't')) + '"></span>' +
          '<figcaption class="cap"><span class="cap__no mono">' + esc(t('example')) + '</span> ' + esc(ct(id, 'p')) + ' <span class="cap__credit">' + esc(t('credit.staged')) + '</span></figcaption></figure>' +
        '<div class="modal__body">' +
          '<p class="modal__kicker mono"><span>' + esc(t('example')) + '</span><span>' + c.cats.map(function (k) { return esc(t('cat.' + k)); }).join(' · ') + '</span></p>' +
          '<h2 class="modal__title display" id="campModalTitle">' + esc(ct(id, 't')) + '</h2>' +
          '<p class="modal__desc">' + esc(ct(id, 'd')) + '</p>' +
          '<dl class="specs">' + specs.map(function (s) { return '<div><dt>' + esc(t(s[0])) + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('') + '</dl>' +
          ratioHTML(c.study) +
          '<div class="accordion">' +
            accItem('m-day', t('modal.day'), '<ol class="day">' + (Array.isArray(day) ? day : []).map(function (d) {
              return '<li><span class="day__t">' + esc(d[0]) + '</span><span>' + esc(d[1]) + '</span></li>';
            }).join('') + '</ol>', true) +
            accItem('m-inc', t('modal.inc'), list(ct(id, 'inc')), false) +
            accItem('m-exc', t('modal.exc'), list(ct(id, 'exc')), false) +
            accItem('m-prep', t(c.domestic ? 'modal.prepKr' : 'modal.prep'), list(t(c.domestic ? 'prep.domestic' : 'prep.abroad')), false) +
          '</div>' +
          '<p class="modal__note">' + esc(t('modal.note')) + '</p>' +
          '<div class="modal__actions">' +
            '<button class="btn btn--ink" type="button" data-open-inquiry data-interest-ids="' + id + '">' + esc(t('modal.cta')) + '</button>' +
            '<button class="btn btn--line" type="button" data-compare="' + id + '" data-compare-text aria-pressed="' + on + '">' + esc(on ? t('card.added') : t('modal.add')) + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    wireImages(m);
    openDialog(m, trigger);
    var body = $('.modal__body', m);
    if (body) body.scrollTop = 0;
  }

  /* ---------- Accordions ---------- */
  function syncAccordions(scope) {
    $$('.acc__btn', scope).forEach(function (b) {
      var p = doc.getElementById(b.getAttribute('aria-controls'));
      if (p) p.classList.toggle('is-open', b.getAttribute('aria-expanded') === 'true');
    });
  }

  /* ---------- Journal ---------- */
  var articleDrawer = $('#articleDrawer');
  function openArticle(id, trigger) {
    var a = ARTICLES.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    var next = ARTICLES[(ARTICLES.indexOf(a) + 1) % ARTICLES.length];
    articleDrawer.setAttribute('aria-label', t('journal.loading'));
    articleDrawer.innerHTML = '<div class="drawer__head"><span class="mono">' + esc(t('journal.kicker')) + '</span>' +
      '<button class="iconbtn" type="button" data-close aria-label="' + esc(t('journal.close')) + '">' + ICON_X + '</button></div>' +
      '<div class="drawer__body" style="padding:0"><div class="article article--sk" aria-busy="true">' +
        '<div class="sk" style="aspect-ratio:3/2"></div><div class="sk sk-line" style="width:24%"></div><div class="sk sk-h"></div><div class="sk sk-h" style="width:60%"></div>' +
        '<div class="sk sk-line"></div><div class="sk sk-line"></div><div class="sk sk-line" style="width:84%"></div><div class="sk sk-line"></div><div class="sk sk-line" style="width:66%"></div>' +
      '</div></div>';
    if (!articleDrawer.open) openDialog(articleDrawer, trigger);
    wait(reduce ? 0 : 420).then(function () {
      var body = $('.drawer__body', articleDrawer);
      if (!body) return;
      var paras = t(id + '.body');
      body.innerHTML = '<article class="article">' +
        '<figure><span class="frame frame--3x2 is-loading"><img src="' + IMG + a.img + '" alt=""></span>' +
        '<figcaption class="cap"><span class="cap__credit cap__credit--solo">' + esc(t('credit.staged')) + '</span></figcaption></figure>' +
        '<p class="article__k mono">' + esc(t(id + '.k')) + '</p>' +
        '<h2 class="article__t display" id="articleTitle">' + esc(t(id + '.t')) + '</h2>' +
        '<p class="article__d">' + esc(t(id + '.d')) + '</p>' +
        '<p class="article__meta mono">' + esc(t('journal.by')) + ' · ' + esc(t('journal.date')) + ' · ' + esc(t('journal.min', { n: a.min })) + '</p>' +
        '<div class="prose">' + (Array.isArray(paras) ? paras : []).map(function (p) { return '<p>' + p + '</p>'; }).join('') + '</div>' +
        '<div class="article__next"><p class="mono">' + esc(t('journal.next')) + '</p><button type="button" data-article="' + next.id + '">' + esc(t(next.id + '.t')) + '</button></div>' +
        '</article>';
      articleDrawer.removeAttribute('aria-label');
      body.scrollTop = 0;
      wireImages(body);
    });
  }

  /* ---------- Inquiry drawer ---------- */
  var inquiry = $('#inquiryDrawer');
  var form = $('#inqForm');
  function showForm() { form.hidden = false; $('#inqDone').hidden = true; }
  function openInquiry(opts, trigger) {
    opts = opts || {};
    closeAll(inquiry).then(function () {
      showForm();
      if (opts.role) { var r = doc.getElementById('role-' + opts.role); if (r) r.checked = true; }
      if (opts.interest != null) $('#f-interest').value = opts.interest;
      openDialog(inquiry, trigger);
    });
  }
  function setErr(input, errSel, bad) {
    $(errSel).hidden = !bad;
    input.setAttribute('aria-invalid', String(bad));
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#f-name'), contact = $('#f-contact'), consent = $('#f-consent');
    var cv = contact.value.trim();
    var okName = !!name.value.trim();
    var okContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cv) || cv.replace(/\D/g, '').length >= 8;
    var okConsent = consent.checked;
    setErr(name, '#e-name', !okName);
    setErr(contact, '#e-contact', !okContact);
    setErr(consent, '#e-consent', !okConsent);
    if (!okName) return name.focus();
    if (!okContact) return contact.focus();
    if (!okConsent) return consent.focus();
    var roleEl = form.querySelector('input[name="role"]:checked');
    var role = roleEl ? roleEl.value : 'parent';
    var grade = $('#f-grade').value.trim();
    var interest = $('#f-interest').value.trim();
    var when = $('#f-when').value;
    var msg = $('#f-msg').value.trim();
    var lines = [
      t('form.subject'), '',
      t('form.name') + ': ' + name.value.trim() + ' (' + t('role.' + role) + ')',
      t('form.contact') + ': ' + cv
    ];
    if (grade) lines.push(t('form.grade') + ': ' + grade);
    if (interest) lines.push(t('form.interest') + ': ' + interest);
    lines.push(t('form.when') + ': ' + t('when.' + when));
    if (msg) lines.push('', t('form.msg') + ':', msg);
    lines.push('', '— BigLinker Camps (' + state.lang + ')');
    var text = lines.join('\n');
    $('#f-summary').value = text;
    $('#mailSummary').href = 'mailto:biglinkerkor@gmail.com?subject=' + encodeURIComponent(t('form.subject')) + '&body=' + encodeURIComponent(text);
    form.hidden = true;
    $('#inqDone').hidden = false;
    toast(t('toast.prepared'));
    $('#copySummary').focus();
  });
  form.addEventListener('input', function (e) {
    var el = e.target;
    if (el.getAttribute('aria-invalid') === 'true') {
      el.setAttribute('aria-invalid', 'false');
      var err = doc.getElementById(el.getAttribute('aria-describedby'));
      if (err) err.hidden = true;
    }
  });
  $('#editInquiry').addEventListener('click', function () { showForm(); $('#f-name').focus(); });
  $('#copySummary').addEventListener('click', function () { copyText($('#f-summary').value, $('#f-summary'), true); });

  /* ---------- Copy ---------- */
  function copyText(text, srcEl, long) {
    var done = function () { toast(t('toast.copied', { v: long ? t('form.title') : text })); };
    var fail = function () {
      if (srcEl && srcEl.select) { srcEl.focus(); srcEl.select(); }
      else if (srcEl) {
        var range = doc.createRange();
        range.selectNodeContents(srcEl);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      toast(t('toast.copyFail'), 4200);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
      else fail();
    } catch (e) { fail(); }
  }

  /* ---------- Global click delegation ---------- */
  doc.addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('.acc__btn'))) {
      var open = el.getAttribute('aria-expanded') !== 'true';
      el.setAttribute('aria-expanded', String(open));
      var p = doc.getElementById(el.getAttribute('aria-controls'));
      if (p) p.classList.toggle('is-open', open);
      return;
    }
    if ((el = e.target.closest('[data-close]'))) { closeDialog(el.closest('dialog')); return; }
    if ((el = e.target.closest('[data-detail]'))) { openCamp(el.getAttribute('data-detail'), el); return; }
    if ((el = e.target.closest('[data-compare]'))) { toggleCompare(el.getAttribute('data-compare')); return; }
    if ((el = e.target.closest('[data-uncompare]'))) { removeCompare(el.getAttribute('data-uncompare')); return; }
    if ((el = e.target.closest('[data-reset-filters]'))) { resetFilters(); return; }
    if ((el = e.target.closest('[data-article]'))) { openArticle(el.getAttribute('data-article'), el); return; }
    if ((el = e.target.closest('[data-lang]'))) {
      var code = el.getAttribute('data-lang');
      toggleLangMenu(false);
      var nd = $('#navDrawer');
      (nd.open ? closeDialog(nd) : Promise.resolve()).then(function () {
        if (code !== state.lang) setLang(code, { announce: true });
      });
      return;
    }
    if ((el = e.target.closest('[data-copy]'))) {
      var v = el.getAttribute('data-copy');
      copyText(v, el.parentNode.querySelector('.contact__v'));
      return;
    }
    if ((el = e.target.closest('[data-korea]'))) {
      openInquiry({ role: el.getAttribute('data-role') || 'student', interest: t('korea.' + el.getAttribute('data-korea') + '.t') }, el);
      return;
    }
    if ((el = e.target.closest('[data-open-inquiry]'))) {
      var opts = { role: el.getAttribute('data-role') || null };
      if (el.hasAttribute('data-interest-text')) opts.interest = el.getAttribute('data-interest-text');
      if (el.hasAttribute('data-interest-ids')) {
        opts.interest = el.getAttribute('data-interest-ids').split(',').filter(byId).map(function (id) { return ct(id, 't'); }).join(' / ');
      }
      openInquiry(opts, el);
      return;
    }
  });

  /* Mobile nav drawer */
  var navDrawer = $('#navDrawer');
  $('#menuBtn').addEventListener('click', function (e) { openDialog(navDrawer, e.currentTarget); });
  navDrawer.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    var target = doc.querySelector(a.getAttribute('href'));
    closeDialog(navDrawer).then(function () {
      if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- FAQ tabs ---------- */
  var tabs = $$('.tab');
  function selectTab(tab) {
    tabs.forEach(function (x) {
      var on = x === tab;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      doc.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (tb) {
    tb.addEventListener('click', function () { selectTab(tb); });
    tb.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var i = tabs.indexOf(tb);
      var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      selectTab(n);
      n.focus();
    });
  });

  /* ---------- Korea index: cursor-following preview ---------- */
  var hover = $('#hoverImg');
  var hoverImg = $('img', hover);
  var hoverTag = $('.hoverimg__tag', hover);
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer) {
    $('#koreaIndex').addEventListener('pointermove', function (e) {
      var row = e.target.closest('.index__row');
      if (!row) { hover.classList.remove('is-on'); return; }
      var src = IMG + row.getAttribute('data-img');
      if (hoverImg.getAttribute('src') !== src) hoverImg.setAttribute('src', src);
      hoverTag.textContent = row.hasAttribute('data-staged') ? t('credit.staged') : '';
      hover.style.setProperty('--hx', (e.clientX + 170) + 'px');
      hover.style.setProperty('--hy', e.clientY + 'px');
      hover.classList.add('is-on');
    });
    $('#koreaIndex').addEventListener('pointerleave', function () { hover.classList.remove('is-on'); });
  }

  /* ---------- Steps: sticky media follows the active step ---------- */
  var steps = $$('.step');
  function activateStep(s) {
    steps.forEach(function (x) { x.classList.toggle('is-active', x === s); });
    var m = s.getAttribute('data-media');
    $$('.how__fig').forEach(function (f) { f.classList.toggle('is-active', f.getAttribute('data-media') === m); });
  }
  if (steps.length) {
    activateStep(steps[0]);
    if ('IntersectionObserver' in window) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) activateStep(en.target); });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach(function (s) { sio.observe(s); });
    }
  }

  /* ---------- Count-up numbers ---------- */
  function countUp(el) {
    var end = +el.getAttribute('data-count');
    var suf = el.getAttribute('data-suffix') || '';
    var t0 = performance.now();
    var dur = 1400;
    (function frame(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e).toLocaleString('en-US') + suf;
      if (p < 1) requestAnimationFrame(frame);
    })(t0);
  }
  if (!reduce && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        countUp(en.target);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Scroll: masthead, progress, sticky filter bar, current nav ---------- */
  var progress = $('#progressBar');
  var filterbar = $('#filterbar');
  var lab = $('#lab');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY;
      root.classList.toggle('is-scrolled', y > 24);
      var h = root.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
      var r = filterbar.getBoundingClientRect();
      var stickTop = parseFloat(getComputedStyle(filterbar).top) || 0;
      filterbar.classList.toggle('is-stuck', r.top <= stickTop + 1 && lab.getBoundingClientRect().bottom > r.bottom + 40);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  var navLinks = $$('.mainnav a');
  if ('IntersectionObserver' in window) {
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    ['lab', 'feature', 'korea', 'how', 'partners', 'journal', 'faq'].forEach(function (id) {
      var s = doc.getElementById(id);
      if (s) nio.observe(s);
    });
  }

  /* ---------- Liquid glass: specular highlight + refraction where supported ---------- */
  doc.addEventListener('pointermove', function (e) {
    var g = e.target.closest && e.target.closest('.glass');
    if (!g) return;
    var r = g.getBoundingClientRect();
    g.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    g.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
  var brands = navigator.userAgentData && navigator.userAgentData.brands;
  var chromium = !!(brands && brands.some(function (b) { return /Chromium/i.test(b.brand); }));
  if (chromium && window.CSS && CSS.supports('backdrop-filter', 'url(#lg-refract)') && !reduce) root.classList.add('lg-refract');

  /* ---------- Boot ---------- */
  function pickLang() {
    var h = (location.hash || '').slice(1).toLowerCase();
    if (LANG_CODES.indexOf(h) > -1) return h;
    var saved = store.get('blc.lang');
    if (saved && LANG_CODES.indexOf(saved) > -1) return saved;
    var navs = navigator.languages || [navigator.language || 'ko'];
    for (var i = 0; i < navs.length; i++) {
      var code = String(navs[i]).slice(0, 2).toLowerCase();
      if (LANG_CODES.indexOf(code) > -1) return code;
    }
    return 'ko';
  }

  loadCompare();
  grid.innerHTML = skeletonHTML(6);
  syncAccordions(doc);
  wireImages(doc);

  var first = pickLang();
  (first === 'ko' ? Promise.resolve(applyStatic()).then(renderDynamic) : setLang(first)).then(function () {
    return wait(reduce ? 0 : 520);
  }).then(function () {
    state.gridReady = true;
    renderGrid(false);
    onScroll();
  });
})();
