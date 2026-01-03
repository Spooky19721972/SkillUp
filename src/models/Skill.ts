export interface Skill {
  id: string;
  name: string;
  description: string;
  userId: string;
  level?: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  courses?: string[]; // IDs des cours associés
}













