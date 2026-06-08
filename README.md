# Panorama Assist - Assistant Client IA pour l'Hôtellerie

**Panorama Assist** (anciennement Karibot) est un système d'assistance client multilingue basé sur l'Intelligence Artificielle, conçu spécifiquement pour les établissements hôteliers dans les pays à faible revenu. 

Ce projet s'inscrit dans le cadre du sujet : **« Développement d'un système multilingue d'assistance client basé sur l'IA pour les hôtels dans les pays à faible revenu »** (*Development of a multi-lingual AI based customer care system for hotels in low-income countries*).

---

## 🌟 Objectifs & Philosophie

Dans les pays à faible revenu, les établissements hôteliers font face à des barrières financières et technologiques importantes. Panorama Assist relève ce défi en proposant une solution :
* **Économique :** Coûts d'infrastructure proches de zéro grâce à l'utilisation intelligente de plans gratuits.
* **Accessible :** Pas besoin de configurations cloud complexes ou de cartes bancaires internationales pour le déploiement de base.
* **Premium :** Une interface utilisateur élégante et moderne inspirée des codes de l'hôtellerie de luxe pour rehausser l'expérience client.

---

## ✨ Fonctionnalités Clés

* **Chatbot Intelligent Multilingue :** Réponses adaptées, contextuelles et multilingues fournies par les modèles Gemini.
* **Support Audio (Text-to-Speech) :** Synthèse vocale intégrée pour rendre l'assistance accessible à tous les profils de clients.
* **Interface Premium & Responsive :** Design épuré, navigation fluide par barre inférieure (bottom navigation bar) sur mobile, et composants modernes (pills d'entrée).
* **Base de Connaissances Intégrée :** Injection automatique du contexte de l'hôtel dans les requêtes de l'IA pour des réponses précises sur les services, chambres et horaires.
* **Système d'Authentification Sécurisé :** Gestion des accès pour les administrateurs de l'hôtel.

---

## 🛠️ Stack Technique

* **Frontend :** React 19, Vite, Tailwind CSS, Lucide Icons
* **Moteur d'IA :** SDK `@google/genai` via **Google AI Studio (Gemini 1.5 Flash)**
* **Backend & Données :** PocketBase / Prisma & SQLite
* **Synthèse Vocale :** Web Speech API (exécutée localement sur le navigateur du client, sans coût d'API)

---

## 🚀 Dernières Mises à Jour

### 1. Pivot Architectural : De Google Cloud à Google AI Studio
Face aux contraintes de facturation de Google Cloud Platform (exigence d'une carte de crédit internationale, configuration IAM complexe), le projet a été migré avec succès vers **Google AI Studio**. 
* **Bénéfice :** Accès immédiat via une simple clé API gratuite (jusqu'à 15 requêtes/minute), éliminant toute barrière financière à l'entrée.

### 2. Refonte Graphique (UI/UX)
* Transformation de l'identité visuelle du chatbot vers la charte **Panorama Assist** (style luxe et épuré).
* Intégration de la bibliothèque d'icônes Heroicons v2 / Lucide pour une expérience visuelle moderne.
* Implémentation d'une barre de navigation inférieure personnalisée pour les appareils mobiles.

### 3. Consolidation du Backend & Authentification
* Migration et structuration des modèles de données avec Prisma.
* Sécurisation des accès administrateurs par authentification email/mot de passe.

---

## 💻 Installation et Démarrage

### Prérequis
* Node.js (v18+)
* Un compte Google pour obtenir une clé API gratuite sur [Google AI Studio](https://aistudio.google.com/)

### Étape 1 : Cloner le dépôt et installer les dépendances
```bash
git clone https://github.com/lucien-amani/chatbot-panorama-bukavu.git
cd chatbot-panorama-bukavu
npm install
```

### Étape 2 : Configurer les variables d'environnement
Créez un fichier `.env` à la racine du projet et ajoutez votre clé Gemini API :
```env
VITE_GEMINI_API_KEY=votre_cle_api_google_ai_studio
```

### Étape 3 : Lancer l'application en mode développement
```bash
npm run dev
```
=======
# Panorama Assist - Chatbot pour Hôtel Panorama Bukavu

Panorama Assist est un assistant virtuel alimenté par l'IA Gemini conçu pour fournir une assistance de haut standing aux clients de l'Hôtel Panorama à Bukavu, en République Démocratique du Congo. Cette application web moderne offre des réponses intelligentes sur les réservations de chambres, les services de restauration, les protocoles d'accueil, et bien d'autres services hôteliers.

## Caractéristiques Principales

- **Assistant IA Multilingue** : Réponses intelligentes grâce à Gemini 3.5 Flash, adaptées à plusieurs langues (français, anglais, swahili, lingala)
- **Interface Moderne et Responsif** : Design élégant avec support complet des appareils mobiles et de bureau
- **Thème Sombre/Clair** : Basculement fluide entre les modes de présentation
- **Reconnaissance Vocale** : Dictez vos questions directement via la reconnaissance vocale du navigateur
- **Synthèse Vocale** : Écoutez les réponses de l'assistant lire à voix haute
- **Historique de Conversations** : Sauvegardez et accédez à toutes vos discussions précédentes
- **Rendu Markdown** : Les réponses supportent la mise en forme riche (gras, italique, listes, blocs de code)
- **Gestion des Quotas API** : Fonctionnalité de clé API personnalisée pour déverrouiller des quotas élevés
- **Code Syntax Highlighting** : Affichage formaté des blocs de code avec boutons de copie

## Stack Technologique

Ce projet utilise les technologies suivantes :

| Technologie | Utilisation | Version |
|---|---|---|
| **React** | Framework UI | 19.2.6 |
| **Vite** | Bundler de développement | 8.0.12 |
| **Tailwind CSS** | Styling utilitaire | 4.3.0 |
| **@google/genai** | SDK Gemini AI | 2.5.0 |
| **Web Speech API** | Reconnaissance et synthèse vocale | Navigateur |
| **ESLint** | Linting JavaScript | 10.3.0 |

Composition des langages du projet :
- **JavaScript** : 54.9%
- **CSS** : 43.2%
- **HTML** : 1.9%

## Installation et Configuration

### Prérequis

Avant de commencer, assurez-vous d'avoir installé :
- **Node.js** : version 16.x ou supérieure
- **npm** : inclus avec Node.js (version 8.x ou supérieure)
- **Git** : pour cloner le repository

Vérifiez vos installations :
```bash
node --version
npm --version
git --version
```

### Étape 1 : Cloner le Repository

Clonez le projet sur votre machine locale :

```bash
git clone https://github.com/lucien-amani/chatbot-panorama-bukavu.git
cd chatbot-panorama-bukavu
```

### Étape 2 : Installer les Dépendances

Naviguez dans le répertoire du projet et installez toutes les dépendances npm :

```bash
npm install
```

Cette commande :
- Télécharge tous les packages listés dans `package.json`
- Installe les dépendances principales (React, Vite, Google GenAI, Tailwind CSS)
- Installe les outils de développement (ESLint, types TypeScript)
- Crée le fichier `package-lock.json` pour verrouiller les versions

Dépendances principales installées :
- `@google/genai` : SDK officiel pour intégrer Gemini
- `react` et `react-dom` : Framework d'interface utilisateur
- `@tailwindcss/vite` : Intégration Tailwind avec Vite
- `tailwindcss` : Framework CSS utilitaire
- `lucide-react` : Bibliothèque d'icônes React (optionnel)

### Étape 3 : Configuration de la Clé API Google Gemini

Pour que l'assistant fonctionne, vous devez configurer une clé API Gemini :

#### Option A : Clé API Gratuite (Limite : 20 requêtes/jour)

1. Rendez-vous sur [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Cliquez sur "Create API key"
3. Copie automatique dans le presse-papiers
4. La clé par défaut du projet (`AIzaSyCrVHVIc9lB5_WTUktolee8J3Q3vwODFzk`) est déjà configurée pour commencer

#### Option B : Clé API Personnalisée (Quotas Plus Élevés)

1. Créez votre clé via [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Lancez l'application (voir étape suivante)
3. Une fois la limite gratuite atteinte, l'interface affichera une banneau
4. Collez votre clé API personnalisée dans le champ prévu
5. Cliquez sur "Enregistrer & Réessayer"
6. Votre clé est stockée localement dans le navigateur

### Étape 4 : Lancer le Serveur de Développement

Démarrez le serveur de développement local avec Vite :

```bash
npm run dev
```

Le serveur démarre généralement sur :
```
http://localhost:5173
```

Ouvrez cette URL dans votre navigateur. Vous devriez voir l'écran d'accueil de Panorama Assist avec les suggestions rapides.

### Étape 5 : Commandes Disponibles

Voici les principales commandes npm disponibles :

```bash
# Démarrer le serveur de développement
npm run dev

# Construire l'application pour la production
npm run build

# Prévisualiser la version construite en local
npm run preview

# Vérifier la qualité du code avec ESLint
npm run lint
```

## Architecture et Structure du Projet

### Arborescence des Fichiers

```
chatbot-panorama-bukavu/
├── public/
│   └── panorama.png              # Image de branding du logo
├── src/
│   ├── App.jsx                   # Composant principal React
│   ├── App.css                   # Styles spécifiques de l'app
│   ├── main.jsx                  # Point d'entrée React
│   ├── index.css                 # Styles globaux et Tailwind
│   ├── gemini.js                 # Configuration API Gemini
│   ├── useChat.js                # Hook personnalisé pour la gestion du chat
│   └── assets/                   # Ressources supplémentaires
├── index.html                    # Fichier HTML principal
├── package.json                  # Configuration des dépendances
├── package-lock.json             # Verrouillage des versions
├── vite.config.js                # Configuration Vite
├── eslint.config.js              # Configuration ESLint
├── Instructions.txt              # Guide d'intégration Gemini
└── README.md                     # Ce fichier
```

### Fichiers Clés et Leurs Rôles

#### `src/App.jsx` (Composant Principal - 720 lignes)

Le cœur de l'interface utilisateur. Contient :

- **Gestion de l'État Global** :
  - Messages (utilisateur et bot)
  - État de chargement
  - Session actuelle et historique
  - Thème (sombre/clair)

- **Composants Internes** :
  - `BotAvatarIcon` : Avatar du bot avec image panorama.png
  - `UserAvatarIcon` : Avatar de l'utilisateur
  - `TypingIndicator` : Animation d'écriture
  - `Message` : Bulle de message unique
  - `WelcomeScreen` : Écran d'accueil avec suggestions
  - Icônes SVG personnalisées pour les actions

- **Fonctionnalités** :
  - Rendu Markdown enrichi avec support des blocs de code copiables
  - Web Speech API pour reconnaissance vocale (STT)
  - Synthèse vocale pour lecture des réponses (TTS)
  - Gestion de barre latérale responsive
  - Gestion des erreurs de quota API

#### `src/gemini.js` (Intégration API - 65 lignes)

Gère la communication avec l'API Gemini :

- **Fonctions Principales** :
  - `getApiKey()` : Récupère la clé API (locale ou par défaut)
  - `createChatSession()` : Crée une nouvelle session de chat multi-tours
  - `sendMessageStream()` : Envoie un message et stream la réponse

- **System Instruction** : 
  - Définit le persona "Panorama Assist"
  - Instructions pour l'adaptation linguistique
  - Ton professionnel et formel
  - Génération de questions de suivi

#### `src/useChat.js` (Hook Personnalisé - 77 lignes)

Hook React pour la gestion de l'état du chat :

- **État** :
  - `messages` : Tableau des messages
  - `isLoading` : Indicateur de génération en cours
  - `error` : Message d'erreur le cas échéant

- **Fonctions** :
  - `sendMessage()` : Traite l'envoi de messages avec streaming
  - `clearChat()` : Réinitialise la conversation
  - `resetSession()` : Recrée la session Gemini

#### `src/index.css` (Styles Globaux - 22,7 KB)

Styles CSS complets incluant :

- Variables CSS personnalisées
- Thèmes sombre et clair
- Animations fluides
- Design responsive
- Support Tailwind CSS

#### `index.html` (Template HTML)

- Meta tags SEO et responsive
- Point d'entrée React avec id="root"
- Import des polices Google (Outfit, JetBrains Mono)
- Favicon avec logo panorama.png

## Utilisation de l'Application

### Écran d'Accueil

Lors du premier lancement, vous verrez :
- Logo de Panorama Assist
- Titre et description du service
- 4 suggestions rapides :
  - Réserver une chambre
  - Restauration & Repas
  - Cadre & Lac Kivu
  - Protocoles d'accueil

### Envoyer un Message

#### Par Texte

1. Cliquez dans le champ de texte en bas
2. Tapez votre question
3. Appuyez sur `Entrée` ou cliquez sur le bouton d'envoi
4. Attendez la réponse (streaming en temps réel)

Exemples de questions :
- "Quels sont les tarifs des chambres ?"
- "Proposez-vous des repas végétariens ?"
- "Quelle est la vue depuis les chambres ?"

#### Par Voix (Reconnaissance Vocale)

1. Cliquez sur le bouton microphone (icône microphone)
2. Une notification indique "Écoute en cours..."
3. Parlez clairement votre question en français
4. Le texte s'ajoute automatiquement au champ
5. Envoyez le message normalement

**Note** : La reconnaissance vocale fonctionne sur Chrome, Safari et Edge. Firefox a un support limité.

### Écouter les Réponses (Synthèse Vocale)

1. Après réception d'une réponse du bot, un bouton haut-parleur apparaît sur le message
2. Cliquez sur le haut-parleur pour écouter la réponse lue à haute voix
3. La langue de lecture s'adapte automatiquement (FR, EN, SW)
4. Cliquez à nouveau pour arrêter la lecture

### Historique et Sessions

- Chaque conversation est automatiquement enregistrée
- Cliquez sur le bouton "Historique" (haut à gauche) pour voir les discussions précédentes
- Cliquez sur une session pour la charger
- Cliquez sur "Nouveau chat" pour démarrer une conversation vierge

### Gestion des Erreurs et Quotas

#### Erreur : "Limite de quota atteinte"

L'API gratuite permet 20 requêtes par jour. Quand la limite est atteinte :

1. Une banneau rouge apparaît avec le message d'avertissement
2. Entrez votre clé API personnalisée Google Gemini
3. Cliquez sur "Enregistrer & Réessayer"
4. Vos requêtes reprendront avec le nouveau quota

#### Récupération de Votre Clé API

1. Allez sur [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Authentifiez-vous avec votre compte Google
3. Cliquez sur le bouton "Create API Key"
4. Copie automatique
5. Revenez à Panorama Assist et collez-la dans le champ

## Fonctionnement Technique de l'IA

### Flux de Réponse

```
Utilisateur tape/dicte
    ↓
Validation du message
    ↓
Ajout du message en interface
    ↓
Envoi à Gemini avec System Instruction
    ↓
Streaming de la réponse en temps réel
    ↓
Rendu Markdown de la réponse
    ↓
Affichage et options (lire, copier code, etc.)
    ↓
Sauvegarde en historique local
```

### System Instruction (Persona de l'IA)

L'assistant suit des directives strictes :

1. **Spécialisation** : Expert de l'Hôtel Panorama Bukavu
2. **Langues** : Comprend et répond dans la langue de l'utilisateur
3. **Ton** : Professionnel, formel, courtois et objectif
4. **Longueur** : Adapte la taille de ses réponses selon le contexte
5. **Questions Générales** : Réponses brèves pour les sujets non liés
6. **Suivi** : Propose toujours une question de suivi pertinente

### Modèle Utilisé

- **Modèle** : Gemini 3.5 Flash
- **Température** : 0.7 (équilibre entre créativité et précision)
- **Max Tokens** : 2048 (longueur maximale de réponse)
- **Streaming** : Activé pour une meilleure UX

## Fonctionnalités Avancées

### Rendu Markdown

Les réponses supportent :

```markdown
# Titre 1
## Titre 2
### Titre 3

**Gras** et *italique*

- Liste à puce 1
- Liste à puce 2

`code inline`

```javascript
// Bloc de code avec syntaxe
const exemple = "code";
```
```

### Web Speech API

#### Reconnaissance Vocale (STT)

- Langue détectée : Français par défaut
- Support navigateur : Chrome, Safari, Edge
- Conversion audio → texte automatique
- Gestion des erreurs et timeouts

#### Synthèse Vocale (TTS)

- Détection automatique de la langue du texte
- Support du français, anglais, swahili
- Vitesse et volume ajustables du navigateur
- Arrêt instantané disponible

### Gestion du Stockage Local

L'application stocke :

1. **Clé API personnalisée** : `localStorage.hackerbot_api_key`
2. **Historique** : En mémoire pendant la session (stockage navigateur)
3. **Préférence de thème** : Classe CSS dans le DOM

## Déploiement en Production

### Construire pour la Production

```bash
npm run build
```

Cette commande :
- Minifie le code JavaScript et CSS
- Optimise les images
- Génère une sortie dans le dossier `dist/`
- Prépare pour le déploiement

### Déployer sur Vercel

1. Poussez votre code sur GitHub
2. Connectez-vous à [Vercel](https://vercel.com)
3. Cliquez sur "New Project"
4. Sélectionnez votre repository
5. Vercel détecte Vite automatiquement
6. Cliquez sur "Deploy"

### Déployer sur Netlify

1. Construisez localement : `npm run build`
2. Connectez-vous à [Netlify](https://netlify.com)
3. Glissez-déposez le dossier `dist/`
4. Ou connectez votre repository GitHub pour le déploiement automatique

### Configuration Recommandée

Pour la production, configurez :

```javascript
// vite.config.js
export default {
  build: {
    outDir: 'dist',
    sourcemap: false,  // Masquer les sources en production
  }
}
```

## Dépannage et Support

### Problème : "La reconnaissance vocale ne fonctionne pas"

**Solutions** :
- Vérifiez que vous utilisez Chrome, Safari ou Edge
- Vérifiez que le microphone est autorisé pour le site
- Vérifiez que votre microphone fonctionne
- Actualiser la page

### Problème : "La synthèse vocale ne joue pas"

**Solutions** :
- Vérifiez le volume du navigateur
- Assurez-vous que aucune autre synthèse ne joue
- Rechargez la page
- Testez avec un autre navigateur

### Problème : "Erreur API : 429 Too Many Requests"

**Solutions** :
- La limite de quota est atteinte
- Entrez votre clé API personnalisée
- Attendez jusqu'à demain pour la clé par défaut
- Optimisez vos questions (plus courtes = moins de tokens)

### Problème : "Le chat ne charge pas les messages précédents"

**Solutions** :
- L'historique est en mémoire (perdu au rechargement)
- Implémentez un stockage backend pour la persistance
- Cliquez sur "Nouveau chat" puis sélectionnez une session dans l'historique

### Vérifier les Logs

Ouvrez la console du navigateur (F12) pour voir :

```javascript
// Logs de développement
console.log('Messages:', messages);
console.error('Gemini error:', err);
```

## Variables d'Environnement

Actuellement, aucune variable d'environnement n'est requise. Cependant, pour plus de sécurité en production :

Créez un fichier `.env.local` :

```
VITE_GEMINI_API_KEY=votre_clé_ici
```

Modifiez `src/gemini.js` pour utiliser :

```javascript
const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
```

## Sécurité

### Bonnes Pratiques

1. **Ne commitez jamais de clés API** : Utilisez `.env.local`
2. **Validez les entrées** : Vérifiez les messages utilisateur
3. **HTTPS en production** : Toujours utiliser HTTPS
4. **Content Security Policy** : Configurez les headers
5. **Clés API personnalisées** : Encouragez les utilisateurs à utiliser leurs propres clés

### Confidentialité

- Les conversations ne sont stockées que localement
- Aucune donnée n'est envoyée à des serveurs tiers sauf Gemini API
- Consultez la politique de confidentialité de Google pour Gemini

## Contribution et Améliorations

Pour améliorer le projet :

1. Forkez le repository
2. Créez une branche : `git checkout -b feature/nouvelle-fonctionnalite`
3. Committez vos changements : `git commit -m 'Ajout: nouvelle fonctionnalité'`
4. Poussez : `git push origin feature/nouvelle-fonctionnalite`
5. Créez une Pull Request

### Idées de Futures Améliorations

- Stockage backend pour l'historique persistant
- Authentification utilisateur
- Intégration avec système de réservation réel
- Support de plus de langues
- Mode offline avec cache
- Tableaux de bord administrateur
- Analytics des conversations

## Ressources et Documentation

- [Documentation React](https://react.dev)
- [Documentation Vite](https://vitejs.dev)
- [Google Gemini API](https://ai.google.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Web Speech API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## Licence

Ce projet est conçu pour l'Hôtel Panorama Bukavu. Tous droits réservés.

## Contact et Support

Pour toute question ou support :

- Repository : [lucien-amani/chatbot-panorama-bukavu](https://github.com/lucien-amani/chatbot-panorama-bukavu)
- Hôtel Panorama : Bukavu, République Démocratique du Congo
- Email : support@hotelapanorama.cd

---

**Panorama Assist** — Service d'assistance exclusif de l'Hôtel Panorama Bukavu, RDC.
Conçu avec excellence pour une expérience client de première classe.
>>>>>>> 33314d675e19f9ea0ab4592e81c7b688ce717065
