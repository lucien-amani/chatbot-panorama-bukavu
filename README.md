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
- Backend & données : PocketBase / Prisma & SQLite (voir note ci‑dessous)
- Synthèse et reconnaissance vocale : Web Speech API (navigateur)
- Outils de développement : ESLint

Composition des langages du projet (analyse du dépôt) :

- JavaScript : 72.5%
- CSS : 25.9%
- Shell : 1.1%
- Other : 0.5%

---

## 🔎 Base de données (Important)

Le backend principal (`panorama-backend/`) utilise PostgreSQL via Prisma. Les fichiers importants sont :

- `panorama-backend/prisma/schema.prisma` — datasource configurée avec `provider = "postgresql"` et `url = env("DATABASE_URL")`.
- `setup-postgres.sh` — script d'installation/initialisation PostgreSQL (création de la base, utilisateur, migrations et seed).

NOTE : Il existe également un fichier `prisma/schema.prisma` à la racine du dépôt (legacy) qui est configuré pour SQLite. Ce fichier est conservé pour des scénarios locaux simples mais **ne doit pas** être utilisé pour les migrations/production du backend. Voir la section "Notes Prisma" plus bas.

---

## 🧩 Configuration de la variable DATABASE_URL

Pour connecter le backend à PostgreSQL, définissez la variable d'environnement `DATABASE_URL`. Exemple de valeur :

```text
DATABASE_URL=postgresql://panorama_user:panorama2026@localhost:5432/panorama_bukavu?schema=public
```

Options pour définir la variable :

- Créez un fichier `.env` ou `.env.local` à la racine du projet (ou dans `panorama-backend/`, selon votre workflow) et ajoutez la ligne ci‑dessus (en remplaçant l'utilisateur, mot de passe, hôte et port).
- Exportez temporairement dans votre shell :

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public"
```

---

## 🚀 Initialiser PostgreSQL et appliquer les migrations

1. Assurez-vous d'avoir PostgreSQL installé et le service en cours d'exécution.
2. Exécutez le script d'installation fourni (il crée la base et l'utilisateur, installe les dépendances backend, applique les migrations Prisma et lance le seed) :

```bash
bash setup-postgres.sh
```

3. Si vous préférez appliquer manuellement les migrations, placez `DATABASE_URL` dans votre environnement puis exécutez depuis `panorama-backend/` :

```bash
cd panorama-backend
npx prisma migrate deploy --schema=./prisma/schema.prisma
node prisma/seed.js
```

---

## 💻 Prérequis

- Node.js (recommandé v18+)
- npm (ou yarn)
- PostgreSQL (si vous activez le backend PostgreSQL)
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

Créez un fichier `.env` ou `.env.local` à la racine et ajoutez (ou collez) votre clé Gemini et la DATABASE_URL si vous utilisez PostgreSQL :

```env
VITE_GEMINI_API_KEY=VOTRE_CLE_GEMINI
DATABASE_URL=postgresql://panorama_user:panorama2026@localhost:5432/panorama_bukavu?schema=public
VITE_API_URL=http://localhost:5000
```

3. Lancer en développement (frontend) :

```bash
npm run dev
```

Si vous utilisez le backend local (`panorama-backend/`), démarrez-le séparément :

```bash
cd panorama-backend
npm install
npm run dev
```

---

## Commandes utiles

```bash
# Démarrer le serveur de développement frontend
npm run dev

# Démarrer le backend (depuis panorama-backend/)
cd panorama-backend && npm run dev

# Construire pour la production (frontend)
npm run build

# Linter
npm run lint
```

---

## Notes Prisma

- Backend (production / dev réel) : utilisez le fichier `panorama-backend/prisma/schema.prisma` (provider = postgresql). Placez `DATABASE_URL` dans votre environnement avant d'exécuter les migrations.
- Fichier root `prisma/schema.prisma` : maintenu comme fichier utile pour des tests locaux rapides (SQLite). Il est volontairement conservé mais **n'est pas** celui utilisé par le backend principal. Évitez d'exécuter des migrations depuis ce schéma si votre intention est de modifier la base PostgreSQL du backend.

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
- Problèmes de DB : vérifiez `DATABASE_URL`, exécutez `bash setup-postgres.sh` et consultez les logs du backend.

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

*README mis à jour : clarification sur l'utilisation de PostgreSQL pour le backend et instructions pour configurer DATABASE_URL.*
