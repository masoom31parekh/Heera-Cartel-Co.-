/* ==========================================================
   Heera Cartel Co. — catalogue.html
   Needs catalogue-data.js, site-common.js, hc-filter.js first.
   ========================================================== */
(function () {
  'use strict';
  var PAGE = 24;
  var SHAPE_IMG = { round: 'assets/round.jpg', princess: 'assets/princess.jpg', emerald: 'assets/emerald.jpg',
                    oval: 'assets/oval.jpg', pear: 'assets/pear.jpg', radiant: 'assets/radiant.jpg', heart: 'assets/heart.jpg' };

  var f = HC.fromQuery(location.search);
  var sort = new URLSearchParams(location.search).get('sort') || 'ref';
  var shown = PAGE, lastType = null;

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function uniq(a) { return a.filter(function (v, i) { return v && a.indexOf(v) === i; }); }

  /* value lists come from the data, so new stones appear in the filters automatically */
  var SHAPES = CATALOGUE_META.shapes.map(function (s) { return [CATALOGUE_META.shapeSlug[s], s]; });
  var CERTS = uniq(HC.STONES.map(function (s) { return s.cert; })).sort();
  var CLARITIES = HC.CLARITY_ORDER.filter(function (c) { return HC.STONES.some(function (s) { return s.clarities.indexOf(c) > -1; }); });
  function coloursFor(type) {
    var pool = HC.STONES.filter(function (s) { return !type || s.type === type; });
    var have = uniq([].concat.apply([], pool.map(function (s) { return s.colours; })));
    var white = HC.WHITE_ORDER.filter(function (c) { return have.indexOf(c) > -1; });
    var fancy = HC.FANCY_ORDER.filter(function (c) { return have.indexOf(c) > -1; });
    return { white: white, fancy: fancy };
  }

  /* an <option> whose label shows how many stones it would give, disabled at zero */
  function optHtml(field, value, label, first) {
    var n = HC.count(HC.withField(f, field, value));
    var dis = value && n === 0 && f[field] !== value;
    return '<option value="' + esc(value) + '"' + (dis ? ' disabled' : '') + '>' + esc(label) + (value ? ' (' + n + ')' : '') + '</option>';
  }
  function fillSelect(id, field, anyLabel, items) {
    var s = el(id), h = '<option value="">' + anyLabel + '</option>';
    h += items(); s.innerHTML = h; s.value = f[field] || '';
  }
  function fancyLabel(c) { return (c === 'Black' || c === 'Champagne' || c === 'Cognac') ? c : 'Fancy ' + c; }

  function buildSelects() {
    fillSelect('fShape', 'shape', 'All shapes', function () {
      return SHAPES.map(function (p) { return optHtml('shape', p[0], p[1]); }).join('');
    });
    fillSelect('fCarat', 'carat', 'Any size', function () {
      var list = HC.CARAT_PRESETS.slice();
      if (f.carat && !list.some(function (p) { return p[1] === f.carat; })) list.push([HC.caratLabel(f.carat), f.carat]);   // custom range from a link
      return list.map(function (p) { return optHtml('carat', p[1], p[0]); }).join('');
    });
    var c = coloursFor(f.type);
    fillSelect('fColour', 'colour', 'Any colour', function () {
      var w = c.white.map(function (v) { return optHtml('colour', v, v); }).join('');
      var y = c.fancy.map(function (v) { return optHtml('colour', v, fancyLabel(v)); }).join('');
      if (f.type) return w + y;
      return (w ? '<optgroup label="White">' + w + '</optgroup>' : '') + (y ? '<optgroup label="Fancy colours">' + y + '</optgroup>' : '');
    });
    fillSelect('fClarity', 'clarity', 'Any clarity', function () {
      return CLARITIES.map(function (v) { return optHtml('clarity', v, v); }).join('');
    });
    fillSelect('fCert', 'cert', 'Any lab', function () {
      return CERTS.map(function (v) { return optHtml('cert', v, v); }).join('');
    });
    el('fSort').value = sort;
  }

  function chips(target, items, field, cls) {
    target.innerHTML = items.map(function (i) {
      var n = HC.count(HC.withField(f, field, i[0]));
      return '<button type="button" class="hc-chip ' + (cls || '') + (f[field] === i[0] ? ' active' : '') + '" data-f="' + field + '" data-v="' + i[0] + '"' +
             (n === 0 && i[0] ? ' disabled' : '') + '>' + i[1] + (i[0] || field !== 'type' ? '' : ' <span style="opacity:.6">(' + n + ')</span>') + '</button>';
    }).join('');
  }
  function buildChips() {
    var all = HC.count(HC.withField(f, 'type', ''));
    chips(el('fType'), [['', 'All'], ['natural', 'Natural'], ['lab', 'Lab Grown'], ['coloured', 'Coloured']], 'type');
    el('fType').firstChild.innerHTML = 'All <span style="opacity:.6">(' + all + ')</span>';
    if (f.type === 'lab') chips(el('fSub'), [['', 'Any method'], ['CVD', 'CVD'], ['HPHT', 'HPHT']], 'method', 'sub');
    else if (f.type === 'coloured') chips(el('fSub'), [['', 'Any origin'], ['Natural', 'Natural colour'], ['Lab Grown', 'Lab grown colour']], 'origin', 'sub');
    else el('fSub').innerHTML = '';
  }

  function sorted(list) {
    var a = list.slice();
    if (sort === 'ct-asc') a.sort(function (x, y) { return x.ct - y.ct; });
    else if (sort === 'ct-desc') a.sort(function (x, y) { return y.ct - x.ct; });
    return a;
  }

  function cardHtml(s) {
    var p = s.raw, sp = p.specs, third = sp.Cut ? ['Cut', sp.Cut] : sp['Growth Method'] ? ['Method', sp['Growth Method']] : ['Origin', sp.Origin || ''];
    var wa = waLink(WHATSAPP_NUMBER, 'Hi Heera Cartel Co., I would like more details on stone reference ' + p.ref + ' (' + p.shape + ', ' + p.carat + ').');
    return '<div class="stone-card"><a href="product.html?id=' + esc(p.id) + '"><div class="stone-frame">' +
      '<img src="' + esc(p.cover) + '" alt="' + esc(p.shape + ' diamond, ' + p.carat) + '" loading="lazy" data-shape="' + esc(p.shapeSlug) + '">' +
      '<span class="stone-ref">' + esc(p.ref) + '</span></div></a>' +
      '<div class="stone-body"><a href="product.html?id=' + esc(p.id) + '"><p class="stone-title">' + esc(p.title) + '</p></a>' +
      '<div class="stone-specs">' +
        '<div class="row"><span class="k">Colour</span><span class="v">' + esc(sp.Colour || '') + '</span></div>' +
        '<div class="row"><span class="k">Clarity</span><span class="v">' + esc(sp.Clarity || '') + '</span></div>' +
        '<div class="row"><span class="k">' + third[0] + '</span><span class="v">' + esc(third[1]) + '</span></div></div>' +
      '<p class="stone-cert">' + esc(p.cert) + ' Certified</p>' +
      '<a class="stone-cta" href="product.html?id=' + esc(p.id) + '">View full details →</a>' +
      '<a class="stone-cta secondary" href="' + wa + '" target="_blank" rel="noopener">Enquire on WhatsApp</a></div></div>';
  }

  /* photos are still being added: fall back to the shape picture and say so */
  document.addEventListener('error', function (e) {
    var img = e.target; if (!img || img.tagName !== 'IMG' || !img.hasAttribute('data-shape')) return;
    var fb = SHAPE_IMG[img.getAttribute('data-shape')]; img.removeAttribute('data-shape');
    if (fb) { img.src = fb; var fr = img.closest('.stone-frame'); if (fr && !fr.querySelector('.sample-tag')) fr.insertAdjacentHTML('beforeend', '<span class="sample-tag">Representative image</span>'); }
  }, true);

  function pills() {
    var rows = HC.describe(f), keys = { Type: 'type', Shape: 'shape', Carat: 'carat', Colour: 'colour', Clarity: 'clarity', Certification: 'cert' };
    el('fPills').innerHTML = rows.map(function (r) {
      return '<button type="button" class="hc-pill" data-clear="' + keys[r[0]] + '" aria-label="Remove ' + esc(r[0]) + ' filter">' + esc(r[1]) + '</button>';
    }).join('');
    el('fClear').hidden = !rows.length;
  }

  function quoteBar(n) {
    var rows = HC.describe(f);
    var msg = 'Hi Heera Cartel Co., ' + (rows.length ? "I'm looking at your catalogue and would like a quote on:\n" + rows.map(function (r) { return '• ' + r[0] + ': ' + r[1]; }).join('\n')
                                                        : "I'm looking at your catalogue and would like your current wholesale rates.");
    el('fQuote').href = HC.waLink(msg);
    el('fQuoteText').textContent = n ? 'Like what you see? Get rates on this selection.' : "Can't find it? Tell us the spec and we'll source it.";
  }

  function syncUrl() {
    var q = HC.toQuery(f, { sort: sort === 'ref' ? '' : sort });
    try { history.replaceState(null, '', location.pathname + q); } catch (e) {}
  }

  function render(resetPaging) {
    if (resetPaging) shown = PAGE;
    if (lastType !== f.type) {                       // colour list depends on type: drop a colour that no longer applies
      if (f.colour && HC.count(f) === 0) f.colour = '';
      lastType = f.type;
    }
    var list = sorted(HC.filter(f));
    buildChips(); buildSelects(); pills();
    el('fCount').innerHTML = '<b>' + list.length + '</b> of ' + HC.STONES.length + ' stones';
    el('catGrid').innerHTML = list.slice(0, shown).map(cardHtml).join('');
    el('catEmpty').hidden = list.length > 0;
    el('catGrid').hidden = list.length === 0;
    var rest = list.length - shown;
    el('fMore').hidden = rest <= 0;
    if (rest > 0) el('fMore').textContent = 'Show ' + Math.min(PAGE, rest) + ' more (' + rest + ' remaining)';
    quoteBar(list.length);
    syncUrl();
    HC.track('catalogue_filter', { event_category: 'catalogue', results: list.length });
  }

  /* events */
  el('catTools').addEventListener('click', function (e) {
    var b = e.target.closest('.hc-chip'); if (!b || b.disabled) return;
    var field = b.getAttribute('data-f'), v = b.getAttribute('data-v');
    f[field] = v;
    if (field === 'type') { f.method = ''; f.origin = ''; f.colour = ''; }
    render(true);
  });
  [['fShape', 'shape'], ['fCarat', 'carat'], ['fColour', 'colour'], ['fClarity', 'clarity'], ['fCert', 'cert']].forEach(function (p) {
    el(p[0]).addEventListener('change', function () { f[p[1]] = this.value; render(true); });
  });
  el('fSort').addEventListener('change', function () { sort = this.value; render(true); });
  el('fPills').addEventListener('click', function (e) {
    var b = e.target.closest('[data-clear]'); if (!b) return;
    var k = b.getAttribute('data-clear'); f[k] = '';
    if (k === 'type') { f.method = ''; f.origin = ''; f.colour = ''; }
    render(true);
  });
  el('fClear').addEventListener('click', function () { HC.KEYS.forEach(function (k) { f[k] = ''; }); render(true); });
  el('fMore').addEventListener('click', function () { shown += PAGE; render(false); });
  el('fQuote').addEventListener('click', function () { HC.track('catalogue_quote', { event_category: 'catalogue' }); });

  render(true);
})();
