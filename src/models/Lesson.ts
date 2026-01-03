export interface Lesson {
  id: string;
  title: string;
  content: string;
  courseId: string;
  order: number;
  duration?: number; // en minutes
  contentType: 'text' | 'video' | 'pdf'; // Type de contenu
  contentUrl?: string; // URL pour vidéo ou PDF
  createdAt: Date;
}







