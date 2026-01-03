import { collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { adminSkillService } from './adminSkillService';
import { userSkillService } from './userSkillService';
import { badgeService } from './badgeService';
import { validatedSkillService } from './validatedSkillService';
import { Badge } from '../models/Badge';

export const skillValidationService = {
  // Valider une compétence après un quiz réussi
  async validateSkill(userId: string, skillId: string, quizScore: number): Promise<{
    skillValidated: boolean;
    badgesUnlocked: Badge[];
  }> {
    const badgesUnlocked: Badge[] = [];

    try {
      // Mettre à jour la progression de la compétence à 100%
      const progressSnapshot = await getDocs(
        query(collection(db, 'userSkillProgress'), where('userId', '==', userId), where('skillId', '==', skillId))
      );
      
      if (!progressSnapshot.empty) {
        const progressDoc = progressSnapshot.docs[0];
        await updateDoc(progressDoc.ref, {
          level: 100,
          lastAccessedAt: Timestamp.now(),
        });
      }

      // Vérifier et attribuer les badges associés à la compétence
      const badges = await adminSkillService.getSkillBadges(skillId);
      const unlockedBadgeIds: string[] = [];
      
      for (const badge of badges) {
        if (badge.conditions) {
          const shouldUnlock = await this.checkBadgeConditions(userId, badge, skillId, quizScore);
          if (shouldUnlock) {
            // Vérifier si l'utilisateur n'a pas déjà ce badge
            const userBadges = await badgeService.getUserBadges(userId);
            const hasBadge = userBadges.some(b => b.id === badge.id);
            
            if (!hasBadge) {
              await badgeService.unlockBadge(userId, badge.id);
              badgesUnlocked.push(badge);
              unlockedBadgeIds.push(badge.id);
            }
          }
        }
      }

      // Enregistrer la compétence validée
      await validatedSkillService.recordValidatedSkill(
        userId,
        skillId,
        quizScore,
        unlockedBadgeIds
      );

      return {
        skillValidated: true,
        badgesUnlocked,
      };
    } catch (error: any) {
      console.error('Erreur lors de la validation de la compétence:', error);
      throw new Error(error.message || 'Impossible de valider la compétence');
    }
  },

  // Vérifier les conditions d'un badge
  async checkBadgeConditions(
    userId: string,
    badge: Badge,
    skillId: string,
    quizScore: number
  ): Promise<boolean> {
    if (!badge.conditions) return false;

    const { type, value, quizId } = badge.conditions;

    switch (type) {
      case 'quiz_score':
        // Vérifier si le score du quiz est suffisant
        return quizScore >= value;
      
      case 'complete_skills':
        // Vérifier si l'utilisateur a complété le nombre requis de compétences
        const { userSkillService } = await import('./userSkillService');
        const enrolledSkills = await userSkillService.getUserEnrolledSkills(userId);
        const completedSkills = enrolledSkills.filter(skill => skill.userProgress?.level === 100);
        return completedSkills.length >= value;
      
      case 'complete_courses':
        // Vérifier si l'utilisateur a complété le nombre requis de cours
        const { progressService } = await import('./progressService');
        const userProgress = await progressService.getUserHistory(userId);
        const completedCourses = userProgress.filter(p => p.courseId && p.completed);
        return completedCourses.length >= value;
      
      default:
        return false;
    }
  },
};

