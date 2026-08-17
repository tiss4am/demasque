/* =============================================================
   DÉMASQUE — Logique de l'application
   Navigation : Accueil (rideau) → Scène (thèmes) → Mode jeu (cartes).
   + Favoris (♥) et cartes masquées (👎), persistés via localStorage.
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
  const favFooter = document.querySelector(".fav-footer");
  const restoreBtn = document.getElementById("restore-dislikes");
  const dislikeCountEl = document.getElementById("dislike-count");

  /* ---------- État ---------- */
  const state = {
    data: null,
    theme: null,       // thème sélectionné
    cards: [],         // cartes du thème courant (filtrées / mélangées)
    index: 0,          // carte affichée
    mode: "solo"       // "solo" | "groupe"
  };

  /* =============================================================
     STOCKAGE — favoris & cartes masquées (localStorage)
     Les cartes sont identifiées par leur texte (stable au mélange).
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

  let likes = readJSON(LIKES_KEY, []);       // [{ text, themeId, theme, icon }]
  let dislikes = readJSON(DISLIKES_KEY, []); // [ text ]

  const isLiked = (text) => likes.some((l) => l.text === text);
  const isDisliked = (text) => dislikes.indexOf(text) !== -1;

  function toggleLike(text) {
    if (isLiked(text)) {
      likes = likes.filter((l) => l.text !== text);
    } else {
      likes.push({
        text: text,
        themeId: state.theme.id,
        theme: state.theme.title,
        icon: state.theme.icon
      });
    }
    writeJSON(LIKES_KEY, likes);
    updateFavCount();
    return isLiked(text);
  }

  function addDislike(text) {
    if (!isDisliked(text)) dislikes.push(text);
    likes = likes.filter((l) => l.text !== text); // une carte masquée quitte les favoris
    writeJSON(DISLIKES_KEY, dislikes);
    writeJSON(LIKES_KEY, likes);
    updateFavCount();
  }
  function removeLike(text) {
    likes = likes.filter((l) => l.text !== text);
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

  /* ---------- Utilitaires ---------- */

  /** Mélange de Fisher-Yates (copie non destructive). */
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

  /** Bascule d'écran avec gestion de l'attribut hidden + classe active. */
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

  /** Petite notification éphémère (feedback like / masquage). */
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
    // reflow pour rejouer la transition
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

  /* ---------- Écran 2 : construire les paquets ---------- */
  function buildDecks() {
    deckRail.innerHTML = "";
    state.data.themes.forEach((theme) => {
      const available = theme.cards.filter((c) => !isDisliked(c)).length;
      const deck = document.createElement("button");
      deck.className = "deck";
      deck.type = "button";
      deck.setAttribute("role", "listitem");
      deck.setAttribute("aria-label", theme.title + " — " + available + " cartes");
      deck.innerHTML =
        '<span class="deck__face">' +
        '<span class="deck__icon" aria-hidden="true">' + theme.icon + "</span>" +
        '<h3 class="deck__title">' + esc(theme.title) + "</h3>" +
        '<p class="deck__subtitle">' + esc(theme.subtitle) + "</p>" +
        '<span class="deck__count">' + available + " cartes</span>" +
        "</span>";
      deck.addEventListener("click", () => openTheme(theme));
      deckRail.appendChild(deck);
    });
  }

  /* ---------- Écran 3 : ouvrir un thème ---------- */
  function openTheme(theme) {
    state.theme = theme;
    state.cards = theme.cards.filter((c) => !isDisliked(c));
    state.index = 0;
    gameTitle.textContent = theme.title;
    showScreen(game);
    if (state.cards.length === 0) {
      renderEmptyDeck();
    } else {
      renderCard("enter-next");
    }
  }

  /** Affiche un état vide si toutes les cartes du thème sont masquées. */
  function renderEmptyDeck() {
    cardStack.innerHTML =
      '<article class="play-card play-card--empty">' +
      '<span class="play-card__mark" aria-hidden="true">🎭</span>' +
      '<p class="play-card__text">Toutes les cartes de ce thème sont masquées.</p>' +
      '<p class="play-card__theme">Restaurez-les depuis « Mes Favoris »</p>' +
      "</article>";
    gameProgress.textContent = "0 carte";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  }

  /** Construit la carte courante (+ deux cartes de profondeur pour l'effet pile). */
  function renderCard(animClass) {
    cardStack.innerHTML = "";
    nextBtn.disabled = false;

    // cartes de fond (décoratives) pour donner l'épaisseur du paquet
    for (let d = 2; d >= 1; d--) {
      if (state.index + d < state.cards.length) {
        const ghost = document.createElement("div");
        ghost.className = "play-card is-behind-" + d;
        ghost.setAttribute("aria-hidden", "true");
        cardStack.appendChild(ghost);
      }
    }

    const total = state.cards.length;
    const text = state.cards[state.index];
    const liked = isLiked(text);
    const card = document.createElement("article");
    card.className = "play-card " + (animClass || "");
    const num = String(state.index + 1).padStart(2, "0");
    card.innerHTML =
      '<span class="play-card__corner play-card__corner--tl">' + num + "</span>" +
      '<span class="play-card__mark" aria-hidden="true">' + state.theme.icon + "</span>" +
      '<p class="play-card__text">' + esc(text) + "</p>" +
      '<span class="play-card__theme">' + esc(state.theme.title) + "</span>" +
      '<span class="play-card__corner play-card__corner--br">' + num + "</span>" +
      '<div class="card-actions">' +
      '  <button class="card-act card-act--dislike" type="button" title="Ne plus voir cette carte" aria-label="Masquer cette carte">👎</button>' +
      '  <button class="card-act card-act--like' + (liked ? " is-active" : "") + '" type="button" ' +
      '    aria-pressed="' + (liked ? "true" : "false") + '" title="Enregistrer dans mes favoris" aria-label="Ajouter aux favoris">♥</button>' +
      "</div>";
    cardStack.appendChild(card);

    // Actions like / dislike — on stoppe la propagation pour ne pas déclencher le swipe
    const likeBtn = card.querySelector(".card-act--like");
    const dislikeBtn = card.querySelector(".card-act--dislike");
    ["pointerdown", "pointerup", "pointermove"].forEach((ev) => {
      likeBtn.addEventListener(ev, (e) => e.stopPropagation());
      dislikeBtn.addEventListener(ev, (e) => e.stopPropagation());
    });
    likeBtn.addEventListener("click", () => {
      const nowLiked = toggleLike(text);
      likeBtn.classList.toggle("is-active", nowLiked);
      likeBtn.setAttribute("aria-pressed", String(nowLiked));
      toast(nowLiked ? "♥ Enregistrée dans vos favoris" : "Retirée des favoris");
    });
    dislikeBtn.addEventListener("click", () => dislikeCurrent(card));

    gameProgress.textContent = "Carte " + (state.index + 1) + " / " + total;
    prevBtn.disabled = state.index === 0;
    nextBtn.textContent = state.index === total - 1 ? "Terminer ›" : "Suivante ›";

    enableSwipe(card);
  }

  /* ---------- Navigation entre cartes ---------- */
  function nextCard() {
    if (state.index < state.cards.length - 1) {
      state.index++;
      window.Sound && Sound.slide();
      renderCard("enter-next");
    } else {
      goToScene(); // fin du paquet → retour à la scène
    }
  }
  function prevCard() {
    if (state.index > 0) {
      state.index--;
      window.Sound && Sound.slide();
      renderCard("enter-prev");
    }
  }
  function shuffleDeck() {
    if (state.cards.length === 0) return;
    state.cards = shuffle(state.cards);
    state.index = 0;
    window.Sound && Sound.slide();
    renderCard("enter-next");
  }

  /** 👎 Masque la carte courante : elle ne réapparaîtra plus. */
  function dislikeCurrent(card) {
    const text = state.cards[state.index];
    addDislike(text);
    state.cards.splice(state.index, 1);
    toast("Carte masquée — vous ne la reverrez plus");
    window.Sound && Sound.slide();

    if (state.cards.length === 0) {
      renderEmptyDeck();
      return;
    }
    if (state.index >= state.cards.length) state.index = state.cards.length - 1;
    // petite animation de sortie puis rendu de la suivante
    card.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    card.style.transform = "translateY(40px) scale(0.9)";
    card.style.opacity = "0";
    setTimeout(() => renderCard("enter-next"), 180);
  }

  function goToScene() {
    buildDecks(); // rafraîchit les compteurs (cartes masquées/restaurées)
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
    // sous-titre
    const n = likes.length;
    favSubtitle.textContent =
      n === 0 ? "Aucune question enregistrée"
              : n + (n > 1 ? " questions enregistrées" : " question enregistrée");

    // bouton de restauration des cartes masquées
    dislikeCountEl.textContent = String(dislikes.length);
    restoreBtn.hidden = dislikes.length === 0;

    // liste
    favList.innerHTML = "";
    if (n === 0) {
      favList.innerHTML =
        '<p class="fav-empty">Vos questions favorites apparaîtront ici.<br>' +
        "Touchez le ♥ sur une carte pour l'enregistrer.</p>";
      return;
    }
    likes.slice().reverse().forEach((item) => {
      const li = document.createElement("div");
      li.className = "fav-item";
      li.setAttribute("role", "listitem");
      li.innerHTML =
        '<span class="fav-item__icon" aria-hidden="true">' + (item.icon || "🎭") + "</span>" +
        '<div class="fav-item__body">' +
        '<p class="fav-item__text">' + esc(item.text) + "</p>" +
        '<span class="fav-item__theme">' + esc(item.theme || "") + "</span>" +
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

  /* ---------- Réglages : son & mode ---------- */
  function toggleSound() {
    const on = window.Sound ? Sound.toggle() : false;
    soundToggle.setAttribute("aria-pressed", String(on));
    soundToggle.querySelector(".chip__icon").textContent = on ? "🔊" : "🔈";
  }
  function setMode(mode) {
    state.mode = mode;
    modeButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.mode === mode));
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
