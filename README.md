# 🎭 Démasque

> _Levez le rideau sur vos vérités._

**Démasque** est une application web de **débats et dilemmes** à faire entre amis,
en famille, entre inconnus ou même seul. Les questions s'affichent sous forme de
**cartes à swiper**, regroupées en **jeux de cartes thématiques**.

L'expérience s'inspire de l'entrée d'un vieux théâtre / cinéma américain des
années 40-50 : rideau de velours rouge, spot de lumière, enseigne lumineuse
dorée à ampoules scintillantes. Intime, chaleureux, spectaculaire — jamais froid
ni corporate.

Application **100 % statique** (HTML / CSS / JavaScript vanilla), sans backend ni
base de données, prête à déployer sur **GitHub Pages**.

---

## ✨ Fonctionnalités

- **Écran d'accueil** : rideau de théâtre fermé, logo mis en lumière par un spot,
  nom de l'app en enseigne lumineuse (effet _marquee_), bouton « Lever de rideau ».
- **Transition d'entrée** : les deux pans du rideau s'écartent (~1,5 s) pour
  révéler la scène.
- **La Scène** : les thèmes apparaissent comme des **paquets de cartes empilés**,
  parcourables horizontalement (swipe / scroll).
- **Mode jeu** : cartes de dilemmes une par une, **swipeables** (glisser à gauche =
  suivante, à droite = précédente), design de carte à jouer premium (liseré doré,
  numéro de carte).
- **Mode solo & mode groupe** (passage de l'appareil / lecture à voix haute).
- **Mélange (shuffle)** du paquet, **compteur de progression**, boutons
  précédente / suivante, retour à la scène.
- **Sons discrets optionnels** (ouverture de rideau, glissement de carte),
  synthétisés à la volée via la Web Audio API — aucun fichier audio à héberger.
- **Accessibilité** : navigation clavier (`Entrée`, `←`, `→`, `Échap`), focus
  visible, contrastes soutenus, prise en charge de `prefers-reduced-motion`.
- **Responsive** : pensé mobile d'abord, propre sur desktop.

---

## 📁 Structure du projet

```
/
├── index.html          Point d'entrée, structure des 3 écrans
├── assets/
│   ├── logo.svg        Masques comédie/tragédie (fond transparent)
│   └── sounds/         (optionnel) vos propres fichiers audio
├── css/
│   └── styles.css      Direction artistique complète (rideau, or, cartes)
├── js/
│   ├── sound.js        Moteur sonore Web Audio (rideau + glissement)
│   └── app.js          Navigation et logique de jeu
├── questions.json      Données : thèmes + questions (facile à éditer)
└── README.md
```

---

## 🚀 Lancer en local

Le fichier `questions.json` est chargé via `fetch()` : un simple double-clic sur
`index.html` (protocole `file://`) sera **bloqué par le navigateur**. Servez le
dossier avec n'importe quel serveur statique :

```bash
# Python 3
python3 -m http.server 8000

# ou Node
npx serve .

# ou l'extension « Live Server » de VS Code
```

Puis ouvrez <http://localhost:8000>.

---

## 🌐 Déployer sur GitHub Pages

1. Poussez le dépôt sur GitHub (branche `main`).
2. **Settings → Pages**.
3. **Source** : `Deploy from a branch`.
4. **Branch** : `main` / dossier `/ (root)`, puis **Save**.
5. L'URL publique apparaît après une minute :
   `https://<votre-utilisateur>.github.io/<nom-du-depot>/`

Aucune étape de build : les fichiers sont servis tels quels.

---

## ✏️ Ajouter ou modifier des questions

Tout se passe dans **`questions.json`**. Chaque thème est un objet du tableau
`themes` :

```json
{
  "id": "amis",
  "title": "Entre Amis",
  "subtitle": "Pour rire, se chamailler et se découvrir",
  "icon": "🎭",
  "accent": "#C9A24B",
  "cards": [
    "Votre première question…",
    "Votre deuxième question…"
  ]
}
```

- **Ajouter une question** : ajoutez une chaîne au tableau `cards`.
- **Ajouter un thème** : copiez un bloc de thème, changez `id` (unique), `title`,
  `subtitle`, `icon` (emoji) et remplissez `cards`. Il apparaît automatiquement
  comme un nouveau paquet sur la scène.

Aucun code à toucher : l'interface se reconstruit à partir du JSON.

---

## 🎨 Personnaliser l'ambiance

Les couleurs et rayons sont centralisés dans les **variables CSS** en haut de
`css/styles.css` (`:root`) : rouges rideau, noir velours, or discret. Ajustez-les
pour décliner le thème.

Pour remplacer les sons synthétisés par vos propres fichiers, déposez-les dans
`assets/sounds/` et adaptez `js/sound.js`.

---

## 🛠️ Détails techniques

- HTML / CSS / JavaScript **vanilla**, aucune dépendance ni étape de build.
- Animations en **CSS** (rideau, marquee, particules) et transformations pointer
  pour le swipe — fluides et performantes.
- Polices via **Google Fonts** (Pinyon Script, Marcellus, Cormorant Garamond).
- Sons **synthétisés** (Web Audio API) : dépôt léger, fonctionne hors-ligne.

---

## 📜 Licence

Projet libre d'utilisation et de modification. Amusez-vous bien — et que le
rideau se lève.
