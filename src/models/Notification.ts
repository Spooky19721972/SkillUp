export interface Notification {
  id: string;
  userId: string;
  content: string;
  type: 'achievement' | 'reminder' | 'progress' | 'system';
  read: boolean;
  createdAt: Date;
  relatedId?: string; // ID de l'entité liée (badge, goal, etc.)
}













