export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Ne pas stocker en clair dans Firestore
  role?: string; // e.g., 'user' or 'admin'
  createdAt: Date;
  updatedAt: Date;
  skills?: string[]; // IDs des compétences
  goals?: string[]; // IDs des objectifs
  badges?: string[]; // IDs des badges
}

export interface UserProfile {
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
}










