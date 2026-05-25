# Rapport de Projet : Choix Technologiques, Évolution & Défis d'Implémentation

**À l'attention de :** L'encadrant du projet  
**Objet :** Rapport sur l'évolution technique, les langages/technologies utilisés, les défis Google Cloud et les solutions alternatives  
**Projet :** *Développement d'un système multilingue d'assistance client basé sur l'IA pour les hôtels dans les pays à faible revenu*  
(*Original : Development of a multi-lingual AI based customer care system for hotels in low-income countries*)  
**Technologies initiales prévues :** IA Text to Speech (TTS), Technologies Cloud (Google Cloud)

---

## 1. Introduction & Contexte du Projet

Le projet a pour objectif de concevoir et déployer une solution d'assistance client multilingue basée sur l'intelligence artificielle pour le secteur hôtelier. L'accent est mis spécifiquement sur son applicabilité dans les **pays à faible revenu**. 

Pour répondre aux contraintes structurelles et économiques de ces régions, la solution finale doit impérativement être :
* **Économique** (coût de maintenance et d'infrastructure minimal).
* **Accessible** (facilité de configuration et de gestion pour les hôteliers locaux).
* **Robuste** et performante malgré des ressources techniques parfois limitées.

Au cours de la phase d'implémentation initiale, nous avons évalué et tenté d'intégrer les services de **Google Cloud Platform (GCP)** (tels que Vertex AI et Google Cloud TTS). Cette démarche s'est heurtée à des obstacles majeurs liés à la tarification et à la complexité d'accès aux services, ce qui a motivé une réévaluation de notre architecture technique.

---

## 2. Évolution Technique du Projet

Le projet a suivi une trajectoire d'évolution progressive afin d'optimiser l'expérience utilisateur tout en s'adaptant aux réalités matérielles de notre public cible :

### Étape 1 : Prototype initial (Validation du concept)
* Mise en place d'un chatbot basique connecté à une base de connaissances hôtelière.
* Utilisation initiale de **PocketBase** comme serveur backend léger tout-en-un pour stocker les configurations et informations de l'hôtel.

### Étape 2 : Professionnalisation de l'UI/UX & Brading (Panorama Assist)
* Refonte complète de la charte graphique sous l'appellation **Panorama Assist**, abandonnant le style de développement initial au profit d'un design épuré inspiré des codes de l'hôtellerie de luxe.
* Optimisation de l'ergonomie mobile avec l'intégration d'une barre de navigation inférieure (bottom navigation bar) personnalisée et de champs de saisie (input pills) adaptés au tactile.

### Étape 3 : Consolidation du Backend et de l'Authentification
* Migration et structuration de la base de données relationnelle via **Prisma ORM** pour une meilleure scalabilité et intégrité des données.
* Implémentation d'un système d'authentification robuste (email/mot de passe) pour les comptes administrateurs des hôtels.

### Étape 4 : Optimisation des coûts (Pivot IA & Voix)
* Migration de l'intégration IA de Google Cloud Vertex AI vers **Google AI Studio (Gemini API)**.
* Remplacement des solutions payantes de Text-to-Speech (TTS) par des technologies natives et locales.

---

## 3. Langages, Technologies et Outils Utilisés

Afin d'assurer la légèreté et la rentabilité du système, nous avons sélectionné la stack technologique suivante :

### A. Langages de Programmation
* **JavaScript (ES6+) / TypeScript :** Utilisé sur l'ensemble de la stack (frontend React, scripts de migration de données, configuration de l'API et logique backend).
* **HTML5 / CSS3 (Vanilla) :** Pour la structure sémantique et les styles personnalisés, garantissant une compatibilité maximale et un contrôle total sur l'affichage.
* **SQL :** Utilisé pour interroger et manipuler les données structurées via le système de base de données relationnelle.

### B. Frameworks & Bibliothèques Frontend
* **React 19 & Vite :** Choisi pour la construction d'une application web monopage (SPA) extrêmement rapide à charger, performante et fluide.
* **Tailwind CSS :** Pour un design moderne et responsive, réduisant le temps d'écriture de styles redondants.
* **Lucide React / Heroicons :** Pour des icônes vectorielles modernes et légères (faible poids de page).
* **React Router Dom (v7) :** Pour la gestion des routes de l'application (pages publiques, tableau de bord d'administration, chat).

### C. Backend, Base de données & Hébergement
* **Prisma ORM :** Pour la modélisation des schémas de données et la génération automatique des requêtes typées.
* **PocketBase / SQLite :** Un moteur de base de données léger, embarqué directement dans l'application. Il ne nécessite pas de serveur de base de données payant dédié, ce qui convient parfaitement aux petits hôtels.

### D. Technologies d'Intelligence Artificielle et Voix
* **SDK `@google/genai` (Google AI Studio) :** Intégration du modèle **Gemini 1.5 Flash**, réputé pour sa rapidité, sa large fenêtre de contexte et son coût inexistant en palier gratuit.
* **Web Speech API (TTS & STT) :** Utilisation des capacités natives du navigateur de l'utilisateur pour transformer le texte en parole (TTS) et la parole en texte (STT) localement, évitant ainsi l'utilisation d'APIs cloud payantes.

---

## 4. Défis rencontrés avec Google Cloud (GCP)

L'utilisation directe de l'infrastructure Google Cloud présente des barrières à l'entrée particulièrement élevées pour notre cas d'usage :

* **Exigence d'une carte de crédit internationale :** Pour activer n'importe quel service sur GCP, Google impose de lier un compte de facturation actif. Dans le contexte des pays à faible revenu, l'accès à ce type de moyen de paiement est difficile ou très restreint pour les petites structures (hôtels locaux).
* **Absence de gratuité réelle à long terme :** Les services comme Vertex AI ou Cloud TTS deviennent rapidement payants à l'usage, sans palier gratuit perpétuel suffisant pour un déploiement de test ou de faible envergure.
* **Risque de surcoût :** Les modèles de tarification basés sur la consommation cloud (Pay-As-You-Go) comportent des risques de facturation imprévue en cas de hausse soudaine du trafic, ce qui est inacceptable pour notre public cible.
* **Complexité d'administration :** L'écosystème GCP requiert la gestion de projets, la configuration de rôles IAM (Identity and Access Management) et la maintenance de comptes de service complexes.

---

## 5. Solution Alternative : Google AI Studio (Gemini API) hors Cloud

Pour contourner ces obstacles, l'adoption de **Google AI Studio** s'est avérée être la meilleure alternative :

* **Accès simplifié :** L'accès ne nécessite pas de compte de facturation GCP ni de carte de crédit. Un simple compte Google (Gmail) suffit pour générer une clé API en quelques clics.
* **Gratuité et "Free Tier" généreux :** Google AI Studio offre un plan gratuit très robuste pour ses modèles phares (comme **Gemini 1.5 Flash**), limitant à 15 requêtes par minute (RPM), ce qui couvre largement les besoins d'un hôtel de petite ou moyenne taille.
* **Facilité de maintenance :** L'intégration est réalisée via une simple clé API stockée dans les variables d'environnement (`.env`), simplifiant grandement le code et réduisant le temps de maintenance.

---

## 6. Conclusion & Alignement avec les Objectifs du Projet

Le passage de **Google Cloud (GCP/Vertex AI)** vers **Google AI Studio (Gemini API)** et l'utilisation de technologies comme la **Web Speech API** et **SQLite** renforcent la pertinence du projet par rapport à son sujet d'étude. En éliminant les barrières financières et la complexité des infrastructures, nous offrons une solution d'IA hôtelière haut de gamme, résiliente et parfaitement adaptée aux budgets et contraintes des pays en développement.

Nous sollicitons votre validation sur cette stack technique et ces choix d'architecture.
