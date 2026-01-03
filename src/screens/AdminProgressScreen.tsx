import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { adminProgressService } from '../services/adminProgressService';
import { adminUserService } from '../services/adminUserService';
import { adminSkillService } from '../services/adminSkillService';
import { validatedSkillService } from '../services/validatedSkillService';
import { Progress } from '../models/Progress';
import { User } from '../models/User';
import { Skill } from '../models/Skill';
import { ValidatedSkill } from '../models/ValidatedSkill';

export default function AdminProgressScreen() {
  const navigation = useNavigation();
  const [viewMode, setViewMode] = useState<'user' | 'skill' | 'quiz' | 'history' | 'validated'>('history');
  const [users, setUsers] = useState<User[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [progress, setProgress] = useState<Array<Progress & { userName?: string; skillName?: string; quizTitle?: string }>>([]);
  const [validatedSkills, setValidatedSkills] = useState<Array<ValidatedSkill & { userName?: string; userEmail?: string }>>([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [skillModalVisible, setSkillModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allSkills] = await Promise.all([
        adminUserService.getAllUsers(),
        adminSkillService.getAllSkills(),
      ]);
      setUsers(allUsers);
      setSkills(allSkills);
      
      // Charger l'historique par défaut
      if (viewMode === 'history') {
        await loadHistory();
      } else if (viewMode === 'validated') {
        await loadValidatedSkills();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setActionLoading(true);
    try {
      const history = await adminProgressService.getLearningHistory(50);
      setProgress(history);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger l\'historique');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    setActionLoading(true);
    try {
      const userProgress = await adminProgressService.getProgressByUser(user.id);
      setProgress(userProgress.map(p => ({ ...p, userName: user.name })));
      setUserModalVisible(false);
      setViewMode('user');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la progression');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectSkill = async (skill: Skill) => {
    setSelectedSkill(skill);
    setActionLoading(true);
    try {
      const skillProgress = await adminProgressService.getProgressBySkill(skill.id);
      setProgress(skillProgress.map(p => ({ ...p, skillName: skill.name })));
      setSkillModalVisible(false);
      setViewMode('skill');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la progression');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewQuizScores = async () => {
    setActionLoading(true);
    try {
      const quizScores = await adminProgressService.getQuizScores();
      setProgress(quizScores);
      setViewMode('quiz');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les scores');
    } finally {
      setActionLoading(false);
    }
  };

  const loadValidatedSkills = async () => {
    setActionLoading(true);
    try {
      const allValidated = await validatedSkillService.getAllValidatedSkills();
      // Enrichir avec les noms d'utilisateurs
      const enriched = await Promise.all(
        allValidated.map(async (vs) => {
          try {
            const user = await adminUserService.getUserById(vs.userId);
            return {
              ...vs,
              userName: user?.name || 'Utilisateur inconnu',
              userEmail: user?.email || '',
            };
          } catch {
            return {
              ...vs,
              userName: 'Utilisateur inconnu',
              userEmail: '',
            };
          }
        })
      );
      setValidatedSkills(enriched);
      setViewMode('validated');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les compétences validées');
    } finally {
      setActionLoading(false);
    }
  };

  const renderProgressItem = ({ item }: { item: Progress & { userName?: string; skillName?: string; quizTitle?: string } }) => {
    const progressType = item.lessonId ? 'Leçon' : item.courseId ? 'Cours' : item.quizId ? 'Quiz' : 'Inconnu';
    const title = item.quizTitle || item.skillName || progressType;

    return (
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>{title}</Text>
          {item.userName && (
            <Text style={styles.progressUser}>{item.userName}</Text>
          )}
        </View>
        
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${item.percentage}%` },
            ]}
          />
        </View>
        
        <View style={styles.progressDetails}>
          <Text style={styles.progressPercentage}>{item.percentage}%</Text>
          {item.completed && (
            <Text style={styles.progressCompleted}>✓ Complété</Text>
          )}
        </View>
        
        {item.completedAt && (
          <Text style={styles.progressDate}>
            Complété le {new Date(item.completedAt).toLocaleDateString('fr-FR')}
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Suivi de Progression</Text>
      </View>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'user' && styles.modeButtonActive]}
          onPress={() => setUserModalVisible(true)}
        >
          <Text style={[styles.modeButtonText, viewMode === 'user' && styles.modeButtonTextActive]}>
            Par Utilisateur
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'skill' && styles.modeButtonActive]}
          onPress={() => setSkillModalVisible(true)}
        >
          <Text style={[styles.modeButtonText, viewMode === 'skill' && styles.modeButtonTextActive]}>
            Par Compétence
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'quiz' && styles.modeButtonActive]}
          onPress={handleViewQuizScores}
          disabled={actionLoading}
        >
          <Text style={[styles.modeButtonText, viewMode === 'quiz' && styles.modeButtonTextActive]}>
            Scores Quiz
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'history' && styles.modeButtonActive]}
          onPress={loadHistory}
          disabled={actionLoading}
        >
          <Text style={[styles.modeButtonText, viewMode === 'history' && styles.modeButtonTextActive]}>
            Historique
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'validated' && styles.modeButtonActive]}
          onPress={loadValidatedSkills}
          disabled={actionLoading}
        >
          <Text style={[styles.modeButtonText, viewMode === 'validated' && styles.modeButtonTextActive]}>
            Validées
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'user' && selectedUser && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedInfoText}>
            Progression de: {selectedUser.name}
          </Text>
        </View>
      )}

      {viewMode === 'skill' && selectedSkill && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedInfoText}>
            Compétence: {selectedSkill.name}
          </Text>
        </View>
      )}

      {viewMode === 'validated' ? (
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
                <View>
                  <Text style={styles.validatedUserInfo}>
                    👤 {item.userName || item.userEmail || 'Utilisateur inconnu'}
                  </Text>
                  <Text style={styles.validatedSkillScore}>
                    Score: {item.quizScore}%
                  </Text>
                </View>
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
          refreshing={actionLoading}
          onRefresh={loadValidatedSkills}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune compétence validée</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={progress}
          renderItem={renderProgressItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshing={actionLoading}
          onRefresh={() => {
            if (viewMode === 'user' && selectedUser) {
              handleSelectUser(selectedUser);
            } else if (viewMode === 'skill' && selectedSkill) {
              handleSelectSkill(selectedSkill);
            } else if (viewMode === 'quiz') {
              handleViewQuizScores();
            } else {
              loadHistory();
            }
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune progression</Text>
            </View>
          }
        />
      )}

      {/* Modal Sélection Utilisateur */}
      <Modal
        visible={userModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUserModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner un utilisateur</Text>
            <ScrollView style={styles.modalList}>
              {users.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.modalItem}
                  onPress={() => handleSelectUser(user)}
                >
                  <Text style={styles.modalItemText}>{user.name}</Text>
                  <Text style={styles.modalItemSubtext}>{user.email}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setUserModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Sélection Compétence */}
      <Modal
        visible={skillModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSkillModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner une compétence</Text>
            <ScrollView style={styles.modalList}>
              {skills.map((skill) => (
                <TouchableOpacity
                  key={skill.id}
                  style={styles.modalItem}
                  onPress={() => handleSelectSkill(skill)}
                >
                  <Text style={styles.modalItemText}>{skill.name}</Text>
                  <Text style={styles.modalItemSubtext}>{skill.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSkillModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 20,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  modeButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  selectedInfo: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  selectedInfoText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  progressUser: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressCompleted: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  progressDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 20,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    alignItems: 'flex-start',
  },
  validatedUserInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  validatedSkillScore: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  validatedSkillDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right',
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
});
