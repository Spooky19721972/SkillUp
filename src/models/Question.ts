export interface Question {
  id: string;
  content: string;
  quizId: string;
  type: 'multiple_choice' | 'true_false' | 'text';
  options?: string[]; // Pour multiple choice
  correctAnswer: string;
  points: number;
  order: number;
}













