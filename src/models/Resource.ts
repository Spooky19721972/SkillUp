export interface Resource {
  id: string;
  courseId: string;
  type: 'video' | 'article' | 'document' | 'link';
  url: string;
  title: string;
  description?: string;
  createdAt: Date;
}













