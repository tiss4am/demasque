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

  const Sound = {
    toggle: function () {
      enabled = !enabled;
      if (enabled) ensureCtx();
      return enabled;
    },
    isEnabled: function () { return enabled; },
    curtain: curtain,
    slide: slide
  };

  global.Sound = Sound;
})(window);
