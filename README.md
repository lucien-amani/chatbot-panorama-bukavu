# Panorama Assist - Assistant Client IA pour l'Hôtellerie

**Panorama Assist** (anciennement Karibot) est un système d'assistance client multilingue basé sur l'Intelligence Artificielle, conçu spécifiquement pour les établissements hôteliers, avec un cas d'usage ciblé pour l'Hôtel Panorama à Bukavu.

Ce projet s'inscrit dans le cadre du sujet : **« Développement d'un système multilingue d'assistance client basé sur l'IA pour les hôtels dans les pays à faible revenu »**.

---

## 🌟 Objectifs & Philosophie

Panorama Assist vise à rendre l'assistance client accessible aux établissements hôteliers qui ont des contraintes financières et techniques :

- **Économique :** Coûts d'infrastructure réduits en s'appuyant sur des options gratuites ou peu coûteuses.
- **Accessible :** Déploiement simple sans besoin immédiat de services cloud payants ni de cartes bancaires internationales pour la phase de démarrage.
- **Premium :** Interface utilisateur moderne et élégante inspirée des codes de l'hôtellerie de luxe.

---

## ✨ Fonctionnalités Clés

- Chatbot intelligent multilingue (FR/EN/SW/ln) alimenté par Gemini
- Support audio : reconnaissance vocale (STT) et synthèse vocale (TTS) via Web Speech API
- Interface responsive et mobile-first avec barre de navigation inférieure
- Rendu Markdown avec mise en forme et blocs de code copiables
- Gestion d'historique des conversations (stockage local) et sessions multi-chats
- Gestion simple des clés API et mécanisme d'avertissement en cas de quotas atteints
- Persona métier (instructions système) pour contextualiser les réponses au service de l'hôtel

---

## 🛠️ Stack Technique

- Frontend : React 19, Vite
- Styling : Tailwind CSS, Lucide / Heroicons
- SDK IA : `@google/genai` (Gemini)
- Backend & données : PocketBase / Prisma & SQLite (selon configuration)
- Synthèse et reconnaissance vocale : Web Speech API (navigateur)
- Outils de développement : ESLint

Composition des langages du projet (analyse du dépôt) :

- JavaScript : 72.5%
- CSS : 25.9%
- Shell : 1.1%
- Other : 0.5%

---

## 🚀 Dernières Mises à Jour

- Migration/adaptation pour utiliser le SDK `@google/genai` et les modèles Gemini (version récente : Gemini 3.5 Flash dans les fichiers de configuration).
- Refonte UI/UX : nouvelle charte Panorama Assist, icônes Lucide/Heroicons, barre de navigation mobile.
- Consolidation du backend : modèles Prisma, préparation pour intégration PocketBase/SQLite.
- Améliorations STT/TTS : intégration robuste via Web Speech API et adaptation automatique de la langue.
- Nettoyage du README et suppression des marqueurs de conflit présents dans le repo.

---

## 💻 Prérequis

- Node.js (recommandé v18+)
- npm (ou yarn)
- Un compte Google pour créer une clé API Gemini via Google AI Studio si vous souhaitez utiliser votre propre quota

---

## Installation et Démarrage

1. Cloner le dépôt :

```bash
git clone https://github.com/lucien-amani/chatbot-panorama-bukavu.git
cd chatbot-panorama-bukavu
npm install
```

2. Configuration des variables d'environnement

Créez un fichier `.env` ou `.env.local` à la racine et ajoutez (ou collez) votre clé Gemini :

```env
VITE_GEMINI_API_KEY=VOTRE_CLE_GEMINI
```

Le projet propose aussi un mécanisme pour entrer une clé API personnalisée directement depuis l'interface (stockage local) pour augmenter les quotas si nécessaire.

3. Lancer en développement :

```bash
npm run dev
```

L'application est généralement accessible sur http://localhost:5173

---

## Commandes utiles

```bash
# Démarrer le serveur de développement
npm run dev

# Construire pour la production
npm run build

# Prévisualiser la build
npm run preview

# Linter
npm run lint
```

---

## Architecture & Fichiers Clés

Arborescence principale :

```
chatbot-panorama-bukavu/
├── public/
│   └── panorama.png
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── gemini.js
│   ├── useChat.js
│   └── assets/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

Fichiers importants :

- `src/App.jsx` : interface principale, gestion des messages, thèmes, historique et composants UI
- `src/gemini.js` : wrapper / configuration pour communiquer avec l'API Gemini (`@google/genai`)
- `src/useChat.js` : hook React pour l'envoi de messages, streaming et gestion d'état

---

## Utilisation

- Écrire ou dicter une question, appuyer sur Entrée ou cliquer sur Envoyer.
- Les réponses sont streamées (amélioration UX) et rendues en Markdown.
- Boutons pour écouter (TTS), copier le code, ou sauvegarder une session.
- Gestion simple des quotas : si la clé par défaut est limitée, entrez votre clé personnalisée dans l'UI.

---

## Sécurité et bonnes pratiques

- Ne commitez jamais de clés API dans le dépôt.
- Utilisez HTTPS en production.
- Validez et nettoyez les entrées utilisateur côté frontend et (si présent) backend.
- Pour la production, stockez les clés côté serveur ou via secrets de la plateforme d'hébergement.

---

## Déploiement

- Build : `npm run build` (génère `dist/`)
- Déploiement simple sur Vercel ou Netlify (le detecteur Vite fonctionne automatiquement)

Recommandation vite.config.js pour production :

```javascript
// vite.config.js
export default {
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
}
```

---

## Dépannage

- STT/TTS ne fonctionnent pas : vérifier permissions micro, navigateur supporté (Chrome, Safari, Edge), et recharger.
- Erreurs Gemini (quota 429) : entrer une clé API personnalisée ou attendre le renouvellement.
- Historique perdu au rechargement : implémenter un backend pour persistance si besoin.

---

## Contribution

1. Forkez le dépôt
2. Créez une branche : `git checkout -b feature/ma-fonctionnalite`
3. Committez et poussez
4. Ouvrez une Pull Request

Idées d'amélioration : stockage backend pour l'historique, intégration réservation réelle, dashboards admin, analytics de conversation, support de langues additionnelles.

---

## Ressources

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Google Gemini / GenAI](https://ai.google.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Web Speech API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

## Licence & Contact

Ce projet est développé pour l'Hôtel Panorama Bukavu.

- Repository : https://github.com/lucien-amani/chatbot-panorama-bukavu
- Contact : support@hotelapanorama.cd

---

*README mis à jour : harmonisation des sections, suppression des conflits et actualisation de la stack technique.*
