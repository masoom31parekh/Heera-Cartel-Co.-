/* ==========================================================
   Heera Cartel Co. — shared filter engine
   Used by the quote builder (index.html) and catalogue.html.
   Needs catalogue-data.js loaded first (CATALOGUE, CATALOGUE_META).
   ========================================================== */
(function () {
  'use strict';

  var WA_NUMBER = '919727857303';

  /* ---------- helpers ---------- */
  function track(name, params) {
    try { if (typeof gtag === 'function') gtag('event', name, params || {}); } catch (e) {}
  }
  function waLink(message) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
  }

  /* ---------- normalise the catalogue once ----------
     The data has small inconsistencies (e.g. "F/G", "E Non-Florescent", "VVS", "1.58 ct each").
     We read them into clean, filterable fields without touching catalogue-data.js. */
  var WHITE_ORDER  = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
  var FANCY_ORDER  = ['Yellow', 'Pink', 'Blue', 'Green', 'Champagne', 'Cognac', 'Black'];
  var CLARITY_ORDER = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'];

  function colourKeys(category, raw) {
    raw = String(raw || '');
    if (category === 'coloured') {
      var out = [];
      FANCY_ORDER.forEach(function (k) { if (raw.toLowerCase().indexOf(k.toLowerCase()) > -1) out.push(k); });
      return out;
    }
    var m = raw.toUpperCase().match(/^([D-Z])(?:\s*\/\s*([D-Z]))?/);   // "F/G" -> F,G   "E Non-Florescent" -> E
    return m ? [m[1]].concat(m[2] ? [m[2]] : []) : [];
  }
  function clarityKeys(raw) {
    raw = String(raw || '').toUpperCase().trim();
    return raw === 'VVS' ? ['VVS1', 'VVS2'] : (raw ? [raw] : []);        // bare "VVS" counts as VVS1 and VVS2
  }

  var STONES = CATALOGUE.map(function (p) {
    var type = p.category;                                                // natural | lab | coloured
    return {
      raw: p,
      id: p.id, ref: p.ref, title: p.title, cert: p.cert,
      type: type,
      method: (p.specs['Growth Method'] || '').toUpperCase(),             // CVD | HPHT | ''
      origin: type === 'coloured' ? (p.specs.Origin || '') : '',          // coloured only: Natural | Lab Grown
      shape: p.shapeSlug,
      ct: parseFloat(p.carat) || 0,
      colours: colourKeys(type, p.specs.Colour),
      clarities: clarityKeys(p.specs.Clarity)
    };
  });

  /* ---------- filters ----------
     f = { type, method, origin, shape, cert, carat:'min-max', colour, clarity }   ('' = any) */
  var EMPTY = { type: '', method: '', origin: '', shape: '', cert: '', carat: '', colour: '', clarity: '' };
  var KEYS = Object.keys(EMPTY);

  var CARAT_PRESETS = [
    ['Under 1 ct',     '0-0.99'],
    ['1.00 – 1.49 ct', '1-1.49'],
    ['1.50 – 1.99 ct', '1.5-1.99'],
    ['2.00 – 2.99 ct', '2-2.99'],
    ['3 ct & above',   '3-']
  ];

  function parseCarat(s) {                                                // "1-1.5" | "1-" | "-2"  (inclusive)
    if (!s) return null;
    var a = String(s).split('-');
    var min = parseFloat(a[0]); var max = parseFloat(a[1]);
    return { min: isNaN(min) ? 0 : min, max: isNaN(max) ? Infinity : max };
  }
  function caratLabel(s) {
    var r = parseCarat(s); if (!r) return '';
    var hit = CARAT_PRESETS.filter(function (p) { return p[1] === s; })[0];
    if (hit) return hit[0];
    if (r.max === Infinity) return r.min + ' ct & above';
    if (r.min === 0) return 'Up to ' + r.max + ' ct';
    return r.min + ' – ' + r.max + ' ct';
  }

  function matches(s, f) {
    if (f.type    && s.type !== f.type) return false;
    if (f.method  && s.method !== f.method) return false;
    if (f.origin  && s.origin !== f.origin) return false;
    if (f.shape   && s.shape !== f.shape) return false;
    if (f.cert    && s.cert !== f.cert) return false;
    if (f.colour  && s.colours.indexOf(f.colour) < 0) return false;
    if (f.clarity && s.clarities.indexOf(f.clarity) < 0) return false;
    if (f.carat) { var r = parseCarat(f.carat); if (s.ct < r.min - 1e-9 || s.ct > r.max + 1e-9) return false; }
    return true;
  }
  function count(f) { var n = 0; for (var i = 0; i < STONES.length; i++) if (matches(STONES[i], f)) n++; return n; }
  function filter(f) { return STONES.filter(function (s) { return matches(s, f); }); }
  function withField(f, k, v) { var o = {}; KEYS.forEach(function (x) { o[x] = f[x]; }); o[k] = v; return o; }

  /* ---------- URL <-> filters ---------- */
  function fromQuery(qs) {
    var p = new URLSearchParams(qs || ''); var f = {};
    KEYS.forEach(function (k) { f[k] = (p.get(k) || '').trim(); });
    if (['natural', 'lab', 'coloured'].indexOf(f.type) < 0) { f.type = ''; }
    if (f.type !== 'lab') f.method = '';
    if (f.type !== 'coloured') f.origin = '';
    return f;
  }
  function toQuery(f, extra) {
    var p = new URLSearchParams();
    KEYS.forEach(function (k) { if (f[k]) p.set(k, f[k]); });
    if (extra) Object.keys(extra).forEach(function (k) { if (extra[k]) p.set(k, extra[k]); });
    var s = p.toString(); return s ? '?' + s : '';
  }

  /* ---------- human labels ---------- */
  var TYPE_LABEL = { natural: 'Natural', lab: 'Lab Grown', coloured: 'Coloured' };
  function shapeName(slug) {
    var n = CATALOGUE_META.shapes.filter(function (s) { return CATALOGUE_META.shapeSlug[s] === slug; })[0];
    return n || slug;
  }
  function typeLabel(f) {
    if (!f.type) return '';
    var t = TYPE_LABEL[f.type];
    if (f.type === 'lab' && f.method) t += ' (' + f.method + ')';
    if (f.type === 'coloured' && f.origin) t += ' (' + f.origin + ')';
    return t;
  }
  function colourLabel(f) {
    if (!f.colour) return '';
    return WHITE_ORDER.indexOf(f.colour) > -1 ? f.colour : (f.colour === 'Black' || f.colour === 'Champagne' || f.colour === 'Cognac' ? f.colour : 'Fancy ' + f.colour);
  }
  /* Ordered [label, value] pairs describing a selection — used for WhatsApp text and filter pills */
  function describe(f) {
    var rows = [];
    if (f.type)    rows.push(['Type', typeLabel(f)]);
    if (f.shape)   rows.push(['Shape', shapeName(f.shape)]);
    if (f.carat)   rows.push(['Carat', caratLabel(f.carat)]);
    if (f.colour)  rows.push(['Colour', colourLabel(f)]);
    if (f.clarity) rows.push(['Clarity', f.clarity]);
    if (f.cert)    rows.push(['Certification', f.cert]);
    return rows;
  }

  window.HC = {
    WA_NUMBER: WA_NUMBER, STONES: STONES, EMPTY: EMPTY, KEYS: KEYS,
    WHITE_ORDER: WHITE_ORDER, FANCY_ORDER: FANCY_ORDER, CLARITY_ORDER: CLARITY_ORDER,
    CARAT_PRESETS: CARAT_PRESETS, TYPE_LABEL: TYPE_LABEL,
    matches: matches, count: count, filter: filter, withField: withField,
    fromQuery: fromQuery, toQuery: toQuery,
    parseCarat: parseCarat, caratLabel: caratLabel,
    shapeName: shapeName, typeLabel: typeLabel, colourLabel: colourLabel, describe: describe,
    waLink: waLink, track: track
  };
})();
