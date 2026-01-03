export interface Goal {
  id: string;
  userId: string;
  target: string;
  description?: string;
  targetDate?: Date;
  completed: boolean;
  createdAt: Date;
  skillId?: string; // Compétence associée
}













