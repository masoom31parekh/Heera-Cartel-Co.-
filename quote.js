/* ==========================================================
   Heera Cartel Co. — Quote builder (index.html #quoteApp)
   Needs catalogue-data.js and hc-filter.js first.
   ========================================================== */
(function () {
  'use strict';
  var root = document.getElementById('quoteApp');
  if (!root || !window.HC) return;

  var f = { type: '', method: '', origin: '', shape: '', cert: '', colour: '', clarity: '' };
  var ct = { min: '', max: '' }, qty = '', who = '';

  var QTY = ['1 stone', '2 – 5 stones', '6 – 20 stones', '20+ stones / parcel'];
  var CERTS = ['IGI', 'GIA', 'CGI'];
  var CLARITIES = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'];
  var WHITE = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
  var FANCY = HC.FANCY_ORDER;

  function el(id) { return document.getElementById(id); }
  function opt(v, label, sel) { return '<option value="' + v + '"' + (sel ? ' selected' : '') + '>' + label + '</option>'; }

  root.innerHTML =
    '<div class="quote-form">' +
      '<div><h3>1 · Type</h3><div class="hc-chips" id="qType"></div><div class="hc-chips quote-sub" id="qSub"></div></div>' +
      '<div><h3>2 · Specification</h3><div class="quote-grid">' +
        '<label class="hc-field">Shape<select id="qShape"></select></label>' +
        '<div class="hc-field">Carat (from – to)<div class="hc-range">' +
          '<input id="qCtMin" type="number" inputmode="decimal" min="0" step="0.01" placeholder="e.g. 1.00" aria-label="Carat from">' +
          '<input id="qCtMax" type="number" inputmode="decimal" min="0" step="0.01" placeholder="e.g. 1.50" aria-label="Carat to"></div></div>' +
        '<label class="hc-field">Colour<select id="qColour"></select></label>' +
        '<label class="hc-field">Clarity<select id="qClarity"></select></label>' +
        '<label class="hc-field">Certification<select id="qCert"></select></label>' +
        '<label class="hc-field">Quantity<select id="qQty"></select></label>' +
      '</div></div>' +
      '<div><h3>3 · About you (optional)</h3><label class="hc-field">Name / company<input id="qWho" type="text" autocomplete="organization" placeholder="So we know who is asking"></label></div>' +
    '</div>' +
    '<aside class="quote-side" aria-live="polite">' +
      '<h3>Your request</h3>' +
      '<div class="quote-preview" id="qPreview"></div>' +
      '<p class="quote-match" id="qMatch"></p>' +
      '<div class="quote-actions">' +
        '<a class="hc-btn" id="qWa" target="_blank" rel="noopener">Send on WhatsApp</a>' +
        '<button type="button" class="hc-btn ghost" id="qCopy">Copy message</button>' +
        '<button type="button" class="hc-btn ghost" id="qMail">Send as email enquiry</button>' +
      '</div>' +
      '<p class="quote-note">We reply with current wholesale rates. Nothing is sent until you tap a button.</p>' +
    '</aside>';

  /* static option lists */
  el('qShape').innerHTML = opt('', 'Any shape', true) +
    CATALOGUE_META.shapes.map(function (s) { return opt(CATALOGUE_META.shapeSlug[s], s); }).join('');
  el('qClarity').innerHTML = opt('', 'Any clarity', true) + CLARITIES.map(function (c) { return opt(c, c); }).join('');
  el('qCert').innerHTML = opt('', 'Any lab', true) + CERTS.map(function (c) { return opt(c, c); }).join('');
  el('qQty').innerHTML = opt('', 'Not sure yet', true) + QTY.map(function (q) { return opt(q, q); }).join('');

  function fancyLabel(c) { return (c === 'Black' || c === 'Champagne' || c === 'Cognac') ? c : 'Fancy ' + c; }
  function fillColour() {
    var w = WHITE.map(function (c) { return opt(c, c); }).join('');
    var y = FANCY.map(function (c) { return opt(c, fancyLabel(c)); }).join('');
    var html = opt('', 'Any colour', true);
    if (f.type === 'coloured') html += y;
    else if (f.type) html += w;
    else html += '<optgroup label="White (D–J)">' + w + '</optgroup><optgroup label="Fancy colours">' + y + '</optgroup>';
    el('qColour').innerHTML = html;
    el('qColour').value = f.colour;
  }

  function chips(target, items, cur, cls) {
    target.innerHTML = items.map(function (i) {
      return '<button type="button" class="hc-chip ' + (cls || '') + (i[0] === cur ? ' active' : '') + '" data-v="' + i[0] + '">' + i[1] + '</button>';
    }).join('');
  }

  function caratValue() {
    var a = parseFloat(ct.min), b = parseFloat(ct.max);
    if (isNaN(a) && isNaN(b)) return '';
    if (!isNaN(a) && !isNaN(b) && b < a) { var t = a; a = b; b = t; }
    return (isNaN(a) ? '0' : a) + '-' + (isNaN(b) ? '' : b);
  }
  function caratText() {
    var a = parseFloat(ct.min), b = parseFloat(ct.max);
    if (isNaN(a) && isNaN(b)) return '';
    if (!isNaN(a) && !isNaN(b)) { if (b < a) { var t = a; a = b; b = t; } return a === b ? a.toFixed(2) + ' ct' : a.toFixed(2) + ' – ' + b.toFixed(2) + ' ct'; }
    return isNaN(b) ? a.toFixed(2) + ' ct & above' : 'up to ' + b.toFixed(2) + ' ct';
  }

  function filters() {
    var o = {}; HC.KEYS.forEach(function (k) { o[k] = f[k] || ''; }); o.carat = caratValue(); return o;
  }

  function message() {
    var rows = [], F = filters();
    if (F.type) rows.push('Type: ' + HC.typeLabel(F));
    if (F.shape) rows.push('Shape: ' + HC.shapeName(F.shape));
    if (F.carat) rows.push('Carat: ' + caratText());
    if (F.colour) rows.push('Colour: ' + HC.colourLabel(F));
    if (F.clarity) rows.push('Clarity: ' + F.clarity);
    if (F.cert) rows.push('Certification: ' + F.cert);
    if (qty) rows.push('Quantity: ' + qty);
    var msg = 'Hi Heera Cartel Co., ' + (rows.length ? "I'd like a wholesale quote on:\n" + rows.map(function (r) { return '• ' + r; }).join('\n')
                                                      : "I'd like to know your current wholesale rates for diamonds.");
    if (who.trim()) msg += '\n\n— ' + who.trim();
    return msg;
  }

  function render() {
    chips(el('qType'), [['', 'Any'], ['natural', 'Natural'], ['lab', 'Lab Grown'], ['coloured', 'Coloured']], f.type);
    if (f.type === 'lab') chips(el('qSub'), [['', 'Either method'], ['CVD', 'CVD'], ['HPHT', 'HPHT']], f.method, 'sub');
    else if (f.type === 'coloured') chips(el('qSub'), [['', 'Either origin'], ['Natural', 'Natural colour'], ['Lab Grown', 'Lab grown colour']], f.origin, 'sub');
    else el('qSub').innerHTML = '';
    updatePreview();
  }

  function updatePreview() {
    var msg = message(), F = filters(), n = HC.count(F);
    el('qPreview').textContent = msg;
    el('qWa').href = HC.waLink(msg);
    var anyFilter = HC.KEYS.some(function (k) { return F[k]; });
    var q = HC.toQuery(F);
    el('qMatch').innerHTML = !anyFilter ? '' :
      (n ? 'We have <b>' + n + '</b> matching stone' + (n === 1 ? '' : 's') + ' listed. <a href="catalogue.html' + q + '">View them →</a>'
         : 'No exact match in our listed stones — send the request anyway and we will source it for you.');
  }

  /* events */
  root.addEventListener('click', function (e) {
    var b = e.target.closest('.hc-chip'); if (!b) return;
    var v = b.getAttribute('data-v');
    if (b.parentNode.id === 'qType') { f.type = v; f.method = ''; f.origin = ''; f.colour = ''; fillColour(); }
    else if (f.type === 'lab') f.method = v; else f.origin = v;
    render();
  });
  ['qShape:shape', 'qColour:colour', 'qClarity:clarity', 'qCert:cert'].forEach(function (p) {
    var a = p.split(':'); el(a[0]).addEventListener('change', function () { f[a[1]] = this.value; updatePreview(); });
  });
  el('qQty').addEventListener('change', function () { qty = this.value; updatePreview(); });
  el('qCtMin').addEventListener('input', function () { ct.min = this.value; updatePreview(); });
  el('qCtMax').addEventListener('input', function () { ct.max = this.value; updatePreview(); });
  el('qWho').addEventListener('input', function () { who = this.value; updatePreview(); });

  el('qWa').addEventListener('click', function () { HC.track('quote_whatsapp', { event_category: 'quote' }); });
  el('qCopy').addEventListener('click', function () {
    var btn = this, msg = message();
    function done() { btn.textContent = 'Copied ✓'; setTimeout(function () { btn.textContent = 'Copy message'; }, 1800); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msg).then(done, done); else done();
    HC.track('quote_copy', { event_category: 'quote' });
  });
  el('qMail').addEventListener('click', function () {
    var ta = document.getElementById('f-message'), nm = document.getElementById('f-name'), co = document.getElementById('f-company');
    if (ta) ta.value = message().replace(/^Hi Heera Cartel Co\., /, '');
    if (co && !co.value && who.trim()) co.value = who.trim();
    var c = document.getElementById('contact'); if (c) c.scrollIntoView({ behavior: 'smooth' });
    setTimeout(function () { try { (nm && !nm.value ? nm : ta).focus({ preventScroll: true }); } catch (e) {} }, 700);
    HC.track('quote_email', { event_category: 'quote' });
  });

  fillColour();
  render();
})();
