import { collection, addDoc, getDocs, getDoc, doc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Resource } from '../models/Resource';

export const resourceService = {
  // Ajouter une ressource
  async addResource(courseId: string, resource: Omit<Resource, 'id' | 'courseId' | 'createdAt'>): Promise<string> {
    const resourceData = {
      ...resource,
      courseId,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'resources'), resourceData);
    return docRef.id;
  },

  // Obtenir les ressources d'un cours
  async getCourseResources(courseId: string): Promise<Resource[]> {
    const q = query(collection(db, 'resources'), where('courseId', '==', courseId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Resource[];
  },

  // Supprimer une ressource
  async deleteResource(resourceId: string): Promise<void> {
    await deleteDoc(doc(db, 'resources', resourceId));
  },
};
