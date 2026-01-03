/**
 * Script pour créer un superuser admin dans Firebase
 * Usage: node scripts/create-admin-user.js
 */

const admin = require("firebase-admin");
const readline = require("readline");
const path = require("path");

// Configuration du chemin vers serviceAccountKey.json
const serviceAccountPath = path.join(
  __dirname,
  "..",
  "server",
  "serviceAccountKey.json"
);

// Vérifier si le fichier existe
const fs = require("fs");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Erreur: serviceAccountKey.json introuvable dans server/");
  console.error("📝 Instructions:");
  console.error(
    "   1. Téléchargez serviceAccountKey.json depuis Firebase Console"
  );
  console.error("   2. Placez-le dans le dossier server/");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialiser Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Interface pour lire les entrées utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdminUser() {
  try {
    console.log("\n🔐 Création d'un Superuser Admin\n");
    console.log("═".repeat(50));

    // Demander les informations
    const email = await question("\n📧 Email de l'admin: ");
    const password = await question("🔑 Mot de passe (min 6 caractères): ");
    const name = await question("👤 Nom complet: ");

    if (!email || !password || !name) {
      console.error("\n❌ Tous les champs sont requis!");
      rl.close();
      process.exit(1);
    }

    if (password.length < 6) {
      console.error(
        "\n❌ Le mot de passe doit contenir au moins 6 caractères!"
      );
      rl.close();
      process.exit(1);
    }

    console.log("\n⏳ Création de l'utilisateur...\n");

    // 1. Créer l'utilisateur dans Firebase Authentication
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: name,
        emailVerified: false,
      });
      console.log("✅ Utilisateur créé dans Firebase Authentication");
      console.log(`   ID: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        console.log(
          "⚠️  L'email existe déjà, récupération de l'utilisateur..."
        );
        try {
          userRecord = await auth.getUserByEmail(email);
          console.log(`✅ Utilisateur trouvé: ${userRecord.uid}`);
        } catch (getError) {
          console.error("❌ Erreur lors de la récupération:", getError.message);
          rl.close();
          process.exit(1);
        }
      } else {
        throw error;
      }
    }

    // 2. Créer/Mettre à jour le document dans Firestore avec le rôle admin
    const userRef = db.collection("users").doc(userRecord.uid);
    const userDoc = await userRef.get();

    const userData = {
      name: name,
      email: email,
      role: "admin",
      createdAt: userDoc.exists
        ? userDoc.data().createdAt
        : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      if (userDoc.exists) {
        // Mettre à jour l'utilisateur existant
        await userRef.update(userData);
        console.log("✅ Document Firestore mis à jour avec le rôle admin");
      } else {
        // Créer un nouveau document
        await userRef.set(userData);
        console.log("✅ Document Firestore créé avec le rôle admin");
      }
    } catch (firestoreError) {
      if (
        firestoreError.code === 7 ||
        firestoreError.message?.includes("PERMISSION_DENIED")
      ) {
        console.log(
          "\n⚠️  Firestore API non activée ou permissions insuffisantes"
        );
        console.log(
          "\n📋 L'utilisateur a été créé dans Firebase Authentication !"
        );
        console.log(`   User ID: ${userRecord.uid}`);
        console.log(
          "\n🔧 Pour finaliser, créez manuellement le document dans Firestore :"
        );
        console.log("   1. Allez dans Firebase Console → Firestore Database");
        console.log("   2. Activez Firestore si nécessaire");
        console.log("   3. Collection: users");
        console.log(`   4. Document ID: ${userRecord.uid}`);
        console.log("   5. Ajoutez les champs:");
        console.log(`      - name: "${name}"`);
        console.log(`      - email: "${email}"`);
        console.log(`      - role: "admin"`);
        console.log("      - createdAt: [timestamp actuel]");
        console.log("      - updatedAt: [timestamp actuel]");
        console.log("\n📖 Voir ACTIVER_FIRESTORE.md pour plus de détails\n");
        process.exit(0);
      } else {
        throw firestoreError;
      }
    }

    console.log("\n" + "═".repeat(50));
    console.log("\n🎉 Superuser Admin créé avec succès!\n");
    console.log("📋 Informations:");
    console.log(`   Email: ${email}`);
    console.log(`   Nom: ${name}`);
    console.log(`   Rôle: admin`);
    console.log(`   User ID: ${userRecord.uid}`);
    console.log(
      "\n✅ Vous pouvez maintenant vous connecter avec cet email et mot de passe"
    );
    console.log("   sur la page AdminLogin de l'application.\n");
  } catch (error) {
    console.error("\n❌ Erreur lors de la création:", error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Lancer le script
createAdminUser();
