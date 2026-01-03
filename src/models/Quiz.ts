export interface Quiz {
  id: string;
  title: string;
  skillId: string; // ID de la compétence associée
  courseId?: string; // Optionnel, pour compatibilité
  questions?: string[]; // IDs des questions
  passingScore?: number; // Score minimum pour réussir (80% par défaut)
  timeLimit?: number; // en minutes
  createdAt: Date;
}













