import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { progressService, validatedSkillService, userSkillService, AvailableSkill } from '../services';
import { Progress } from '../models/Progress';
import { useNavigation } from '@react-navigation/native';
import { ValidatedSkill } from '../models/ValidatedSkill';

export default function ProgressScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'skills' | 'progress' | 'history' | 'results'>('skills');
  const [progress, setProgress] = useState<Progress[]>([]);
  const [history, setHistory] = useState<Progress[]>([]);
  const [validatedSkills, setValidatedSkills] = useState<ValidatedSkill[]>([]);
  const [userSkills, setUserSkills] = useState<AvailableSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user, activeTab]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (activeTab === 'skills') {
        const enrolledSkills = await userSkillService.getUserEnrolledSkills(user.uid);
        setUserSkills(enrolledSkills);
      } else if (activeTab === 'progress') {
        const userProgress = await progressService.getUserProgress(user.uid);
        setProgress(userProgress);
      } else if (activeTab === 'history') {
        const userHistory = await progressService.getUserHistory(user.uid);
        setHistory(userHistory);
      } else if (activeTab === 'results') {
        const skills = await validatedSkillService.getUserValidatedSkills(user.uid);
        setValidatedSkills(skills);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressItem = ({ item }: { item: Progress }) => (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>
          {item.lessonId ? 'Leçon' : item.courseId ? 'Cours' : 'Quiz'}
        </Text>
        <Text style={styles.progressDate}>
          {new Date(item.lastAccessedAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${item.percentage}%` },
            ]}
          />
        </View>
        <Text style={styles.progressPercentage}>{item.percentage}%</Text>
      </View>
      {item.completed && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓ Complété</Text>
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ma Progression</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'skills' && styles.tabActive]}
          onPress={() => setActiveTab('skills')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'skills' && styles.tabTextActive,
            ]}
          >
            Mes Compétences
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'progress' && styles.tabActive]}
          onPress={() => setActiveTab('progress')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'progress' && styles.tabTextActive,
            ]}
          >
            En cours
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'history' && styles.tabTextActive,
            ]}
          >
            Historique
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'results' && styles.tabActive]}
          onPress={() => setActiveTab('results')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'results' && styles.tabTextActive,
            ]}
          >
            Résultats
          </Text>
        </TouchableOpacity>
      </View>


      {activeTab === 'skills' ? (
        <FlatList
          data={userSkills}
          renderItem={({ item }) => {
            const level = item.userProgress?.level ?? 0;
            const coursesCompleted = item.userProgress?.coursesCompleted ?? 0;
            const totalCourses = item.courseCount;

            return (
              <View style={styles.skillCard}>
                <View style={styles.skillHeader}>
                  <Text style={styles.skillName}>{item.name}</Text>
                  {level === 100 && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>✓ Complété</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.skillDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${level}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPercentage}>{level}%</Text>
                </View>
                <Text style={styles.coursesInfo}>
                  {coursesCompleted} / {totalCourses} cours complétés
                </Text>
                <TouchableOpacity
                  style={styles.viewDetailsButton}
                  onPress={() => navigation.navigate('SkillDetails' as never, { skillId: item.id } as never)}
                >
                  <Text style={styles.viewDetailsButtonText}>Voir détails →</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Aucune compétence pour le moment
              </Text>
              <Text style={styles.emptySubtext}>
                Inscrivez-vous à une compétence pour commencer !
              </Text>
            </View>
          }
          refreshing={loading}
          onRefresh={loadData}
        />
      ) : activeTab === 'results' ? (
        <FlatList
          data={validatedSkills}
          renderItem={({ item }) => (
            <View style={styles.validatedSkillCard}>
              <View style={styles.validatedSkillHeader}>
                <Text style={styles.validatedSkillName}>{item.skillName}</Text>
                <View style={styles.validatedBadge}>
                  <Text style={styles.validatedBadgeText}>✅ Validée</Text>
                </View>
              </View>
              <View style={styles.validatedSkillDetails}>
                <Text style={styles.validatedSkillScore}>
                  Score: {item.quizScore}%
                </Text>
                <Text style={styles.validatedSkillDate}>
                  {new Date(item.validatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              {item.badgesUnlocked && item.badgesUnlocked.length > 0 && (
                <View style={styles.badgesContainer}>
                  <Text style={styles.badgesLabel}>
                    🏆 {item.badgesUnlocked.length} badge(s) débloqué(s)
                  </Text>
                </View>
              )}
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Aucune compétence validée pour le moment
              </Text>
            </View>
          }
          refreshing={loading}
          onRefresh={loadData}
        />
      ) : (
        <FlatList
          data={activeTab === 'progress' ? progress : history}
          renderItem={renderProgressItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'progress'
                  ? 'Aucune progression en cours'
                  : 'Aucun historique disponible'}
              </Text>
            </View>
          }
          refreshing={loading}
          onRefresh={loadData}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 20,
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    minWidth: 50,
    textAlign: 'right',
  },
  completedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 10,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  validatedSkillCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  validatedSkillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  validatedSkillName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  validatedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  validatedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  validatedSkillDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validatedSkillScore: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  validatedSkillDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  badgesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgesLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  skillCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  skillDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  coursesInfo: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  viewDetailsButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 12,
  },
  viewDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
