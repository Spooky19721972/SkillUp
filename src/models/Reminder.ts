export interface Reminder {
  id: string;
  userId: string;
  message: string;
  scheduledAt: Date;
  sent: boolean;
  type: 'daily' | 'weekly' | 'custom';
  createdAt: Date;
}













