/**
 * Script pour créer des placeholders PNG simples
 * Nécessite: npm install sharp
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// Vérifier si sharp est installé
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('⚠️  Le package "sharp" n\'est pas installé.');
  console.log('📦 Installation: npm install sharp');
  console.log('\n📝 Alternative: Créez les images manuellement:');
  console.log('   - icon.png: 1024x1024 pixels, couleur #6366f1, texte "SU"');
  console.log('   - adaptive-icon.png: 1024x1024 pixels, couleur #6366f1, texte "SU"');
  console.log('   - splash.png: 1242x2436 pixels, couleur #6366f1, texte "SkillUp"');
  process.exit(1);
}

// Créer le dossier assets
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Fonction pour créer une image PNG
async function createPNG(width, height, backgroundColor, text, filename) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" 
            font-size="${Math.min(width, height) / (text.length > 5 ? 8 : 4)}" 
            fill="white" text-anchor="middle" dominant-baseline="middle" 
            font-weight="bold">${text}</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, filename));

  console.log(`✅ ${filename} créé (${width}x${height})`);
}

// Créer les 3 fichiers
async function generateAssets() {
  try {
    await createPNG(1024, 1024, '#6366f1', 'SU', 'icon.png');
    await createPNG(1024, 1024, '#6366f1', 'SU', 'adaptive-icon.png');
    await createPNG(1242, 2436, '#6366f1', 'SkillUp', 'splash.png');
    console.log('\n🎉 Tous les assets ont été créés avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

generateAssets();













