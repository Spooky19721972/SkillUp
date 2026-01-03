export interface Badge {
  id: string;
  title: string;
  description: string;
  icon?: string;
  color?: string;
  image?: string; // URL de l'image du badge
  unlockedAt?: Date;
  userId?: string; // Si null, badge disponible pour tous
  skillId?: string; // ID de la compétence associée
  conditions?: BadgeCondition; // Conditions pour débloquer le badge
}

export interface BadgeCondition {
  type: 'complete_skills' | 'quiz_score' | 'complete_courses' | 'custom';
  value: number; // Nombre de compétences/cours ou score minimum
  skillIds?: string[]; // IDs des compétences spécifiques (optionnel)
  quizId?: string; // ID du quiz spécifique (optionnel)
}







