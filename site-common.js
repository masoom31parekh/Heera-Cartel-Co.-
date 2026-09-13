// Shared behaviour for every page: side menu drawer + header scroll state.
document.addEventListener('DOMContentLoaded', () => {
  const menuTrigger = document.getElementById('menuTrigger');
  const menuClose = document.getElementById('menuClose');
  const sideMenu = document.getElementById('sideMenu');
  const menuOverlay = document.getElementById('menuOverlay');

  function openMenu(){
    sideMenu.classList.add('open');
    menuOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu(){
    sideMenu.classList.remove('open');
    menuOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (menuTrigger) menuTrigger.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
  if (sideMenu) sideMenu.querySelectorAll('.side-link').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  // Header only needs the "scrolled" toggle on pages using the transparent (hero) header.
  const siteHeader = document.getElementById('siteHeader');
  if (siteHeader && siteHeader.classList.contains('transparent')) {
    function updateHeaderOnScroll(){
      if (window.scrollY > 40) siteHeader.classList.add('scrolled');
      else siteHeader.classList.remove('scrolled');
    }
    window.addEventListener('scroll', updateHeaderOnScroll);
    updateHeaderOnScroll();
  }

  // FAQ accordion (only present on index.html, harmless elsewhere)
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
});

// ---- Shared media gallery helpers (used by shape.html + product.html cards) ----
function renderMediaItems(media, altText){
  return media.map((m, i) => `
    <div class="media-item ${i === 0 ? 'active' : ''}">
      ${m.type === 'video'
        ? `<video src="${m.src}" muted loop playsinline autoplay></video>`
        : `<img src="${m.src}" alt="${altText}" loading="lazy">`}
    </div>
  `).join('');
}

function renderMediaNav(media){
  if (media.length <= 1) return '';
  return `
    <button class="media-nav prev" onclick="stepMedia(this,-1,event)">‹</button>
    <button class="media-nav next" onclick="stepMedia(this,1,event)">›</button>
    <div class="media-dots">
      ${media.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
    </div>
  `;
}

// Steps a card's media forward/back when it has more than one image/video.
// Prevents the click from bubbling to a surrounding <a> (product cards wrap the gallery in a link).
function stepMedia(btn, dir, evt){
  if (evt) { evt.preventDefault(); evt.stopPropagation(); }
  const frame = btn.closest('.stone-frame, .gallery-main');
  const items = frame.querySelectorAll('.media-item');
  const dots = frame.querySelectorAll('.dot');
  let idx = parseInt(frame.dataset.active || '0', 10);
  idx = (idx + dir + items.length) % items.length;
  items.forEach((el, i) => el.classList.toggle('active', i === idx));
  dots.forEach((el, i) => el.classList.toggle('active', i === idx));
  frame.dataset.active = idx;
}

function waLink(phoneDigits, message){
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

const WHATSAPP_NUMBER = '919727857303';
