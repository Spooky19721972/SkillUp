export interface Progress {
  id: string;
  userId: string;
  lessonId?: string;
  courseId?: string;
  quizId?: string;
  percentage: number; // 0-100
  completed: boolean;
  startedAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
  responses?: string[]; // IDs des réponses associées
}













