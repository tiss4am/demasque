/* =============================================================
   DÉMASQUE — Logique de l'application
   Navigation : Accueil (rideau) → Scène (thèmes) → Mode jeu (cartes).
   Vanilla JS, aucune dépendance. Données chargées depuis questions.json.
   ============================================================= */
(function () {
  "use strict";

  /* ---------- Références DOM ---------- */
  const splash = document.getElementById("splash");
  const scene = document.getElementById("scene");
  const game = document.getElementById("game");
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

  /* ---------- État ---------- */
  const state = {
    data: null,
    theme: null,       // thème sélectionné
    cards: [],         // cartes du thème courant (potentiellement mélangées)
    index: 0,          // carte affichée
    mode: "solo"       // "solo" | "groupe"
  };

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

  /** Bascule d'écran avec gestion de l'attribut hidden + classe active. */
  function showScreen(el) {
    [splash, scene, game].forEach((s) => {
      if (s === el) {
        s.hidden = false;
        // laisser un tick pour que la transition d'opacité s'applique
        requestAnimationFrame(() => s.classList.add("is-active"));
      } else {
        s.classList.remove("is-active");
        s.hidden = true;
      }
    });
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
      const deck = document.createElement("button");
      deck.className = "deck";
      deck.type = "button";
      deck.setAttribute("role", "listitem");
      deck.setAttribute("aria-label", theme.title + " — " + theme.cards.length + " cartes");
      deck.innerHTML =
        '<span class="deck__face">' +
        '<span class="deck__icon" aria-hidden="true">' + theme.icon + "</span>" +
        '<h3 class="deck__title">' + theme.title + "</h3>" +
        '<p class="deck__subtitle">' + theme.subtitle + "</p>" +
        '<span class="deck__count">' + theme.cards.length + " cartes</span>" +
        "</span>";
      deck.addEventListener("click", () => openTheme(theme));
      deckRail.appendChild(deck);
    });
  }

  /* ---------- Écran 3 : ouvrir un thème ---------- */
  function openTheme(theme) {
    state.theme = theme;
    state.cards = theme.cards.slice();
    state.index = 0;
    gameTitle.textContent = theme.title;
    showScreen(game);
    renderCard("enter-next");
  }

  /** Construit la carte courante (+ deux cartes de profondeur pour l'effet pile). */
  function renderCard(animClass) {
    cardStack.innerHTML = "";

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
    const card = document.createElement("article");
    card.className = "play-card " + (animClass || "");
    const num = String(state.index + 1).padStart(2, "0");
    card.innerHTML =
      '<span class="play-card__corner play-card__corner--tl">' + num + "</span>" +
      '<span class="play-card__mark" aria-hidden="true">' + state.theme.icon + "</span>" +
      '<p class="play-card__text">' + state.cards[state.index] + "</p>" +
      '<span class="play-card__theme">' + state.theme.title + "</span>" +
      '<span class="play-card__corner play-card__corner--br">' + num + "</span>";
    cardStack.appendChild(card);

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
      // fin du paquet → retour à la scène
      goToScene();
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
    state.cards = shuffle(state.cards);
    state.index = 0;
    window.Sound && Sound.slide();
    renderCard("enter-next");
  }
  function goToScene() {
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
        // glissé vers la gauche → carte suivante
        card.style.transform = "translateX(-120%) rotate(-12deg)";
        card.style.opacity = "0";
        setTimeout(nextCard, 180);
      } else if (dx >= threshold) {
        // glissé vers la droite → carte précédente
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

  /* ---------- Transition d'entrée (lever de rideau) ---------- */
  function raiseCurtain() {
    window.Sound && Sound.curtain();
    splash.classList.add("is-opening");
    // durée alignée sur l'animation CSS (~1,5 s)
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
  document.addEventListener("keydown", onKey);

  /* ---------- Démarrage ---------- */
  loadData();
})();
