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
- **♥ J'aime / 👎 Je passe** sur chaque carte :
  - le **♥** enregistre la question dans **« Mes Favoris »** pour la retrouver
    plus tard (écran dédié, accessible depuis la Scène) ;
  - le **👎** masque la carte : elle ne réapparaîtra plus dans le paquet.
  - Les deux sont **persistés** dans le navigateur (`localStorage`), et l'on peut
    **restaurer les cartes masquées** depuis l'écran Favoris.
- **Filtre de profondeur** : chaque question est marquée `soft` (**légère**) ou
  `deep` (**délicate**). Sur la Scène, un filtre **Toutes / Légères / Délicates**
  ajuste les paquets et les compteurs.
- **Cartes délicates mises en valeur** : halo rouge pulsé, reflet « précieux »
  qui balaie la carte, badge ◆ Délicate, et un **son grave et dramatique**
  distinct (au lieu du simple glissement).
- **Dilemmes moraux immersifs** : ce thème utilise une **mise en page « scénario »**
  (récit posé à la 1ʳᵉ lettre ornée, situation détaillée, puis deux choix A / B
  sélectionnables) pour plonger le joueur dans la situation.
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
│   ├── logo.png        Masques comédie/tragédie (fond transparent)
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

Tout se passe dans **`questions.json`**. Chaque question porte une profondeur
`depth` : `"soft"` (légère) ou `"deep"` (délicate, mise en valeur et jouée avec
un son dramatique).

**Thème classique** (`"layout": "question"`) :

```json
{
  "id": "amis",
  "title": "Entre Amis",
  "subtitle": "Pour rire, se chamailler et se découvrir",
  "layout": "question",
  "cards": [
    { "text": "Votre première question…", "depth": "soft" },
    { "text": "Une question plus intime…", "depth": "deep" }
  ]
}
```

**Thème « scénario »** (`"layout": "scenario"`, utilisé par les Dilemmes) :

```json
{
  "id": "dilemmes",
  "title": "Dilemmes Moraux",
  "subtitle": "Entrez dans la scène.",
  "layout": "scenario",
  "cards": [
    {
      "depth": "deep",
      "setup": "Le récit immersif qui plante la situation…",
      "question": "La question qui tranche ?",
      "optionA": "Premier choix",
      "optionB": "Second choix"
    }
  ]
}
```

- **Ajouter une question** : ajoutez un objet au tableau `cards` (avec `depth`).
- **Ajouter un thème** : copiez un bloc de thème, changez `id` (unique), `title`,
  `subtitle`, choisissez le `layout`, et remplissez `cards`. Il apparaît
  automatiquement comme un nouveau paquet sur la Scène.
- Les libellés des profondeurs se règlent dans `depthLabels` en haut du fichier.

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
