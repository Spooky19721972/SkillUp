import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { userSkillService, AvailableSkill } from '../services';
import { Alert } from 'react-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [skills, setSkills] = useState<AvailableSkill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoadingSkills(true);
      try {
        // Charger uniquement les compétences auxquelles l'utilisateur est inscrit
        const enrolledSkills = await userSkillService.getUserEnrolledSkills(user.uid);
        setSkills(enrolledSkills);
      } catch (error) {
        console.error('Erreur lors du chargement des compétences:', error);
      } finally {
        setLoadingSkills(false);
      }
    };

    load();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const quickActions = [
    { title: 'Voir résultats', screen: 'Progress', icon: '📊' },
    { title: 'Passer un quiz', screen: 'QuizList', icon: '📝' },
    { title: 'Voir badges', screen: 'Badges', icon: '🏆' },
    { title: 'Rappels', screen: 'Goals', icon: '⏰' },
  ];

  const getLevelLabel = (level?: number) => {
    if (level === undefined || level === 0) return 'Débutant';
    if (level < 35) return 'Débutant';
    if (level < 70) return 'Intermédiaire';
    return 'Avancé';
  };

  const handleDeleteSkill = async (skill: AvailableSkill) => {
    Alert.alert(
      "Se désinscrire",
      `Voulez-vous vraiment vous désinscrire de "${skill.name}" ? Votre progression sera perdue.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              if (!user) return;
              await userSkillService.unenrollFromSkill(user.uid, skill.id);
              // Recharger les compétences
              const enrolledSkills = await userSkillService.getUserEnrolledSkills(user.uid);
              setSkills(enrolledSkills);
              Alert.alert("Succès", "Vous avez été désinscrit de cette compétence");
            } catch (error: any) {
              Alert.alert("Erreur", error.message || "Impossible de se désinscrire");
            }
          }
        }
      ]
    );
  };

  const renderSkillCard = ({ item }: { item: AvailableSkill }) => {
    const level = item.userProgress?.level ?? 0;
    const levelLabel = getLevelLabel(level);

    return (
      <View style={styles.skillCard}>
        <View style={styles.skillHeader}>
          <Text style={styles.skillName}>{item.name}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{levelLabel}</Text>
          </View>
        </View>
        <Text style={styles.skillDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${level}%` }]} />
          </View>
          <Text style={styles.progressText}>{level}%</Text>
        </View>
        <View style={styles.skillActions}>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => navigation.navigate('SkillDetails' as never, { skillId: item.id } as never)}
          >
            <Text style={styles.detailButtonText}>Voir détails</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteSkill(item)}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>Bienvenue,</Text>
            <Text style={styles.title}>Ton tableau de bord</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBadge}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Text style={styles.profileInitials}>
              {user?.email?.[0]?.toUpperCase() ?? 'S'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes compétences</Text>
          {loadingSkills ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : skills.length === 0 ? (
            <Text style={styles.emptyText}>
              Aucune compétence pour l'instant. Parcours les compétences disponibles pour commencer !
            </Text>
          ) : (
            <FlatList
              data={skills.filter(skill => skill && skill.id).slice(0, 4)}
              renderItem={renderSkillCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accès rapide</Text>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.title}
                style={styles.quickActionCard}
                onPress={() => navigation.navigate(action.screen as never)}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bouton flottant pour voir les compétences disponibles */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Skills' as never)}
      >
        <Text style={styles.fabIcon}>📚</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  profileInitials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  skillCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  levelBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  skillDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressText: {
    marginLeft: 8,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  detailButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  detailButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  skillActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  quickActionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 28,
    color: '#6366f1',
    fontWeight: 'bold',
  },
});

