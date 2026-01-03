const fs = require('fs');
const path = require('path');

// Créer le dossier assets s'il n'existe pas
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Fonction pour créer un PNG simple (SVG converti en base64)
function createSimplePNG(width, height, color, text) {
  // Créer un SVG simple
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${color}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(width, height) / 4}" 
        fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${text}</text>
</svg>`;

  // Pour Expo, on peut utiliser SVG directement ou créer un PNG
  // Ici on va créer un fichier SVG temporaire et donner des instructions
  return svg;
}

// Créer les fichiers SVG (Expo accepte aussi SVG pour certains assets)
const iconSVG = createSimplePNG(1024, 1024, '#6366f1', 'SU');
const adaptiveIconSVG = createSimplePNG(1024, 1024, '#6366f1', 'SU');
const splashSVG = createSimplePNG(1242, 2436, '#6366f1', 'SkillUp');

// Écrire les fichiers SVG
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconSVG);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.svg'), adaptiveIconSVG);
fs.writeFileSync(path.join(assetsDir, 'splash.svg'), splashSVG);

console.log('✅ Fichiers SVG créés dans assets/');
console.log('⚠️  Note: Expo nécessite des fichiers PNG, pas SVG.');
console.log('📝 Instructions pour créer les PNG:');
console.log('   1. Utilisez un outil en ligne comme https://convertio.co/svg-png/');
console.log('   2. Ou utilisez ImageMagick: convert icon.svg icon.png');
console.log('   3. Ou créez les images avec un éditeur graphique');













