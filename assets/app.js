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
  var TENDS = window.TENDS || ['study', 'act', 'exp', 'career'];
  var TEND_KEY = window.TEND_KEY || { study: 's', act: 'a', exp: 'e', career: 'c' };
  var NEEDS = window.NEEDS || [];
  var LANGS = window.LANGS || [['ko', '한국어']];
  var LANG_CODES = LANGS.map(function (l) { return l[0]; });
  var IMG = 'assets/img/';
  var GROUPS = ['cat', 'tend', 'age', 'with', 'len', 'region'];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };

  var state = {
    lang: 'ko',
    f: { cat: new Set(), tend: new Set(), age: new Set(), with: new Set(), len: new Set(), region: new Set() },
    sort: 'rec',
    compare: [],
    quick: null,
    gridReady: false
  };

  var ICON_X = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.5"/></svg>';
  var ICON_X_SM = '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M3 3l6 6M9 3 3 9" stroke="currentColor" stroke-width="1.4"/></svg>';
  var ICON_ADD = '<svg class="i-plus" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5"/></svg><svg class="i-check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

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
  function label(g, v) {
    if (g === 'tend') return t('tend.type.' + v);
    return t({ cat: 'cat.', age: 'age.', with: 'with.', len: 'len.', region: 'region.' }[g] + v);
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function wons(n) { return new Array(n + 1).join('₩'); }

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

  var LATIN = 'Noto+Sans:wght@400;500;700&family=Noto+Serif:wght@600;700';
  var FONT_FAMILIES = {
    ja: 'Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@600;700',
    zh: 'Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600;700',
    th: 'Noto+Sans+Thai:wght@400;500;700&family=Noto+Serif+Thai:wght@600;700',
    en: LATIN, vi: LATIN, id: LATIN, es: LATIN, fr: LATIN, de: LATIN, it: LATIN, pt: LATIN
  };
  var fontsLoaded = {};
  function ensureFonts(lang) {
    var q = FONT_FAMILIES[lang];
    if (!q || fontsLoaded[q]) return;
    fontsLoaded[q] = true;
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
    WorldMap.relabel();
    Diag.rerender();
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

  /* ---------- Camp focus profile ---------- */
  function tv(c, k) { return c.tend[TEND_KEY[k]]; }
  function topTend(c) {
    var best = TENDS[0], bv = -1;
    TENDS.forEach(function (k) { if (tv(c, k) > bv) { bv = tv(c, k); best = k; } });
    return best;
  }
  function tendHTML(c, lg) {
    var top = topTend(c);
    var aria = t('tend.label') + ': ' + TENDS.map(function (k) { return t('tend.' + k) + ' ' + tv(c, k); }).join(', ');
    return '<div class="tend' + (lg ? ' tend--lg' : '') + '" role="img" aria-label="' + esc(aria) + '">' +
      TENDS.map(function (k) {
        var v = tv(c, k);
        return '<div class="tend__row' + (k === top ? ' is-top' : '') + '" aria-hidden="true"><span class="tend__lab"><b>' + esc(t('tend.' + k)) + '</b><span>' + v + '</span></span>' +
          '<span class="tend__bar"><i style="width:' + v + '%"></i></span></div>';
      }).join('') + '</div>';
  }

  /* ---------- Camp Lab ---------- */
  function lenBucket(w) { return w <= 1 ? '1' : w === 2 ? '2' : w <= 4 ? '3' : '5'; }
  function hasAny(arr, set) { for (var i = 0; i < arr.length; i++) if (set.has(arr[i])) return true; return false; }
  function match(c) {
    var f = state.f;
    if (f.cat.size && !hasAny(c.cats, f.cat)) return false;
    if (f.tend.size && !f.tend.has(topTend(c))) return false;
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
      study: function (a, b) { return b.tend.s - a.tend.s || idx(a) - idx(b); },
      act: function (a, b) { return b.tend.a - a.tend.a || idx(a) - idx(b); },
      career: function (a, b) { return b.tend.c - a.tend.c || idx(a) - idx(b); }
    };
    return arr.slice().sort(fns[state.sort] || fns.rec);
  }
  function cardHTML(c) {
    var on = state.compare.indexOf(c.id) > -1;
    var title = ct(c.id, 't');
    return '<article class="card" data-id="' + c.id + '" style="view-transition-name:card-' + c.id + '">' +
      '<button class="card__media" type="button" data-detail="' + c.id + '" aria-label="' + esc(title + ' · ' + t('card.more')) + '">' +
        '<span class="frame is-loading"><img src="' + IMG + c.img + '" alt="" loading="lazy" width="1536" height="' + (c.tall ? 2304 : 1024) + '"></span>' +
        '<span class="card__tags"><span class="card__tag glass">' + esc(t('example')) + '</span><span class="card__type">' + esc(t('tend.type.' + topTend(c))) + '</span></span>' +
      '</button>' +
      '<div class="card__body">' +
        '<p class="card__meta"><span>' + esc(ct(c.id, 'p')) + '</span><span>·</span><span>' + esc(t('card.weeks', { n: c.weeks })) + '</span><span>·</span><span>' + esc(t('with.' + c.with)) + '</span></p>' +
        '<h3 class="card__title"><button type="button" data-detail="' + c.id + '">' + esc(title) + '</button></h3>' +
        '<p class="card__desc">' + esc(ct(c.id, 'd')) + '</p>' +
        tendHTML(c) +
        '<div class="card__foot">' +
          '<p class="card__cost"><b aria-hidden="true">' + wons(c.cost) + '</b>' + esc(t('cost.' + c.cost)) + '</p>' +
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
      '<div class="sk sk-line" style="width:42%"></div><div class="sk sk-title"></div><div class="sk sk-line"></div><div class="sk sk-line" style="width:72%"></div><div class="sk sk-line" style="width:100%;height:5px;margin-top:6px"></div></div></div>';
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
    ['tend', 'age', 'with', 'len', 'region'].forEach(function (g) {
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
    $('#sortSel').innerHTML = ['rec', 'short', 'cost', 'study', 'act', 'career'].map(function (k) {
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
    var top = grid.getBoundingClientRect().top + window.scrollY - ($('#filterbar').offsetHeight + 110);
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
    var titles = { cat: 'f.cat', tend: 'f.tend', age: 'f.age', with: 'f.with', len: 'f.len', region: 'f.region' };
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
      ['spec.cost', function (c) { return esc(wons(c.cost) + ' · ' + t('cost.' + c.cost)); }],
      ['spec.care', function (c) { return esc(ct(c.id, 'c')); }],
      ['tend.label', function (c) { return '<p style="font-weight:700;margin-bottom:6px">' + esc(t('tend.type.' + topTend(c))) + '</p>' + tendHTML(c); }],
      ['compare.summary', function (c) { return esc(ct(c.id, 'd')); }]
    ];
    var m = $('#compareModal');
    m.innerHTML = '<button class="modal__close glass" type="button" data-close aria-label="' + esc(t('modal.close')) + '">' + ICON_X + '</button>' +
      '<div class="cmp"><header class="cmp__head"><p>' + esc(t('compare.tray')) + ' · ' + cs.length + '/3</p>' +
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
      ['spec.cost', wons(c.cost) + ' · ' + t('cost.' + c.cost)]
    ];
    var m = $('#campModal');
    m.innerHTML = '<button class="modal__close glass" type="button" data-close aria-label="' + esc(t('modal.close')) + '">' + ICON_X + '</button>' +
      '<div class="modal__grid">' +
        '<figure class="modal__media"><span class="frame is-loading"><img src="' + IMG + c.img + '" alt="' + esc(ct(id, 't')) + '"></span>' +
          '<figcaption class="cap"><span class="cap__no">' + esc(t('example')) + '</span> ' + esc(ct(id, 'p')) + ' <span class="cap__credit">' + esc(t('credit.staged')) + '</span></figcaption></figure>' +
        '<div class="modal__body">' +
          '<p class="modal__kicker"><span class="card__type">' + esc(t('tend.type.' + topTend(c))) + '</span><span>' + c.cats.map(function (k) { return esc(t('cat.' + k)); }).join(' · ') + '</span><span>· ' + esc(t('example')) + '</span></p>' +
          '<h2 class="modal__title display" id="campModalTitle">' + esc(ct(id, 't')) + '</h2>' +
          '<p class="modal__desc">' + esc(ct(id, 'd')) + '</p>' +
          '<div><p class="modal__tendT">' + esc(t('tend.label')) + '</p>' + tendHTML(c, true) + '</div>' +
          '<dl class="specs">' + specs.map(function (s) { return '<div><dt>' + esc(t(s[0])) + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('') + '</dl>' +
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

  /* ---------- Globe (Korea ↔ World, both directions at once) ---------- */
  var WorldMap = (function () {
    var LAND = window.GLOBE_LAND, PLACES = window.GLOBE_PLACES || [], HUB = window.MAP_HUB;
    var wrapEl = $('#globe');
    if (!LAND || !wrapEl || !HUB) return { relabel: function () {}, init: function () {} };
    var stage = $('#globeStage'), canvas = $('#globeCanvas'), pinsEl = $('#globePins'), tip = $('#mapTip');
    var ctx = canvas.getContext('2d');
    var RAD = Math.PI / 180, TAU = Math.PI * 2;
    var LX = -0.34, LY = 0.42, LZ = 0.84;
    (function () { var m = Math.sqrt(LX * LX + LY * LY + LZ * LZ); LX /= m; LY /= m; LZ /= m; })();
    function ll(lon, lat) { return { x: Math.cos(lat * RAD) * Math.sin(lon * RAD), y: Math.sin(lat * RAD), z: Math.cos(lat * RAD) * Math.cos(lon * RAD) }; }
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

    var dots = [];
    LAND.forEach(function (row) {
      var step = 360 / row[1];
      row[2].forEach(function (seg) {
        for (var i = seg[0]; i < seg[0] + seg[1]; i++) {
          var v = ll(-180 + (i + 0.5) * step, row[0]);
          v.j = (dots.length * 0.618034) % 1;
          dots.push(v);
        }
      });
    });
    var ocean = [];
    for (var la = -66; la <= 80; la += 5.5) {
      var cn = Math.max(6, Math.round(360 * Math.cos(la * RAD) / 5.5));
      for (var oi = 0; oi < cn; oi++) ocean.push(ll(-180 + (oi + 0.5) * 360 / cn, la));
    }
    var SEOUL = ll(HUB.lon, HUB.lat);
    function slerp(a, b, t) {
      var d = clamp(a.x * b.x + a.y * b.y + a.z * b.z, -1, 1), th = Math.acos(d), sn = Math.sin(th);
      if (sn < 1e-5) return { x: a.x, y: a.y, z: a.z };
      var w1 = Math.sin((1 - t) * th) / sn, w2 = Math.sin(t * th) / sn;
      return { x: a.x * w1 + b.x * w2, y: a.y * w1 + b.y * w2, z: a.z * w1 + b.z * w2 };
    }
    function arcPts(a, b) {
      var ang = Math.acos(clamp(a.x * b.x + a.y * b.y + a.z * b.z, -1, 1));
      var lift = 0.05 + 0.2 * ang / Math.PI, pts = [];
      for (var i = 0; i <= 64; i++) {
        var t = i / 64, q = slerp(a, b, t), l = 1 + Math.sin(t * Math.PI) * lift;
        pts.push({ x: q.x * l, y: q.y * l, z: q.z * l });
      }
      return pts;
    }
    var routes = [];
    PLACES.forEach(function (p, idx) {
      p.v = ll(p.lon, p.lat);
      p.out = !!(p.camps && p.camps.length);
      p.inn = !!(p.langs && p.langs.length);
      routes.push({ id: p.id, pts: arcPts(SEOUL, p.v), out: p.out, inn: p.inn, off: idx * 0.137, sp: 0.16 + (idx % 4) * 0.018 });
      (p.from || []).forEach(function (f, k) {
        routes.push({ id: p.id, pts: arcPts(SEOUL, ll(f[0], f[1])), out: false, inn: true, off: idx * 0.137 + k * 0.21, sp: 0.15 + k * 0.02 });
      });
    });

    var size = 0, dpr = 1, raf = 0, visible = true, playing = !reduce, hold = false;
    var yaw = -142 * RAD, tilt = 24 * RAD, yawV = 0, tiltV = 0, hovX = 0, hovY = 0, hovTX = 0, hovTY = 0;
    var dragging = false, lastX = 0, lastY = 0, downX = 0, downY = 0, downT = 0, lastInput = -1e9;
    var activeId = null, ripples = [], pins = [], hubEl = null;
    var tPrev = performance.now(), clock = 0;
    var ct = Math.cos(tilt), st = Math.sin(tilt), cyw = Math.cos(yaw), syw = Math.sin(yaw);
    var R = 1, CX = 0, CY = 0;

    function proj(p) {
      var x = p.x * cyw + p.z * syw, z = -p.x * syw + p.z * cyw, y = p.y;
      var y2 = y * ct - z * st, z2 = y * st + z * ct;
      return { sx: CX + x * R, sy: CY - y2 * R, x: x, y: y2, z: z2 };
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = stage.clientWidth;
      if (!size) return;
      canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr);
      R = size * 0.4; CX = size / 2; CY = size * 0.475;
      draw();
    }

    function draw() {
      if (!size) return;
      var tiltNow = clamp(tilt + hovY, 0, 0.9), yawNow = yaw + hovX;
      ct = Math.cos(tiltNow); st = Math.sin(tiltNow); cyw = Math.cos(yawNow); syw = Math.sin(yawNow);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      var i, p, a, s, g;

      /* ground shadow */
      g = ctx.createRadialGradient(CX, CY + R * 1.1, 0, CX, CY + R * 1.1, R * 0.9);
      g.addColorStop(0, 'rgba(21,21,21,0.26)'); g.addColorStop(1, 'rgba(21,21,21,0)');
      ctx.fillStyle = g;
      ctx.save(); ctx.translate(CX, CY + R * 1.1); ctx.scale(1, 0.16); ctx.translate(-CX, -(CY + R * 1.1));
      ctx.beginPath(); ctx.arc(CX, CY + R * 1.1, R * 0.9, 0, TAU); ctx.fill(); ctx.restore();

      /* halo */
      g = ctx.createRadialGradient(CX, CY, R * 0.96, CX, CY, R * 1.16);
      g.addColorStop(0, 'rgba(255,248,214,0.55)'); g.addColorStop(1, 'rgba(255,248,214,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, R * 1.16, 0, TAU); ctx.fill();

      /* sphere body, lit from the upper left */
      g = ctx.createRadialGradient(CX + LX * R * 0.5, CY - LY * R * 0.5, R * 0.08, CX, CY, R);
      g.addColorStop(0, '#45413A'); g.addColorStop(0.55, '#242320'); g.addColorStop(1, '#101010');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, R, 0, TAU); ctx.fill();

      /* graticule */
      ctx.strokeStyle = 'rgba(246,243,234,0.06)'; ctx.lineWidth = 1;
      for (var gl = -60; gl <= 60; gl += 30) {
        ctx.beginPath(); var on = false;
        for (var lo = -180; lo <= 180; lo += 5) {
          p = proj(ll(lo, gl));
          if (p.z > 0) { if (!on) { ctx.moveTo(p.sx, p.sy); on = true; } else ctx.lineTo(p.sx, p.sy); } else on = false;
        }
        ctx.stroke();
      }

      /* ocean texture */
      for (i = 0; i < ocean.length; i++) {
        p = proj(ocean[i]);
        if (p.z <= 0.03) continue;
        a = 0.03 + 0.08 * Math.max(0, p.x * LX + p.y * LY + p.z * LZ);
        ctx.fillStyle = 'rgba(246,243,234,' + a.toFixed(3) + ')';
        ctx.fillRect(p.sx - 0.6, p.sy - 0.6, 1.2, 1.2);
      }

      /* land dots: Lambert light + twinkle */
      for (i = 0; i < dots.length; i++) {
        var d = dots[i];
        p = proj(d);
        if (p.z <= 0.03) continue;
        var lam = Math.max(0, p.x * LX + p.y * LY + p.z * LZ);
        var tw = playing ? 0.86 + 0.28 * Math.sin(clock * 1.6 + d.j * TAU) : 1;
        a = (0.42 + 0.58 * lam) * tw;
        s = (1.4 + 1.3 * lam + 0.6 * p.z) * (size / 560);
        ctx.fillStyle = (d.j < 0.24 ? 'rgba(255,216,77,' : 'rgba(242,194,48,') + a.toFixed(3) + ')';
        ctx.fillRect(p.sx - s / 2, p.sy - s / 2, s, s);
      }

      /* specular */
      ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, R, 0, TAU); ctx.clip();
      g = ctx.createRadialGradient(CX + LX * R * 0.6, CY - LY * R * 0.6, 0, CX + LX * R * 0.6, CY - LY * R * 0.6, R * 0.55);
      g.addColorStop(0, 'rgba(255,248,214,0.12)'); g.addColorStop(1, 'rgba(255,248,214,0)');
      ctx.fillStyle = g; ctx.fillRect(CX - R, CY - R, R * 2, R * 2);
      ctx.restore();

      /* routes: yellow = Korea → World, white = World → Korea; both run at once */
      routes.forEach(function (rt) {
        var hl = activeId === rt.id, dim = activeId && !hl;
        ctx.beginPath(); var on = false;
        for (var k = 0; k < rt.pts.length; k++) {
          p = proj(rt.pts[k]);
          if (p.z > 0.02) { if (!on) { ctx.moveTo(p.sx, p.sy); on = true; } else ctx.lineTo(p.sx, p.sy); } else on = false;
        }
        var col = rt.out ? '255,216,77' : '246,243,234';
        ctx.strokeStyle = 'rgba(' + col + ',' + (hl ? 1 : dim ? 0.14 : 0.5) + ')';
        ctx.lineWidth = hl ? 2.2 : 1.1;
        ctx.stroke();
        if (!playing) return;
        if (rt.out) pulse(rt, (clock * rt.sp + rt.off) % 1, false, '255,216,77', dim);
        if (rt.inn) pulse(rt, (clock * rt.sp + rt.off + 0.5) % 1, true, '255,255,255', dim);
      });

      /* Seoul */
      p = proj(SEOUL);
      if (p.z > 0) {
        var ph = playing ? (clock * 0.8) % 1 : 0.3;
        ctx.strokeStyle = 'rgba(255,216,77,' + ((1 - ph) * 0.9).toFixed(3) + ')'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 4 + ph * 18, 0, TAU); ctx.stroke();
        ctx.fillStyle = '#FFD84D'; ctx.beginPath(); ctx.arc(p.sx, p.sy, 4.5, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#151515'; ctx.lineWidth = 1.5; ctx.stroke();
      }

      /* click ripples */
      for (i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i];
        p = proj(rp.v);
        if (p.z <= 0 || rp.t >= 1) continue;
        ctx.strokeStyle = 'rgba(255,216,77,' + ((1 - rp.t) * 0.9).toFixed(3) + ')'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 3 + rp.t * 30, 0, TAU); ctx.stroke();
      }

      placePins();
    }
    function pulse(rt, t, reverse, col, dim) {
      var n = rt.pts.length - 1;
      for (var q = 6; q >= 0; q--) {
        var tq = t - q * 0.012;
        if (tq < 0) continue;
        var p = proj(rt.pts[Math.round((reverse ? 1 - tq : tq) * n)]);
        if (p.z <= 0.02) continue;
        ctx.fillStyle = 'rgba(' + col + ',' + ((q === 0 ? 1 : 0.55 - q * 0.07) * (dim ? 0.3 : 1)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.sx, p.sy, q === 0 ? 2.8 : 1.9, 0, TAU); ctx.fill();
      }
      if (t > 0.9 && !dim) {
        var end = proj(rt.pts[reverse ? 0 : n]);
        if (end.z > 0.02) {
          var r = (t - 0.9) / 0.1;
          ctx.strokeStyle = 'rgba(' + col + ',' + ((1 - r) * 0.8).toFixed(3) + ')'; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.arc(end.sx, end.sy, 3 + r * 13, 0, TAU); ctx.stroke();
        }
      }
    }

    function langName(code) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i][0] === code) return LANGS[i][1]; return code; }
    function renderPins() {
      pinsEl.innerHTML = PLACES.map(function (p) {
        var kind = p.out && p.inn ? 'both' : p.out ? 'out' : 'in';
        var name = t('place.' + p.id);
        var aria = name + (p.out ? ' · ' + t('map.campsN', { n: p.camps.length }) : '') + (p.inn ? ' · ' + p.langs.map(langName).join(', ') : '');
        return '<button class="gpin gpin--' + kind + ' gpin--' + (p.side || 'r') + '" type="button" data-gpin="' + p.id + '" aria-label="' + esc(aria) + '">' +
          '<span class="gpin__dot" aria-hidden="true"></span><span class="gpin__label">' + esc(name) + '</span></button>';
      }).join('') + '<div class="ghub" aria-hidden="true"><span class="ghub__label">' + esc(t('map.seoul')) + '</span></div>';
      pins = $$('.gpin', pinsEl).map(function (el) {
        var id = el.getAttribute('data-gpin');
        return { el: el, p: PLACES.filter(function (x) { return x.id === id; })[0] };
      });
      hubEl = $('.ghub', pinsEl);
    }
    function placePins() {
      pins.forEach(function (o) {
        var q = proj(o.p.v);
        var back = q.z < 0.12;
        o.el.classList.toggle('is-back', back);
        if (back) return;
        o.el.style.opacity = clamp((q.z - 0.12) / 0.25, 0, 1).toFixed(2);
        o.el.style.transform = 'translate(' + q.sx.toFixed(1) + 'px,' + q.sy.toFixed(1) + 'px) ' +
          (o.p.side === 'l' ? 'translate(calc(-100% + 4.5px),-50%)' : 'translate(-4.5px,-50%)');
      });
      if (hubEl) {
        var h = proj(SEOUL);
        hubEl.style.opacity = h.z > 0.1 ? '1' : '0';
        hubEl.style.transform = 'translate(' + h.sx.toFixed(1) + 'px,' + h.sy.toFixed(1) + 'px)';
      }
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, (now - tPrev) / 1000);
      tPrev = now;
      if (playing) clock += dt;
      if (!dragging) {
        yaw += yawV; yawV *= 0.94;
        tilt = clamp(tilt + tiltV, 0, 0.75); tiltV *= 0.9;
        if (playing && !hold) {
          var sz = proj(SEOUL).z;
          var idle = now - lastInput > 2600 ? 1 : 0;
          /* turn slowly while Korea faces the viewer, faster while it is on the far side */
          yaw += dt * (0.065 + 0.3 * (1 - clamp(sz, 0, 1))) * idle;
          tilt += (24 * RAD - tilt) * 0.01 * idle;
        }
      }
      hovX += (hovTX - hovX) * 0.06;
      hovY += (hovTY - hovY) * 0.06;
      ripples.forEach(function (r) { r.t += dt * 1.3; });
      ripples = ripples.filter(function (r) { return r.t < 1; });
      draw();
      if (visible && !doc.hidden && (playing || dragging || Math.abs(yawV) > 1e-4 || Math.abs(hovX - hovTX) > 1e-4 || ripples.length)) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && visible && !doc.hidden) { tPrev = performance.now(); raf = requestAnimationFrame(frame); } }

    function closeTip() {
      tip.hidden = true;
      hold = false;
      pins.forEach(function (o) { o.el.classList.remove('is-active'); });
      activeId = null;
      kick();
    }
    function openTip(el) {
      var p = PLACES.filter(function (x) { return x.id === el.getAttribute('data-gpin'); })[0];
      if (!p) return;
      pins.forEach(function (o) { o.el.classList.toggle('is-active', o.el === el); });
      activeId = p.id;
      hold = true;
      var html = '<button class="iconbtn maptip__x" type="button" data-tip-close aria-label="' + esc(t('nav.close')) + '">' + ICON_X_SM + '</button>' +
        '<p class="maptip__t">' + esc(t('place.' + p.id)) + '</p>';
      if (p.out) {
        html += '<p class="maptip__s">' + esc(t('map.out')) + ' · ' + esc(t('map.campsN', { n: p.camps.length })) + '</p><div class="maptip__list">' +
          p.camps.map(function (cid) { return '<button type="button" data-detail="' + cid + '">' + esc(ct(cid, 't')) + '</button>'; }).join('') + '</div>';
      }
      if (p.inn) {
        html += '<p class="maptip__s">' + esc(t('map.in')) + ' · ' + esc(t('map.langs')) + '</p><div class="maptip__langs">' +
          p.langs.map(function (code) { return '<button type="button" data-lang="' + code + '" lang="' + code + '">' + esc(langName(code)) + '</button>'; }).join('') + '</div>';
      }
      html += p.out ? '<button class="btn btn--ink btn--sm" type="button" data-map-region="' + p.region + '">' + esc(t('map.viewRegion')) + '</button>'
        : '<a class="btn btn--ink btn--sm" href="#korea" data-tip-close>' + esc(t('map.koreaCamps')) + '</a>';
      tip.innerHTML = html;
      tip.hidden = false;
      draw();
      var sr = stage.getBoundingClientRect(), dr = el.querySelector('.gpin__dot').getBoundingClientRect();
      var px = dr.left + dr.width / 2 - sr.left, py = dr.top + dr.height / 2 - sr.top;
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var left = px + 16;
      if (left + tw > sr.width - 4) left = px - tw - 16;
      left = clamp(left, 4, Math.max(4, sr.width - tw - 4));
      tip.style.left = left + 'px';
      tip.style.top = clamp(py - th / 2, 4, Math.max(4, sr.height - th - 4)) + 'px';
    }
    function relabel() {
      renderPins();
      var outN = PLACES.filter(function (p) { return p.out; }).length;
      $('#legendOut').textContent = t('map.outNote', { n: outN });
      $('#legendIn').textContent = t('map.inNote', { n: LANGS.length });
      $('#mapHint').textContent = t('map.dragGlobe') + ' ' + t('map.hintOut');
      $('#mapPlay').setAttribute('aria-label', t(playing ? 'map.pause' : 'map.play'));
      if (!tip.hidden) closeTip();
      draw();
    }
    function spawnRipple(clientX, clientY) {
      var r = stage.getBoundingClientRect();
      var x = (clientX - r.left - CX) / R, yy = -(clientY - r.top - CY) / R;
      var rr = x * x + yy * yy;
      if (rr > 1) return;
      var z2 = Math.sqrt(1 - rr);
      var y = yy * ct + z2 * st, z = -yy * st + z2 * ct;
      ripples.push({ v: { x: x * cyw - z * syw, y: y, z: x * syw + z * cyw }, t: 0 });
      if (ripples.length > 6) ripples.shift();
      kick();
    }

    function init() {
      relabel();
      stage.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.gpin') || e.target.closest('#mapTip')) return;
        dragging = true; lastX = downX = e.clientX; lastY = downY = e.clientY; downT = performance.now();
        yawV = 0; tiltV = 0; lastInput = performance.now();
        stage.classList.add('is-dragging');
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        if (!tip.hidden) closeTip();
        kick();
      });
      stage.addEventListener('pointermove', function (e) {
        if (!dragging && window.matchMedia('(hover: hover)').matches) {
          var r = stage.getBoundingClientRect();
          hovTX = ((e.clientX - r.left) / r.width - 0.5) * 0.18;
          hovTY = ((e.clientY - r.top) / r.height - 0.5) * 0.12;
          kick();
        }
        if (!dragging) return;
        var dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        yaw += dx * 0.006; yawV = dx * 0.006;
        tilt = clamp(tilt + dy * 0.004, 0, 0.75); tiltV = dy * 0.004;
        lastInput = performance.now();
      });
      function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        stage.classList.remove('is-dragging');
        lastInput = performance.now();
        if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) < 6 && performance.now() - downT < 400) spawnRipple(e.clientX, e.clientY);
        kick();
      }
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
      stage.addEventListener('pointerleave', function () { hovTX = 0; hovTY = 0; kick(); });
      pinsEl.addEventListener('click', function (e) {
        var el = e.target.closest('.gpin');
        if (!el) return;
        if (el.classList.contains('is-active') && !tip.hidden) closeTip(); else openTip(el);
      });
      pinsEl.addEventListener('pointerover', function (e) {
        var el = e.target.closest('.gpin');
        if (el && tip.hidden) { activeId = el.getAttribute('data-gpin'); if (!playing) draw(); }
      });
      pinsEl.addEventListener('pointerout', function (e) {
        var el = e.target.closest('.gpin');
        if (el && tip.hidden) { activeId = null; if (!playing) draw(); }
      });
      tip.addEventListener('click', function (e) { if (e.target.closest('[data-tip-close]')) closeTip(); });
      doc.addEventListener('click', function (e) {
        if (!tip.hidden && !e.target.closest('#mapTip') && !e.target.closest('.gpin')) closeTip();
      });
      doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !tip.hidden) closeTip(); });
      $('#mapPlay').addEventListener('click', function (e) {
        playing = !playing;
        e.currentTarget.setAttribute('aria-pressed', String(!playing));
        e.currentTarget.setAttribute('aria-label', t(playing ? 'map.pause' : 'map.play'));
        draw(); kick();
      });
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
      else window.addEventListener('resize', resize);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { threshold: 0.05 }).observe(stage);
      }
      doc.addEventListener('visibilitychange', kick);
      resize();
      kick();
    }
    return { init: init, relabel: relabel };
  })();

  /* ---------- Camp check (diagnostic) ---------- */
  var Diag = (function () {
    var intro = $('#diagIntro'), run = $('#diagRun'), result = $('#diagResult');
    var qEl = $('#diagQ'), countEl = $('#diagCount'), bar = $('#diagBar');
    var btnPrev = $('#diagPrev'), btnNext = $('#diagNext'), btnSkip = $('#diagSkip');
    var step = 0, phase = 'intro', last = null;
    var a = fresh();
    function fresh() { return { age: null, with: null, dirs: [], needs: [], regions: [], len: null, budget: null }; }
    function opts(arr, prefix) { return arr.map(function (v) { return { v: v, t: prefix + v }; }); }
    var STEPS = [
      { title: 'q1.t', type: 'single', key: 'age', required: true, auto: true, options: opts(FILTERS.age, 'age.') },
      { title: 'q2.t', type: 'single', key: 'with', required: true, auto: true, wide: true,
        options: [{ v: 'parent', t: 'q2.parent' }, { v: 'solo', t: 'q2.solo' }, { v: 'any', t: 'q2.any' }] },
      { title: 'q3.t', type: 'multi', key: 'dirs', required: true, max: 2, wide: true,
        options: TENDS.map(function (v) { return { v: v, t: 'tend.' + v, d: 'q3.' + v }; }) },
      { title: 'q4.t', type: 'multi', key: 'needs', chips: true, options: opts(NEEDS, 'need.') },
      { title: 'q5.t', type: 'multi', key: 'regions', chips: true,
        options: opts(FILTERS.region, 'region.').concat([{ v: 'any', t: 'q5.any', exclusive: true }]) },
      { title: 'q6.t', type: 'groups', groups: [
        { key: 'len', label: 'q6.len', options: opts(FILTERS.len, 'len.').concat([{ v: 'any', t: 'q6.any' }]) },
        { key: 'budget', label: 'q6.budget', options: [{ v: '1', t: 'cost.1' }, { v: '2', t: 'cost.2' }, { v: '3', t: 'cost.3' }, { v: 'any', t: 'q6.any' }] }
      ] }
    ];
    function show(which) {
      phase = which;
      intro.hidden = which !== 'intro';
      run.hidden = which !== 'run';
      result.hidden = which !== 'result';
    }
    function isOn(key, v) { var val = a[key]; return Array.isArray(val) ? val.indexOf(v) > -1 : val === v; }
    function optBtn(key, o, chips) {
      return '<button class="opt" type="button" data-opt="' + key + ':' + o.v + '" aria-pressed="' + isOn(key, o.v) + '">' +
        '<span class="opt__t">' + esc(t(o.t)) + '</span>' + (o.d && !chips ? '<span class="opt__d">' + esc(t(o.d)) + '</span>' : '') + '</button>';
    }
    function renderStep(focus) {
      var s = STEPS[step];
      countEl.textContent = t('diag.step', { n: step + 1, t: STEPS.length });
      bar.style.width = ((step + 1) / STEPS.length * 100) + '%';
      var hint = s.type === 'multi' ? (s.max ? t('diag.upTo', { n: s.max }) : t('diag.multi')) : '';
      var body;
      if (s.type === 'groups') {
        body = s.groups.map(function (g) {
          return '<div class="diag__group"><p class="diag__glabel">' + esc(t(g.label)) + '</p><div class="opts opts--chips">' +
            g.options.map(function (o) { return optBtn(g.key, o, true); }).join('') + '</div></div>';
        }).join('');
      } else {
        body = '<div class="opts' + (s.chips ? ' opts--chips' : s.wide ? ' opts--wide' : '') + '">' + s.options.map(function (o) { return optBtn(s.key, o, s.chips); }).join('') + '</div>';
      }
      qEl.innerHTML = '<h4 class="diag__qt" id="diagQt" tabindex="-1">' + esc(t(s.title)) + '</h4>' +
        (hint ? '<p class="diag__hint">' + esc(hint) + '</p>' : '<p class="diag__hint">&nbsp;</p>') + body +
        '<p class="diag__err" id="diagErr" hidden>' + esc(t('diag.required')) + '</p>';
      qEl.style.animation = 'none'; void qEl.offsetWidth; qEl.style.animation = '';
      btnPrev.hidden = step === 0;
      btnSkip.hidden = !!s.required;
      btnNext.textContent = step === STEPS.length - 1 ? t('diag.result') : t('diag.next');
      if (focus) { var h = $('#diagQt'); if (h) h.focus({ preventScroll: true }); }
    }
    function valid() {
      var s = STEPS[step];
      if (!s.required) return true;
      var v = a[s.key];
      return Array.isArray(v) ? v.length > 0 : v != null;
    }
    function next() {
      if (!valid()) { $('#diagErr').hidden = false; return; }
      if (step < STEPS.length - 1) { step++; renderStep(true); }
      else compute();
    }
    function start() {
      a = fresh(); step = 0;
      show('run');
      renderStep(true);
    }
    qEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-opt]');
      if (!b) return;
      var p = b.getAttribute('data-opt').split(':'), key = p[0], v = p[1];
      var s = STEPS[step];
      var o = (s.options || []).filter(function (x) { return x.v === v; })[0] || {};
      if (Array.isArray(a[key])) {
        var arr = a[key], i = arr.indexOf(v);
        if (i > -1) arr.splice(i, 1);
        else {
          if (o.exclusive) arr.length = 0;
          else { var ex = arr.indexOf('any'); if (ex > -1) arr.splice(ex, 1); }
          if (s.max && arr.length >= s.max) arr.shift();
          arr.push(v);
        }
      } else {
        a[key] = a[key] === v && !s.auto ? null : v;
      }
      $$('[data-opt]', qEl).forEach(function (x) {
        var q = x.getAttribute('data-opt').split(':');
        x.setAttribute('aria-pressed', String(isOn(q[0], q[1])));
      });
      var err = $('#diagErr'); if (err) err.hidden = true;
      if (s.auto && a[key] != null) setTimeout(function () { if (phase === 'run' && STEPS[step] === s) next(); }, reduce ? 0 : 260);
    });
    btnNext.addEventListener('click', next);
    btnPrev.addEventListener('click', function () { if (step > 0) { step--; renderStep(true); } });
    btnSkip.addEventListener('click', function () { if (step < STEPS.length - 1) { step++; renderStep(true); } else compute(); });
    $('#diagStart').addEventListener('click', start);
    $('#diagClose').addEventListener('click', function () { show('intro'); $('#diagStart').focus(); });

    function scoreCamp(c) {
      var s = 0, max = 0, why = [], warn = false;
      max += 30;
      if (c.ages.indexOf(a.age) > -1) { s += 30; why.push({ w: 30, txt: t('r.age', { v: t('age.' + a.age) }) }); }
      else { s -= 40; warn = true; }
      if (a.with && a.with !== 'any') {
        max += 15;
        if (c.with === a.with) { s += 15; why.push({ w: 15, txt: t('with.' + c.with) }); } else s -= 20;
      }
      a.dirs.forEach(function (d) {
        max += 45;
        var v = tv(c, d);
        s += v * 0.45;
        if (v >= 55) why.push({ w: v * 0.45, txt: t('r.tend', { v: t('tend.' + d), n: v }) });
      });
      if (a.needs.length) {
        var hits = a.needs.filter(function (n) { return c.needs.indexOf(n) > -1; });
        max += 12 * Math.min(a.needs.length, 3);
        s += 12 * Math.min(hits.length, 3);
        hits.forEach(function (n) { why.push({ w: 12, txt: t('need.' + n) }); });
      }
      var regs = a.regions.filter(function (r) { return r !== 'any'; });
      if (regs.length) {
        max += 20;
        if (regs.indexOf(c.region) > -1) { s += 20; why.push({ w: 20, txt: t('region.' + c.region) }); } else s -= 15;
      }
      if (a.len && a.len !== 'any') {
        max += 10;
        if (lenBucket(c.weeks) === a.len) { s += 10; why.push({ w: 10, txt: t('r.len', { v: t('len.' + a.len) }) }); } else s -= 4;
      }
      if (a.budget && a.budget !== 'any') {
        max += 10;
        if (c.cost <= +a.budget) { s += 10; why.push({ w: 9, txt: t('r.budget') }); } else s -= 15;
      }
      why.sort(function (x, y) { return y.w - x.w; });
      return { c: c, s: s, pct: Math.max(0, Math.min(99, Math.round(s / max * 100))), why: why.slice(0, 4), warn: warn };
    }
    function answerChips() {
      var out = [];
      if (a.age) out.push(t('age.' + a.age));
      if (a.with) out.push(a.with === 'any' ? t('q2.any') : t('with.' + a.with));
      a.dirs.forEach(function (d) { out.push(t('tend.' + d)); });
      a.needs.forEach(function (n) { out.push(t('need.' + n)); });
      a.regions.forEach(function (r) { out.push(r === 'any' ? t('q5.any') : t('region.' + r)); });
      if (a.len && a.len !== 'any') out.push(t('len.' + a.len));
      if (a.budget && a.budget !== 'any') out.push(t('cost.' + a.budget));
      return out;
    }
    function compute() {
      var scored = CAMPS.map(scoreCamp).sort(function (x, y) { return (x.warn - y.warn) || (y.s - x.s); });
      last = { top: scored.slice(0, 3), answers: answerChips() };
      show('result');
      result.classList.add('res--sk');
      result.innerHTML = '<div class="res__head"><div class="sk" style="height:26px;width:40%"></div><div class="sk" style="height:14px;width:70%"></div></div>' +
        '<div class="res__grid">' + [0, 1, 2].map(function () {
          return '<div class="rcard" style="background:#1F1E1B"><div class="sk" style="aspect-ratio:16/10;border-radius:0"></div><div class="rcard__body"><div class="sk" style="height:12px;width:50%"></div><div class="sk" style="height:18px;width:85%"></div><div class="sk" style="height:12px"></div><div class="sk" style="height:12px;width:60%"></div></div></div>';
        }).join('') + '</div>';
      wait(reduce ? 0 : 650).then(function () { result.classList.remove('res--sk'); renderResult(true); });
    }
    function renderResult(focus) {
      if (!last) return;
      last.answers = answerChips();
      result.innerHTML = '<div class="res__head"><p class="kicker kicker--y">' + esc(t('diag.kicker')) + '</p>' +
        '<h3 class="res__title" id="resTitle" tabindex="-1">' + esc(t('res.title')) + '</h3><p class="res__deck">' + esc(t('res.deck')) + '</p>' +
        '<div class="res__answers"><span>' + esc(t('res.answers')) + '</span>' + last.answers.map(function (x) { return '<span class="res__chip">' + esc(x) + '</span>'; }).join('') + '</div></div>' +
        '<div class="res__grid">' + last.top.map(function (r, i) {
          var c = r.c, on = state.compare.indexOf(c.id) > -1;
          return '<article class="rcard"><div class="rcard__media"><span class="frame is-loading"><img src="' + IMG + c.img + '" alt="" loading="lazy"></span>' +
            '<span class="rcard__rank">' + (i + 1) + '</span><span class="rcard__match">' + esc(t('res.match', { n: r.pct })) + '</span></div>' +
            '<div class="rcard__body"><p class="rcard__meta">' + esc(ct(c.id, 'p')) + ' · ' + esc(t('card.weeks', { n: c.weeks })) + ' · ' + esc(t('tend.type.' + topTend(c))) + '</p>' +
            '<h4 class="rcard__t">' + esc(ct(c.id, 't')) + '</h4>' + tendHTML(c) +
            '<div class="rcard__why" aria-label="' + esc(t('res.why')) + '">' + (r.warn ? '<span class="is-warn">' + esc(t('res.outside')) + '</span>' : '') +
              r.why.map(function (w) { return '<span>' + esc(w.txt) + '</span>'; }).join('') + '</div>' +
            '<div class="rcard__actions"><button class="btn btn--ink btn--sm" type="button" data-detail="' + c.id + '">' + esc(t('card.more')) + '</button>' +
            '<button class="addbtn" type="button" data-compare="' + c.id + '" aria-pressed="' + on + '" aria-label="' + esc((on ? t('card.added') : t('card.add')) + ': ' + ct(c.id, 't')) + '">' + ICON_ADD + '</button></div></div></article>';
        }).join('') + '</div>' +
        '<div class="res__actions"><button class="btn btn--yellow" type="button" id="resCta">' + esc(t('res.cta')) + '</button>' +
        '<button class="btn btn--ghost-inv" type="button" id="resList">' + esc(t('res.toList')) + '</button>' +
        '<button class="linkbtn linkbtn--inv" type="button" id="resAgain">' + esc(t('res.again')) + '</button></div>' +
        '<p class="res__note">' + esc(t('res.note')) + '</p>';
      wireImages(result);
      if (focus) { var h = $('#resTitle'); if (h) h.focus({ preventScroll: true }); }
    }
    result.addEventListener('click', function (e) {
      if (e.target.closest('#resAgain')) { start(); return; }
      if (e.target.closest('#resCta')) {
        openInquiry({
          interest: last.top.map(function (r) { return ct(r.c.id, 't'); }).join(' / '),
          msg: t('res.answers') + ': ' + last.answers.join(', '),
          role: a.age === 'u' ? 'student' : 'parent'
        }, e.target.closest('button'));
        return;
      }
      if (e.target.closest('#resList')) {
        clearFilters();
        if (a.age) state.f.age.add(a.age);
        if (a.with && a.with !== 'any') state.f.with.add(a.with);
        a.regions.forEach(function (r) { if (r !== 'any') state.f.region.add(r); });
        filtersChanged(true);
        scrollToGrid();
      }
    });
    function rerender() {
      if (phase === 'run') renderStep(false);
      else if (phase === 'result') renderResult(false);
    }
    function startFromHero() {
      var d = $('#diag');
      var top = d.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      if (phase !== 'run') setTimeout(start, reduce ? 0 : 450);
    }
    return { rerender: rerender, start: start, startFromHero: startFromHero };
  })();

  /* ---------- Journal ---------- */
  var articleDrawer = $('#articleDrawer');
  function openArticle(id, trigger) {
    var art = ARTICLES.filter(function (x) { return x.id === id; })[0];
    if (!art) return;
    var next = ARTICLES[(ARTICLES.indexOf(art) + 1) % ARTICLES.length];
    articleDrawer.setAttribute('aria-label', t('journal.loading'));
    articleDrawer.innerHTML = '<div class="drawer__head"><span>' + esc(t('journal.kicker')) + '</span>' +
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
        '<figure><span class="frame frame--3x2 is-loading"><img src="' + IMG + art.img + '" alt=""></span>' +
        '<figcaption class="cap"><span class="cap__credit cap__credit--solo">' + esc(t('credit.staged')) + '</span></figcaption></figure>' +
        '<p class="article__k">' + esc(t(id + '.k')) + '</p>' +
        '<h2 class="article__t display" id="articleTitle">' + esc(t(id + '.t')) + '</h2>' +
        '<p class="article__d">' + esc(t(id + '.d')) + '</p>' +
        '<p class="article__meta">' + esc(t('journal.by')) + ' · ' + esc(t('journal.date')) + ' · ' + esc(t('journal.min', { n: art.min })) + '</p>' +
        '<div class="prose">' + (Array.isArray(paras) ? paras : []).map(function (p) { return '<p>' + p + '</p>'; }).join('') + '</div>' +
        '<div class="article__next"><p>' + esc(t('journal.next')) + '</p><button type="button" data-article="' + next.id + '">' + esc(t(next.id + '.t')) + '</button></div>' +
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
      if (opts.msg != null) $('#f-msg').value = opts.msg;
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
    if ((el = e.target.closest('[data-start-diag]'))) { e.preventDefault(); Diag.startFromHero(); return; }
    if ((el = e.target.closest('[data-map-region]'))) {
      var reg = el.getAttribute('data-map-region');
      clearFilters();
      state.f.region.add(reg);
      filtersChanged(true);
      toast(t('toast.quick', { name: t('region.' + reg) }));
      setTimeout(scrollToGrid, 60);
      return;
    }
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
      copyText(el.getAttribute('data-copy'), el.parentNode.querySelector('.contact__v'));
      return;
    }
    if ((el = e.target.closest('[data-korea]'))) {
      openInquiry({ role: el.getAttribute('data-role') || 'student', interest: t('korea.' + el.getAttribute('data-korea') + '.t') }, el);
      return;
    }
    if ((el = e.target.closest('[data-open-inquiry]'))) {
      var o = { role: el.getAttribute('data-role') || null };
      if (el.hasAttribute('data-interest-text')) o.interest = el.getAttribute('data-interest-text');
      if (el.hasAttribute('data-interest-ids')) {
        o.interest = el.getAttribute('data-interest-ids').split(',').filter(byId).map(function (id) { return ct(id, 't'); }).join(' / ');
      }
      openInquiry(o, el);
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
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $('#koreaIndex').addEventListener('pointermove', function (e) {
      var row = e.target.closest('.index__row');
      if (!row) { hover.classList.remove('is-on'); return; }
      var src = IMG + row.getAttribute('data-img');
      if (hoverImg.getAttribute('src') !== src) hoverImg.setAttribute('src', src);
      hoverTag.textContent = row.hasAttribute('data-staged') ? t('credit.staged') : '';
      hover.style.setProperty('--hx', (e.clientX + 160) + 'px');
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
    var start = performance.now();
    (function frame(now) {
      var p = Math.min(1, (now - start) / 1400);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US') + suf;
      if (p < 1) requestAnimationFrame(frame);
    })(start);
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

  /* ---------- Scroll: progress, sticky filter bar, current nav ---------- */
  var progress = $('#progressBar');
  var filterbar = $('#filterbar');
  var labList = $('.lablist');
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
      filterbar.classList.toggle('is-stuck', r.top <= stickTop + 1 && labList.getBoundingClientRect().bottom > r.bottom + 40);
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
    WorldMap.init();
    return wait(reduce ? 0 : 520);
  }).then(function () {
    state.gridReady = true;
    renderGrid(false);
    onScroll();
  });
})();
