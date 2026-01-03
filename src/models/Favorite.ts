export interface Favorite {
  id: string;
  userId: string;
  itemType: 'course' | 'skill' | 'lesson';
  itemId: string;
  createdAt: Date;
}













