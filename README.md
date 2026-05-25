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
