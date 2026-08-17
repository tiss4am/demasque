/* =============================================================
   DÉMASQUE — Moteur sonore discret (Web Audio API)
   Aucun fichier audio requis : les sons sont synthétisés à la volée,
   ce qui garde le dépôt léger et fonctionne hors-ligne.
   Deux effets : ouverture de rideau (whoosh feutré) et glissement
   de carte (petit « swish »). Activables/désactivables par l'utilisateur.
   ============================================================= */
(function (global) {
  "use strict";

  let ctx = null;
  let enabled = false;

  /** Initialise (ou réutilise) le contexte audio — créé après une
   *  interaction utilisateur pour respecter les politiques navigateur. */
  function ensureCtx() {
    if (!ctx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /** Enveloppe simple gain avec attaque/déclin doux. */
  function envGain(now, peak, attack, release) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);
    return g;
  }

  /** Bruit filtré = base des whoosh feutrés. */
  function noiseBuffer(duration) {
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  /** Ouverture de rideau : whoosh grave, ample et théâtral. */
  function curtain() {
    if (!enabled || !ensureCtx()) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(1.4);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.9);
    filter.Q.value = 0.7;

    const g = envGain(now, 0.16, 0.4, 1.0);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(now);
    src.stop(now + 1.5);
  }

  /** Glissement de carte : « swish » court et léger. */
  function slide() {
    if (!enabled || !ensureCtx()) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.35);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(2600, now + 0.2);
    filter.Q.value = 1.2;

    const g = envGain(now, 0.10, 0.03, 0.28);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.4);
  }

  /** Carte DÉLICATE : accord grave, résonant et dramatique, avec un
   *  scintillement cristallin — pour signaler une question « précieuse ». */
  function deep() {
    if (!enabled || !ensureCtx()) return;
    const now = ctx.currentTime;

    // fondamentale grave, suspense
    const bass = ctx.createOscillator();
    bass.type = "sine";
    bass.frequency.setValueAtTime(98, now);            // sol grave
    bass.frequency.exponentialRampToValueAtTime(110, now + 0.9);
    const bassGain = envGain(now, 0.16, 0.08, 1.3);
    bass.connect(bassGain).connect(ctx.destination);
    bass.start(now); bass.stop(now + 1.5);

    // quinte chaude, une octave au-dessus
    const mid = ctx.createOscillator();
    mid.type = "triangle";
    mid.frequency.setValueAtTime(294, now);            // ré
    const midGain = envGain(now, 0.07, 0.12, 1.1);
    mid.connect(midGain).connect(ctx.destination);
    mid.start(now); mid.stop(now + 1.3);

    // scintillement cristallin (l'éclat « précieux »)
    const shimmer = ctx.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(1568, now + 0.12); // sol aigu
    const shimGain = ctx.createGain();
    shimGain.gain.setValueAtTime(0.0001, now + 0.12);
    shimGain.gain.exponentialRampToValueAtTime(0.05, now + 0.22);
    shimGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    shimmer.connect(shimGain).connect(ctx.destination);
    shimmer.start(now + 0.12); shimmer.stop(now + 1.0);
  }

  const Sound = {
    toggle: function () {
      enabled = !enabled;
      if (enabled) ensureCtx();
      return enabled;
    },
    isEnabled: function () { return enabled; },
    curtain: curtain,
    slide: slide,
    deep: deep
  };

  global.Sound = Sound;
})(window);
