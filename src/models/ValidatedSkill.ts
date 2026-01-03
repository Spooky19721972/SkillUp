export interface ValidatedSkill {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  validatedAt: Date;
  quizScore: number; // Score obtenu au quiz (0-100)
  badgesUnlocked?: string[]; // IDs des badges débloqués
}

