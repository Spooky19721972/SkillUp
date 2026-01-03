export interface Course {
  id: string;
  title: string;
  description: string;
  skillId: string;
  type: 'internal' | 'external'; // Type de cours
  externalUrl?: string; // URL pour les cours externes (ex: Coursera)
  createdAt: Date;
  lessons?: string[]; // IDs des leçons (uniquement pour cours internes)
  quizzes?: string[]; // IDs des quiz
  resources?: string[]; // IDs des ressources
}







