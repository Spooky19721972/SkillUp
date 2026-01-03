# SkillUp - Application Mobile de Gestion de Compétences

SkillUp est une application mobile développée en React Native (Expo) permettant aux utilisateurs de suivre, développer et visualiser l'évolution de leurs compétences personnelles.

## 🚀 Fonctionnalités

### Pour l'Utilisateur

- ✅ **Authentification** : Créer un compte, se connecter/déconnecter
- ✅ **Profil** : Modifier son profil utilisateur
- ✅ **Compétences** : Ajouter, modifier, supprimer et consulter ses compétences
- ✅ **Objectifs** : Ajouter, marquer comme complété, supprimer des objectifs
- ✅ **Ressources** : Consulter et gérer les ressources d'apprentissage
- ✅ **Quiz** : Lancer un quiz, répondre aux questions, consulter le score final
- ✅ **Progression** : Consulter sa progression et l'historique d'apprentissage
- ✅ **Badges** : Consulter les badges débloqués
- ✅ **Notifications** : Recevoir des rappels intelligents et notifications

### Pour le Système

- ✅ **Authentification** : Vérification des tokens Firebase
- ✅ **Gestion des données** : Chargement et mise à jour des données utilisateur
- ✅ **Compétences** : Stockage et gestion des compétences
- ✅ **Objectifs** : Mise à jour des objectifs
- ✅ **Ressources** : Traitement et gestion des ressources
- ✅ **Quiz** : Chargement des quiz, vérification des réponses, calcul des scores
- ✅ **Progression** : Mise à jour de la progression et historique
- ✅ **Notifications** : Analyse de l'inactivité et déclenchement de notifications

## 📋 Prérequis

- Node.js (v16 ou supérieur)
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Compte Firebase avec un projet configuré
- Un appareil mobile ou un émulateur pour tester

## 🛠️ Installation

### 1. Installation des dépendances

```bash
# Installation des dépendances de l'application mobile
npm install

# Installation des dépendances du serveur backend
cd server
npm install
```

### 2. Configuration Firebase

1. Créez un projet Firebase sur [Firebase Console](https://console.firebase.google.com/)
2. Activez l'authentification par email/mot de passe
3. Créez une base de données Firestore
4. Récupérez vos credentials Firebase

#### Configuration Mobile (Firebase Client)

Modifiez `src/config/firebase.ts` avec vos credentials :

```typescript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};
```

#### Configuration Backend (Firebase Admin)

1. Dans Firebase Console, allez dans Paramètres du projet > Comptes de service
2. Générez une nouvelle clé privée
3. Téléchargez le fichier JSON
4. Placez-le dans `server/serviceAccountKey.json`

### 3. Structure de la base de données Firestore

L'application utilise les collections suivantes :

- `users` - Profils utilisateurs
- `skills` - Compétences des utilisateurs
- `goals` - Objectifs des utilisateurs
- `courses` - Cours disponibles
- `lessons` - Leçons des cours
- `quizzes` - Quiz disponibles
- `questions` - Questions des quiz
- `responses` - Réponses des utilisateurs
- `progress` - Progression des utilisateurs
- `badges` - Badges disponibles et débloqués
- `notifications` - Notifications des utilisateurs
- `resources` - Ressources d'apprentissage
- `favorites` - Favoris des utilisateurs

## 🚀 Démarrage

### Application Mobile

```bash
# Démarrer l'application Expo
npm start

# Ou pour un appareil spécifique
npm run android  # Pour Android
npm run ios      # Pour iOS
npm run web      # Pour le web
```

### Backend Server

```bash
cd server
npm start

# Ou en mode développement avec auto-reload
npm run dev
```

Le serveur démarre sur `http://localhost:3000` par défaut.

## 📱 Navigation de l'Application

1. **Splash Screen** → Animation d'introduction avec logo
2. **Onboarding** → Slides d'introduction (Apprends, Progresse, Partage)
3. **Login/Register** → Authentification
4. **Home** → Menu principal avec accès à toutes les fonctionnalités
5. **Profile** → Gestion du profil utilisateur
6. **Skills** → Gestion des compétences
7. **Goals** → Gestion des objectifs
8. **Progress** → Progression et historique
9. **Badges** → Badges et notifications
10. **Quiz** → Passer un quiz
11. **Resources** → Consulter les ressources

## 🏗️ Architecture

```
SkillUp/
├── src/
│   ├── config/          # Configuration Firebase
│   ├── context/          # Contextes React (Auth)
│   ├── models/           # Modèles TypeScript
│   ├── screens/          # Écrans de l'application
│   └── services/         # Services Firebase
├── server/               # Backend Node.js
│   ├── index.js         # Serveur Express
│   └── package.json      # Dépendances serveur
├── App.tsx               # Point d'entrée
└── package.json          # Dépendances mobile
```

## 🔐 Sécurité

- Les mots de passe sont gérés par Firebase Authentication (hashés automatiquement)
- Les tokens d'authentification sont vérifiés côté serveur
- Les données utilisateur sont isolées par `userId` dans Firestore
- Le fichier `serviceAccountKey.json` est dans `.gitignore` (ne jamais le commiter)

## 📝 API Backend

Le backend expose les routes suivantes (toutes nécessitent un token d'authentification) :

- `GET /api/auth/verify` - Vérifier le token
- `GET /api/user` - Obtenir les données utilisateur
- `PUT /api/user` - Mettre à jour le profil
- `GET /api/skills` - Obtenir les compétences
- `PUT /api/skills/:id` - Modifier une compétence
- `DELETE /api/skills/:id` - Supprimer une compétence
- `PUT /api/goals/:id` - Mettre à jour un objectif
- `GET /api/quiz/:id` - Obtenir un quiz
- `POST /api/quiz/:id/verify` - Vérifier les réponses
- `GET /api/progress` - Obtenir la progression
- `GET /api/progress/history` - Obtenir l'historique
- `GET /api/badges` - Obtenir les badges
- `POST /api/notifications` - Créer une notification

Voir `server/README.md` pour plus de détails.

## 🎨 Design

L'application utilise un design moderne avec :
- Dégradés de couleurs (violet/indigo)
- Animations fluides
- Interface intuitive
- Feedback visuel pour toutes les actions

## 📦 Technologies Utilisées

- **React Native** avec **Expo**
- **TypeScript**
- **Firebase** (Authentication + Firestore)
- **Node.js** + **Express**
- **React Navigation**
- **Expo Linear Gradient**
- **React Native Reanimated**

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

Ce projet est sous licence MIT.

## 🐛 Support

Pour toute question ou problème, ouvrez une issue sur le repository.

---

Développé avec ❤️ pour aider les utilisateurs à développer leurs compétences !
