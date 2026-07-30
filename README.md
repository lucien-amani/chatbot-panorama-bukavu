# 🏨 Panorama Bukavu - Système de Réservation Multi-Hôtels & Assistant IA

**Panorama Bukavu** est une plateforme web moderne et premium de gestion de réservations et d'assistance client multi-hôtels pour les établissements de Bukavu (République Démocratique du Congo). 

L'application intègre un **Assistant IA contextuel** de pointe, ainsi qu'un tableau de bord d'administration multi-tenant sécurisé.

---

## 🌟 Objectifs & Philosophie

*   **Multi-Hôtels & Multi-Tenancy** : Une base de données unifiée permettant à plus de 14 hôtels de Bukavu de posséder leur propre tableau de bord d'administration isolé.
*   **Intelligence Artificielle Locale** : Assistant IA entraîné avec tout le catalogue de Bukavu, capable d'orienter les visiteurs et de faciliter les réservations directes.
*   **Accessibilité vocale** : Synthèse vocale ultra-réaliste (TTS ElevenLabs) et reconnaissance vocale (STT intégrée au navigateur) pour rendre le service accessible à tous.
*   **Design Premium** : Charte graphique moderne, sombre et épurée (glassmorphisme, animations fluides) adaptée aux standards de l'hôtellerie de luxe.

---

## ✨ Fonctionnalités Clés

*   **Assistant Client intelligent (Gemini)** : Répond précisément aux questions des clients sur tous les hôtels (services, équipements, prix, adresse, etc.) en se basant sur le catalogue `hotels.json` et les disponibilités des chambres de la base de données.
*   **Intégration Vocale Avancée** :
    *   **Speech-to-Text (STT)** : Dictée vocale via l'API Web Speech du navigateur.
    *   **Text-to-Speech (TTS) ElevenLabs** : Synthèse vocale de haute qualité avec voix naturelles (configurable via clé API).
*   **Réservations et Commandes** :
    *   Réservation en ligne de chambres filtrées par hôtel.
    *   Commandes de Room-Service (plats et boissons) liées à une chambre active.
*   **Dashboards Administrateurs Isolés (Multi-Tenant)** :
    *   **Super-Admin** (`okokaroland@gmail.com`) : Vue globale sur tous les hôtels, statistiques consolidées et gestion globale des chambres.
    *   **Admins Hôteliers** (ex: `Orchids' Safari Club`, `Hôtel Panorama`) : Tableaux de bord personnalisés aux couleurs de l'hôtel, restreints à leurs propres chambres, réservations, commandes et notifications.

---

## 🛠️ Stack Technique

*   **Frontend** : React 19, Vite, Tailwind CSS, Lucide Icons, React Router DOM.
*   **Backend** : Node.js, Express.
*   **Base de données** : PostgreSQL avec l'ORM Prisma.
*   **Modèles IA & Audio** :
    *   Google Gemini API (via `@google/genai`).
    *   ElevenLabs API (pour la voix off ultra-réaliste).
    *   Web Speech API (reconnaissance vocale intégrée).

---

## 🗄️ Architecture Base de Données (PostgreSQL & Prisma)

Toute la persistance des données a été migrée de PocketBase vers **PostgreSQL**.
Les fichiers de configuration clés se trouvent dans le répertoire `panorama-backend/` :
*   `prisma/schema.prisma` : Modèle de données comprenant les tables `Utilisateur`, `Profil`, `TypeChambre`, `Chambre`, `Reservation`, `LigneReservation`, `Plat`, `Commande` et `Notification`.
*   `prisma/seed.js` : Script de seeding pour initialiser le Super-Admin, les 14 comptes administrateurs d'hôtels, ainsi que le catalogue de chambres et de plats du room-service.

---

## 🚀 Guide d'Installation et Configuration

### 💻 Prérequis
*   Node.js (v18+) et npm.
*   PostgreSQL installé et en cours d'exécution.
*   Clé API Gemini (obtenue sur Google AI Studio).
*   *(Optionnel)* Clé API ElevenLabs et ID de voix.

---

### 📥 1. Installation

Clonez le projet et installez les dépendances :
```bash
git clone https://github.com/lucien-amani/chatbot-panorama-bukavu.git
cd chatbot-panorama-bukavu
npm install

# Installer le backend
cd panorama-backend
npm install
```

---

### 🔧 2. Configuration des Variables d'Environnement

#### A. Fichier `.env` à la racine (Frontend)
Créez un fichier `.env` dans le répertoire principal `chatbot-panorama-bukavu/` :
```env
VITE_GEMINI_API_KEY=VOTRE_CLE_GEMINI
VITE_API_URL=http://localhost:5000

# Optionnel : ElevenLabs
VITE_ELEVENLABS_API_KEY=VOTRE_CLE_ELEVENLABS
VITE_ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

#### B. Fichier `.env` dans `panorama-backend/` (Backend)
Créez un fichier `.env` dans `panorama-backend/` :
```env
PORT=5000
DATABASE_URL="postgresql://utilisateur:motdepasse@localhost:5432/nom_de_base?schema=public"
JWT_SECRET=super_secret_cle_jwt_2026
```

---

### ⚡ 3. Démarrage de la Base de Données & Seeding

#### 🐧 Sur Linux :
Vous pouvez utiliser le script automatique d'initialisation :
```bash
# Rendre le script exécutable
chmod +x setup-postgres.sh
# Lancer l'initialisation
./setup-postgres.sh
```

#### 🪟 Sur Windows (ou en mode Manuel) :
1. Créez manuellement la base de données PostgreSQL (ex: `panorama_bukavu`).
2. Appliquez les migrations Prisma depuis le dossier `panorama-backend` :
   ```bash
   cd panorama-backend
   npx prisma migrate dev --name init
   ```
3. Exécutez le script pour charger les données initiales (seeding) :
   ```bash
   npm run seed
   ```

---

### 💻 4. Lancement des Serveurs de Développement

Démarrez les deux serveurs en parallèle dans des terminaux distincts :

#### Terminal 1 : Backend Express
```bash
cd panorama-backend
npm run dev
```

#### Terminal 2 : Frontend Vite (React)
```bash
cd ..
npm run dev
```
Ouvrez votre navigateur à l'adresse fournie (généralement `http://localhost:5173`).

---

## 🛠️ Commandes Utiles

```bash
# Lancer le frontend (Vite)
npm run dev

# Lancer le backend (dossier panorama-backend/)
npm run dev

# Compiler le projet pour la production (frontend)
npm run build

# Réinitialiser la DB et relancer le Seed
npx prisma migrate reset --force
```

---

## 🔑 Identifiants d'Administration Initiaux

Les identifiants générés automatiquement après le seed sont documentés dans le fichier [admin_credentials.md](./admin_credentials.md) à la racine.

*   **Super-Admin** :
    *   Email : `okokaroland@gmail.com`
    *   Mot de passe : `okokaroland@gmail.com`
*   **Admins Hôteliers** :
    *   Identifiant : Nom de l'hôtel (ex: `Orchids' Safari Club` ou `Hôtel Panorama`)
    *   Mot de passe : Nom de l'hôtel identique.

---

## 📄 Licence
Ce projet est développé et maintenu pour le réseau hôtelier de Bukavu. 
Pour toute assistance, contactez : `support@hotelspanorama.cd`.
