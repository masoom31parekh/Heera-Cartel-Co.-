/* ==========================================================
   Heera Cartel Co. — Shri Yantra intro
   Whether the intro plays is decided by the tiny script in <head>
   (adds class "intro-on" to <html>). This file runs the video.
   ========================================================== */
(function () {
  'use strict';

  var SEEN_KEY = 'hc_intro_seen';                 // remembered for the browser session
  var SRC_WIDE   = 'assets/intro/heera-intro-desktop.mp4';   // landscape screens
  var SRC_SQUARE = 'assets/intro/heera-intro-mobile.mp4';    // portrait / phones
  var POSTER     = 'assets/intro/heera-intro-poster.jpg';
  var START_WITH_SOUND = false;   // browsers block sound before a tap; visitors can switch it on

  var root    = document.documentElement;
  var splash  = document.getElementById('introSplash');
  var video   = document.getElementById('introVideo');
  var skipBtn = document.getElementById('introSkip');
  var soundBtn = document.getElementById('introSound');
  var heroVideo = document.querySelector('.hero-video');
  if (!splash || !video) return;

  var finished = true, watchdog = null, hardStop = null;

  function track(name) {                           // Google Analytics event, if GA is loaded
    try { if (typeof gtag === 'function') gtag('event', name, { event_category: 'intro' }); } catch (e) {}
  }

  function isWide() {
    return window.matchMedia('(min-aspect-ratio: 5/4)').matches;
  }

  function updateSoundButton() {
    soundBtn.textContent = video.muted ? 'Sound on' : 'Sound off';
    soundBtn.setAttribute('aria-pressed', video.muted ? 'false' : 'true');
  }

  function start() {
    if (!root.classList.contains('intro-on')) return;
    finished = false;
    splash.classList.remove('is-leaving');

    video.poster = POSTER;
    video.src = isWide() ? SRC_WIDE : SRC_SQUARE;
    video.currentTime = 0;
    video.muted = !START_WITH_SOUND;
    updateSoundButton();

    if (heroVideo) { try { heroVideo.pause(); } catch (e) {} }   // don't load two videos at once

    var p = video.play();
    if (p && p.catch) {
      p.catch(function () {
        // Autoplay refused (e.g. iOS Low Power Mode) — try muted once, else skip straight to the site
        video.muted = true; updateSoundButton();
        var q = video.play();
        if (q && q.catch) q.catch(function () { finish('blocked'); });
      });
    }

    track('intro_start');
    clearTimeout(watchdog); clearTimeout(hardStop);
    watchdog = setTimeout(function () { if (video.currentTime < 0.2) finish('slow'); }, 5000);  // slow network
    hardStop = setTimeout(function () { finish('timeout'); }, 16000);                            // safety net

    try { skipBtn.focus({ preventScroll: true }); } catch (e) {}
  }

  function finish(reason) {
    if (finished) return;
    finished = true;
    clearTimeout(watchdog); clearTimeout(hardStop);
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
    track(reason === 'ended' ? 'intro_complete' : 'intro_' + reason);

    splash.classList.add('is-leaving');            // fade out (matches the CSS transition)
    setTimeout(function () {
      root.classList.remove('intro-on');
      splash.classList.remove('is-leaving');
      try { video.pause(); video.removeAttribute('src'); video.load(); } catch (e) {}
      if (heroVideo) {
        try { var p = heroVideo.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
      }
    }, 700);
  }

  video.addEventListener('ended', function () { finish('ended'); });
  video.addEventListener('error', function () { finish('error'); });
  skipBtn.addEventListener('click', function () { finish('skip'); });
  soundBtn.addEventListener('click', function () {
    video.muted = !video.muted;
    updateSoundButton();
    if (video.paused && !finished) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('intro-on')) finish('skip');
  });

  // Footer link: <a href="#" data-replay-intro>Replay intro</a>
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-replay-intro]');
    if (!t) return;
    e.preventDefault();
    window.scrollTo(0, 0);
    root.classList.add('intro-on');
    start();
  });

  start();
})();
