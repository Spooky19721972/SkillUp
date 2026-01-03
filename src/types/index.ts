// Types de base pour toutes les entités de l'application

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Ne jamais stocker en clair dans Firestore
  createdAt: Date;
  updatedAt: Date;
  skills?: string[]; // IDs des compétences
  goals?: string[]; // IDs des objectifs
  badges?: string[]; // IDs des badges
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  level?: number; // Niveau de maîtrise (0-100)
}

export interface Course {
  id: string;
  title: string;
  description: string;
  skillId: string; // Compétence associée
  createdAt: Date;
  lessons?: string[]; // IDs des leçons
  quizzes?: string[]; // IDs des quiz
  resources?: string[]; // IDs des ressources
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  courseId: string;
  order: number;
  createdAt: Date;
}

export interface Quiz {
  id: string;
  title: string;
  courseId: string;
  questions?: string[]; // IDs des questions
  createdAt: Date;
}

export interface Question {
  id: string;
  content: string;
  quizId: string;
  correctAnswer: string;
  options: string[]; // Options de réponse
  points: number;
  createdAt: Date;
}

export interface Response {
  id: string;
  userAnswer: string;
  questionId: string;
  userId: string;
  quizId: string;
  isCorrect: boolean;
  createdAt: Date;
}

export interface Progress {
  id: string;
  percentage: number;
  userId: string;
  lessonId?: string;
  courseId?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  target: string;
  userId: string;
  skillId?: string;
  courseId?: string;
  deadline?: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string; // Condition pour débloquer
  createdAt: Date;
}

export interface Reminder {
  id: string;
  message: string;
  userId: string;
  scheduledAt: Date;
  isSent: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  content: string;
  userId: string;
  type: 'achievement' | 'reminder' | 'progress' | 'system';
  isRead: boolean;
  createdAt: Date;
}

export interface Favorite {
  id: string;
  userId: string;
  itemType: 'course' | 'skill' | 'resource';
  itemId: string;
  createdAt: Date;
}

export interface Resource {
  id: string;
  type: string; // 'video' | 'article' | 'document' | 'link'
  url: string;
  title: string;
  description?: string;
  courseId: string;
  createdAt: Date;
}

export interface QuizResult {
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  responses: string[]; // IDs des réponses
  completedAt: Date;
}

