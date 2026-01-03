import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { adminQuizService } from '../services/adminQuizService';
import { adminSkillService } from '../services/adminSkillService';
import { Quiz } from '../models/Quiz';
import { Skill } from '../models/Skill';

export default function QuizListScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Array<Quiz & { skillName?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allQuizzes = await adminQuizService.getAllQuizzes();
      // Enrichir avec les noms des compétences
      const enrichedQuizzes = await Promise.all(
        allQuizzes.map(async (quiz) => {
          if (quiz.skillId) {
            try {
              const skill = await adminSkillService.getSkillById(quiz.skillId);
              return {
                ...quiz,
                skillName: skill?.name || 'Compétence inconnue',
              };
            } catch {
              return { ...quiz, skillName: 'Compétence inconnue' };
            }
          }
          return quiz;
        })
      );
      setQuizzes(enrichedQuizzes);
    } catch (error) {
      console.error('Erreur lors du chargement des quiz:', error);
      Alert.alert('Erreur', 'Impossible de charger les quiz disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeQuiz = (quiz: Quiz) => {
    if (quiz.skillId) {
      navigation.navigate('Quiz' as never, { quizId: quiz.id, skillId: quiz.skillId } as never);
    } else {
      navigation.navigate('Quiz' as never, { quizId: quiz.id } as never);
    }
  };

  const renderQuizItem = ({ item }: { item: Quiz & { skillName?: string } }) => (
    <TouchableOpacity
      style={styles.quizCard}
      onPress={() => handleTakeQuiz(item)}
    >
      <View style={styles.quizInfo}>
        <Text style={styles.quizTitle}>{item.title}</Text>
        {item.skillName && (
          <Text style={styles.quizSkill}>📚 {item.skillName}</Text>
        )}
        <View style={styles.quizDetails}>
          <Text style={styles.quizDetailText}>
            Score minimum: {item.passingScore || 80}%
          </Text>
          {item.timeLimit && (
            <Text style={styles.quizDetailText}>
              Temps: {item.timeLimit} min
            </Text>
          )}
        </View>
        <Text style={styles.quizQuestions}>
          {item.questions?.length || 0} question(s)
        </Text>
      </View>
      <View style={styles.quizAction}>
        <Text style={styles.quizActionText}>Commencer →</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement des quiz...</Text>
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
        <Text style={styles.title}>Quiz Disponibles</Text>
        <Text style={styles.subtitle}>
          Choisissez un quiz pour tester vos connaissances
        </Text>
      </View>

      <FlatList
        data={quizzes}
        renderItem={renderQuizItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Aucun quiz disponible pour le moment
            </Text>
            <Text style={styles.emptySubtext}>
              Les quiz apparaîtront ici une fois créés par l'administrateur
            </Text>
          </View>
        }
        refreshing={loading}
        onRefresh={loadQuizzes}
      />
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  list: {
    padding: 20,
  },
  quizCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quizInfo: {
    flex: 1,
    marginRight: 15,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  quizSkill: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  quizDetails: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 8,
  },
  quizDetailText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  quizQuestions: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  quizAction: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  quizActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
  },
});

