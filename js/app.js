/* =============================================================
   DÉMASQUE — Logique de l'application
   Navigation : Accueil (rideau) → Scène (thèmes) → Mode jeu (cartes).
   + Favoris (♥), cartes masquées (👎), filtre de profondeur (légère /
     délicate), et mise en page « scénario » pour les dilemmes moraux.
   Vanilla JS, aucune dépendance. Données chargées depuis questions.json.
   ============================================================= */
(function () {
  "use strict";

  /* ---------- Références DOM ---------- */
  const splash = document.getElementById("splash");
  const scene = document.getElementById("scene");
  const game = document.getElementById("game");
  const favorites = document.getElementById("favorites");
  const enterBtn = document.getElementById("enter-btn");
  const deckRail = document.getElementById("deck-rail");
  const soundToggle = document.getElementById("sound-toggle");
  const modeButtons = document.querySelectorAll(".chip--mode");
  const depthButtons = document.querySelectorAll(".chip--depth");

  const gameTitle = document.getElementById("game-title");
  const gameProgress = document.getElementById("game-progress");
  const cardStack = document.getElementById("card-stack");
  const backBtn = document.getElementById("back-btn");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const prevBtn = document.getElementById("prev-card");
  const nextBtn = document.getElementById("next-card");

  const favOpenBtn = document.getElementById("fav-open");
  const favCountBadge = document.getElementById("fav-count");
  const favBackBtn = document.getElementById("fav-back");
  const favList = document.getElementById("fav-list");
  const favSubtitle = document.getElementById("fav-subtitle");
  const restoreBtn = document.getElementById("restore-dislikes");
  const dislikeCountEl = document.getElementById("dislike-count");

  /* ---------- État ---------- */
  const state = {
    data: null,
    theme: null,       // thème sélectionné
    cards: [],         // cartes du thème courant (filtrées / mélangées)
    index: 0,          // carte affichée
    mode: "solo",      // "solo" | "groupe"
    filter: "all"      // "all" | "soft" | "deep"  (profondeur)
  };

  /* =============================================================
     STOCKAGE — favoris & cartes masquées (localStorage)
     Les cartes sont identifiées par leur clé texte (stable au mélange).
     ============================================================= */
  const LIKES_KEY = "demasque:likes";
  const DISLIKES_KEY = "demasque:dislikes";

  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) { /* stockage indisponible : on continue sans persistance */ }
  }

  let likes = readJSON(LIKES_KEY, []);       // [{ text, theme, depth }]
  let dislikes = readJSON(DISLIKES_KEY, []); // [ key ]

  const isLiked = (key) => likes.some((l) => l.text === key);
  const isDisliked = (key) => dislikes.indexOf(key) !== -1;

  /* ---------- Helpers de carte (gèrent les deux formats) ---------- */
  const cardKey = (c) => c.text || c.setup;        // identifiant stable
  const cardDepth = (c) => c.depth || "soft";
  const depthLabel = (d) => (state.data.depthLabels && state.data.depthLabels[d]) || d;

  function toggleLike(card) {
    const key = cardKey(card);
    if (isLiked(key)) {
      likes = likes.filter((l) => l.text !== key);
    } else {
      likes.push({ text: key, theme: state.theme.title, depth: cardDepth(card) });
    }
    writeJSON(LIKES_KEY, likes);
    updateFavCount();
    return isLiked(key);
  }
  function addDislike(card) {
    const key = cardKey(card);
    if (!isDisliked(key)) dislikes.push(key);
    likes = likes.filter((l) => l.text !== key); // une carte masquée quitte les favoris
    writeJSON(DISLIKES_KEY, dislikes);
    writeJSON(LIKES_KEY, likes);
    updateFavCount();
  }
  function removeLike(key) {
    likes = likes.filter((l) => l.text !== key);
    writeJSON(LIKES_KEY, likes);
    updateFavCount();
  }
  function restoreDislikes() {
    dislikes = [];
    writeJSON(DISLIKES_KEY, dislikes);
  }
  function updateFavCount() {
    const n = likes.length;
    favCountBadge.textContent = String(n);
    favCountBadge.hidden = n === 0;
  }

  /* ---------- Sélection des cartes d'un thème (filtre + masquées) ---------- */
  function themeCards(theme) {
    return theme.cards.filter((c) => {
      if (isDisliked(cardKey(c))) return false;
      if (state.filter === "soft") return cardDepth(c) === "soft";
      if (state.filter === "deep") return cardDepth(c) === "deep";
      return true;
    });
  }

  /* ---------- Utilitaires ---------- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Échappe le texte inséré en HTML (les questions viennent du JSON). */
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showScreen(el) {
    [splash, scene, game, favorites].forEach((s) => {
      if (s === el) {
        s.hidden = false;
        requestAnimationFrame(() => s.classList.add("is-active"));
      } else {
        s.classList.remove("is-active");
        s.hidden = true;
      }
    });
  }

  /** Petite notification éphémère. */
  let toastTimer = null;
  function toast(message) {
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = message;
    void el.offsetWidth;
    el.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-show"), 1800);
  }

  /* ---------- Chargement des données ---------- */
  function loadData() {
    return fetch("questions.json")
      .then((r) => {
        if (!r.ok) throw new Error("Chargement de questions.json impossible");
        return r.json();
      })
      .then((data) => {
        state.data = data;
        buildDecks();
        updateFavCount();
      })
      .catch((err) => {
        console.error(err);
        deckRail.innerHTML =
          '<p style="color:var(--ink-dim);padding:20px;text-align:center">' +
          "Impossible de charger les questions. Ouvrez l'application via un " +
          "serveur (voir README) plutôt qu'en double-clic sur le fichier.</p>";
      });
  }

  /* ---------- Écran 2 : construire les paquets (sans emoji) ---------- */
  function buildDecks() {
    deckRail.innerHTML = "";
    state.data.themes.forEach((theme) => {
      const available = themeCards(theme).length;
      const deepTotal = theme.cards.filter(
        (c) => cardDepth(c) === "deep" && !isDisliked(cardKey(c))
      ).length;

      const deck = document.createElement("button");
      deck.className = "deck" + (available === 0 ? " deck--empty" : "");
      deck.type = "button";
      deck.setAttribute("role", "listitem");
      deck.setAttribute("aria-label", theme.title + " — " + available + " cartes");

      let meta = available + (available > 1 ? " cartes" : " carte");
      if (state.filter === "all" && deepTotal > 0) meta += " · " + deepTotal + " délicates";

      deck.innerHTML =
        '<span class="deck__face">' +
        '  <span class="deck__sheen" aria-hidden="true"></span>' +
        '  <span class="deck__ornament" aria-hidden="true"></span>' +
        '  <h3 class="deck__title">' + esc(theme.title) + "</h3>" +
        '  <p class="deck__subtitle">' + esc(theme.subtitle) + "</p>" +
        '  <span class="deck__meta">' + meta + "</span>" +
        "</span>";
      deck.addEventListener("click", () => openTheme(theme));
      deckRail.appendChild(deck);
    });
  }

  /* ---------- Écran 3 : ouvrir un thème ---------- */
  function openTheme(theme) {
    state.theme = theme;
    state.cards = themeCards(theme);
    state.index = 0;
    gameTitle.textContent = theme.title;
    game.classList.toggle("game--scenario", theme.layout === "scenario");
    showScreen(game);
    if (state.cards.length === 0) {
      renderEmptyDeck();
    } else {
      renderCard("enter-next");
    }
  }

  function renderEmptyDeck() {
    cardStack.innerHTML =
      '<article class="play-card play-card--empty">' +
      '<span class="play-card__ornament" aria-hidden="true"></span>' +
      '<p class="play-card__text">Aucune carte à afficher avec ce filtre.</p>' +
      '<p class="play-card__theme">Changez de filtre ou restaurez les cartes masquées</p>' +
      "</article>";
    gameProgress.textContent = "0 carte";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  }

  /* ---------- Rendu d'une carte ---------- */
  function renderCard(animClass) {
    cardStack.innerHTML = "";
    nextBtn.disabled = false;

    // cartes de fond (épaisseur du paquet)
    for (let d = 2; d >= 1; d--) {
      if (state.index + d < state.cards.length) {
        const ghost = document.createElement("div");
        ghost.className = "play-card is-behind-" + d;
        ghost.setAttribute("aria-hidden", "true");
        cardStack.appendChild(ghost);
      }
    }

    const total = state.cards.length;
    const c = state.cards[state.index];
    const key = cardKey(c);
    const deep = cardDepth(c) === "deep";
    const scenario = state.theme.layout === "scenario";
    const liked = isLiked(key);
    const num = String(state.index + 1).padStart(2, "0");

    const card = document.createElement("article");
    card.className =
      "play-card " + (animClass || "") +
      (deep ? " play-card--deep" : "") +
      (scenario ? " play-card--scenario" : "");

    const delicateBadge = deep
      ? '<span class="play-card__delicate">◆ Délicate</span>' : "";
    const sheen = deep ? '<span class="card-sheen" aria-hidden="true"></span>' : "";

    let body;
    if (scenario) {
      body =
        '<span class="scenario__label">Scène ' + num + "</span>" +
        delicateBadge +
        '<p class="scenario__setup">' + esc(c.setup) + "</p>" +
        '<p class="scenario__question">' + esc(c.question) + "</p>" +
        '<div class="scenario__choices">' +
        '  <button class="choice" type="button"><span class="choice__key">A</span>' + esc(c.optionA) + "</button>" +
        '  <button class="choice" type="button"><span class="choice__key">B</span>' + esc(c.optionB) + "</button>" +
        "</div>";
    } else {
      body =
        '<span class="play-card__ornament" aria-hidden="true"></span>' +
        delicateBadge +
        '<p class="play-card__text">' + esc(key) + "</p>" +
        '<span class="play-card__theme">' + esc(state.theme.title) + "</span>";
    }

    card.innerHTML =
      sheen +
      '<span class="play-card__corner play-card__corner--tl">' + num + "</span>" +
      body +
      '<span class="play-card__corner play-card__corner--br">' + num + "</span>" +
      '<div class="card-actions">' +
      '  <button class="card-act card-act--dislike" type="button" title="Ne plus voir cette carte" aria-label="Masquer cette carte">👎</button>' +
      '  <button class="card-act card-act--like' + (liked ? " is-active" : "") + '" type="button" ' +
      '    aria-pressed="' + (liked ? "true" : "false") + '" title="Enregistrer dans mes favoris" aria-label="Ajouter aux favoris">♥</button>' +
      "</div>";
    cardStack.appendChild(card);

    // Interactions internes : ne pas déclencher le swipe
    const stop = (el) => ["pointerdown", "pointerup", "pointermove"].forEach(
      (ev) => el.addEventListener(ev, (e) => e.stopPropagation())
    );
    const likeBtn = card.querySelector(".card-act--like");
    const dislikeBtn = card.querySelector(".card-act--dislike");
    stop(likeBtn); stop(dislikeBtn);
    likeBtn.addEventListener("click", () => {
      const nowLiked = toggleLike(c);
      likeBtn.classList.toggle("is-active", nowLiked);
      likeBtn.setAttribute("aria-pressed", String(nowLiked));
      toast(nowLiked ? "♥ Enregistrée dans vos favoris" : "Retirée des favoris");
    });
    dislikeBtn.addEventListener("click", () => dislikeCurrent(card));

    // choix A/B (immersion — sélection visuelle uniquement)
    card.querySelectorAll(".choice").forEach((btn) => {
      stop(btn);
      btn.addEventListener("click", () => {
        card.querySelectorAll(".choice").forEach((b) => b.classList.remove("is-chosen"));
        btn.classList.add("is-chosen");
      });
    });

    // son : accord grave « précieux » pour les délicates, glissement sinon
    if (window.Sound) { deep ? Sound.deep() : Sound.slide(); }

    gameProgress.textContent = "Carte " + (state.index + 1) + " / " + total;
    prevBtn.disabled = state.index === 0;
    nextBtn.textContent = state.index === total - 1 ? "Terminer ›" : "Suivante ›";

    enableSwipe(card);
  }

  /* ---------- Navigation entre cartes ---------- */
  function nextCard() {
    if (state.index < state.cards.length - 1) {
      state.index++;
      renderCard("enter-next");
    } else {
      goToScene();
    }
  }
  function prevCard() {
    if (state.index > 0) {
      state.index--;
      renderCard("enter-prev");
    }
  }
  function shuffleDeck() {
    if (state.cards.length === 0) return;
    state.cards = shuffle(state.cards);
    state.index = 0;
    renderCard("enter-next");
  }

  /** 👎 Masque la carte courante : elle ne réapparaîtra plus. */
  function dislikeCurrent(card) {
    addDislike(state.cards[state.index]);
    state.cards.splice(state.index, 1);
    toast("Carte masquée — vous ne la reverrez plus");

    if (state.cards.length === 0) { renderEmptyDeck(); return; }
    if (state.index >= state.cards.length) state.index = state.cards.length - 1;
    card.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    card.style.transform = "translateY(40px) scale(0.9)";
    card.style.opacity = "0";
    setTimeout(() => renderCard("enter-next"), 180);
  }

  function goToScene() {
    buildDecks();
    showScreen(scene);
  }

  /* ---------- Geste de swipe (pointer events) ---------- */
  function enableSwipe(card) {
    let startX = 0, startY = 0, dx = 0, dy = 0, dragging = false;

    function onDown(e) {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      card.setPointerCapture && card.setPointerCapture(e.pointerId);
      card.style.transition = "none";
    }
    function onMove(e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;
      const rot = dx / 22;
      card.style.transform = "translate(" + dx + "px," + dy * 0.25 + "px) rotate(" + rot + "deg)";
      card.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / 420));
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      card.style.transition = "transform 0.35s ease, opacity 0.35s ease";
      const threshold = 90;
      if (dx <= -threshold) {
        card.style.transform = "translateX(-120%) rotate(-12deg)";
        card.style.opacity = "0";
        setTimeout(nextCard, 180);
      } else if (dx >= threshold) {
        if (state.index > 0) {
          card.style.transform = "translateX(120%) rotate(12deg)";
          card.style.opacity = "0";
          setTimeout(prevCard, 180);
        } else {
          resetCard();
        }
      } else {
        resetCard();
      }
    }
    function resetCard() {
      card.style.transform = "";
      card.style.opacity = "";
    }

    card.addEventListener("pointerdown", onDown);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerup", onUp);
    card.addEventListener("pointercancel", onUp);
  }

  /* =============================================================
     ÉCRAN 4 — MES FAVORIS
     ============================================================= */
  function openFavorites() {
    renderFavorites();
    showScreen(favorites);
  }
  function renderFavorites() {
    const n = likes.length;
    favSubtitle.textContent =
      n === 0 ? "Aucune question enregistrée"
              : n + (n > 1 ? " questions enregistrées" : " question enregistrée");

    dislikeCountEl.textContent = String(dislikes.length);
    restoreBtn.hidden = dislikes.length === 0;

    favList.innerHTML = "";
    if (n === 0) {
      favList.innerHTML =
        '<p class="fav-empty">Vos questions favorites apparaîtront ici.<br>' +
        "Touchez le ♥ sur une carte pour l'enregistrer.</p>";
      return;
    }
    likes.slice().reverse().forEach((item) => {
      const deep = item.depth === "deep";
      const li = document.createElement("div");
      li.className = "fav-item" + (deep ? " fav-item--deep" : "");
      li.setAttribute("role", "listitem");
      li.innerHTML =
        '<span class="fav-item__pip" aria-hidden="true"></span>' +
        '<div class="fav-item__body">' +
        '  <p class="fav-item__text">' + esc(item.text) + "</p>" +
        '  <div class="fav-item__meta">' +
        '    <span class="fav-item__theme">' + esc(item.theme || "") + "</span>" +
        '    <span class="fav-item__badge">' + esc(depthLabel(item.depth || "soft")) + "</span>" +
        "  </div>" +
        "</div>" +
        '<button class="fav-item__remove" type="button" aria-label="Retirer des favoris" title="Retirer">✕</button>';
      li.querySelector(".fav-item__remove").addEventListener("click", () => {
        removeLike(item.text);
        renderFavorites();
      });
      favList.appendChild(li);
    });
  }

  /* ---------- Transition d'entrée (lever de rideau) ---------- */
  function raiseCurtain() {
    window.Sound && Sound.curtain();
    splash.classList.add("is-opening");
    setTimeout(() => {
      showScreen(scene);
      splash.classList.remove("is-opening");
    }, 1500);
  }

  /* ---------- Réglages : son, mode, filtre ---------- */
  function toggleSound() {
    const on = window.Sound ? Sound.toggle() : false;
    soundToggle.setAttribute("aria-pressed", String(on));
    soundToggle.querySelector(".chip__icon").textContent = on ? "🔊" : "🔈";
  }
  function setMode(mode) {
    state.mode = mode;
    modeButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.mode === mode));
  }
  function setFilter(depth) {
    state.filter = depth;
    depthButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.depth === depth));
    buildDecks();
  }

  /* ---------- Clavier (accessibilité) ---------- */
  function onKey(e) {
    if (game.classList.contains("is-active")) {
      if (e.key === "ArrowLeft") { e.preventDefault(); prevCard(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); nextCard(); }
      else if (e.key === "Escape") { goToScene(); }
    } else if (favorites.classList.contains("is-active")) {
      if (e.key === "Escape") { showScreen(scene); }
    } else if (splash.classList.contains("is-active")) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); raiseCurtain(); }
    }
  }

  /* ---------- Câblage des événements ---------- */
  enterBtn.addEventListener("click", raiseCurtain);
  backBtn.addEventListener("click", goToScene);
  shuffleBtn.addEventListener("click", shuffleDeck);
  nextBtn.addEventListener("click", nextCard);
  prevBtn.addEventListener("click", prevCard);
  soundToggle.addEventListener("click", toggleSound);
  modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  depthButtons.forEach((b) => b.addEventListener("click", () => setFilter(b.dataset.depth)));
  favOpenBtn.addEventListener("click", openFavorites);
  favBackBtn.addEventListener("click", () => showScreen(scene));
  restoreBtn.addEventListener("click", () => {
    restoreDislikes();
    buildDecks();
    renderFavorites();
    toast("Cartes masquées restaurées");
  });
  document.addEventListener("keydown", onKey);

  /* ---------- Démarrage ---------- */
  loadData();
})();
