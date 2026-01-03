# 🔧 Créer un Admin Manuellement (Sans serviceAccountKey.json)

Si vous ne pouvez pas obtenir `serviceAccountKey.json`, voici comment créer un admin manuellement :

## Méthode Simple : Via l'Application

### Étape 1 : Créer un Compte Normal

1. Ouvrez l'application SkillUp
2. Allez sur la page **Register**
3. Créez un compte avec :
   - Email : `admin@example.com` (ou votre email)
   - Mot de passe : (choisissez un mot de passe fort)
   - Nom : Votre nom

### Étape 2 : Promouvoir en Admin via Firebase Console

1. **Allez sur Firebase Console** : https://console.firebase.google.com/
2. **Sélectionnez votre projet** : `skillup-cc757`
3. **Allez dans Firestore Database**
4. **Collection** : `users`
5. **Trouvez le document** avec l'email que vous avez utilisé
6. **Cliquez sur le document** pour l'ouvrir
7. **Cliquez sur "Modifier"** (icône crayon)
8. **Ajoutez un champ** :
   - **Nom du champ** : `role`
   - **Type** : string
   - **Valeur** : `admin`
9. **Sauvegardez**

### Étape 3 : Vérifier

Le document devrait maintenant contenir :
```json
{
  "name": "Votre Nom",
  "email": "admin@example.com",
  "role": "admin",  ← Ce champ
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Étape 4 : Se Connecter

1. Ouvrez l'application SkillUp
2. Page **Login** → **"Accès Administrateur"**
3. Connectez-vous avec l'email et mot de passe créés
4. Vous serez redirigé vers le **Dashboard Admin** ✅

---

**C'est tout ! Vous avez maintenant un compte admin fonctionnel.**







