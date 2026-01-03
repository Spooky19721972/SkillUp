import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Favorite } from '../types';

export const favoriteService = {
  // Récupérer tous les favoris d'un utilisateur
  async getUserFavorites(userId: string): Promise<Favorite[]> {
    try {
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Favorite[];
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
      throw error;
    }
  },

  // Ajouter un favori
  async addFavorite(
    userId: string,
    itemType: Favorite['itemType'],
    itemId: string
  ): Promise<string> {
    try {
      // Vérifier si le favori existe déjà
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        where('itemType', '==', itemType),
        where('itemId', '==', itemId)
      );
      const existing = await getDocs(q);

      if (!existing.empty) {
        return existing.docs[0].id;
      }

      const docRef = await addDoc(collection(db, 'favorites'), {
        userId,
        itemType,
        itemId,
        createdAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du favori:', error);
      throw error;
    }
  },

  // Supprimer un favori
  async removeFavorite(favoriteId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
      throw error;
    }
  },
};

