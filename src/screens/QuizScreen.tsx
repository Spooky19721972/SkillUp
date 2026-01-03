import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { quizService } from '../services';
import { skillValidationService } from '../services/skillValidationService';
import { adminSkillService } from '../services/adminSkillService';
import { Quiz, Question } from '../models';

export default function QuizScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const route = useRoute();
  const { quizId, skillId } = (route.params as { quizId?: string; skillId?: string }) || {};
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<{ score: number; total: number; percentage: number } | null>(null);
  const [badgesUnlocked, setBadgesUnlocked] = useState<any[]>([]);
  const [skillValidated, setSkillValidated] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [quizId, skillId]);

  const loadQuiz = async () => {
    try {
      let targetQuizId = quizId;
      
      // Si pas de quizId mais skillId fourni, trouver le quiz associé
      if (!targetQuizId && skillId) {
        const quizzes = await adminSkillService.getSkillQuizzes(skillId);
        const validQuizzes = quizzes.filter(q => q && q.id);
        if (validQuizzes.length > 0 && validQuizzes[0]?.id) {
          targetQuizId = validQuizzes[0].id;
        } else {
          Alert.alert('Erreur', 'Aucun quiz disponible pour cette compétence');
          navigation.goBack();
          return;
        }
      }
      
      if (!targetQuizId) {
        Alert.alert('Erreur', 'Quiz introuvable');
        navigation.goBack();
        return;
      }
      
      const data = await quizService.getQuizWithQuestions(targetQuizId);
      if (data) {
        setQuiz(data.quiz);
        setQuestions(data.questions);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger le quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    const unansweredQuestions = questions.filter(q => q && q.id && !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      Alert.alert(
        'Questions non répondues',
        `Il reste ${unansweredQuestions.length} question(s) sans réponse. Voulez-vous continuer ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Continuer', onPress: submitQuiz },
        ]
      );
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      // Déterminer le quizId cible
      let targetQuizId = quizId;
      if (!targetQuizId && skillId) {
        const quizzes = await adminSkillService.getSkillQuizzes(skillId);
        const validQuizzes = quizzes.filter(q => q && q.id);
        targetQuizId = validQuizzes.length > 0 ? validQuizzes[0].id : null;
      }
      if (!targetQuizId) {
        throw new Error('Quiz introuvable');
      }

      // Soumettre toutes les réponses
      const validQuestions = questions.filter(q => q && q.id);
      const responsePromises = validQuestions.map(async (question) => {
        const userAnswer = answers[question.id] || '';
        const isCorrect = quizService.checkAnswer(question, userAnswer);
        await quizService.submitResponse(user.uid, {
          questionId: question.id,
          quizId: targetQuizId,
          userAnswer,
          isCorrect,
        });
        return { questionId: question.id, isCorrect };
      });

      await Promise.all(responsePromises);
      
      const quizScore = await quizService.calculateQuizScore(targetQuizId, user.uid);
      setScore(quizScore);
      
      // Vérifier si le quiz est réussi (score >= passingScore ou 80% par défaut)
      const passingScore = quiz?.passingScore ?? 80;
      const isPassed = quizScore.percentage >= passingScore;
      
      // Si le quiz est réussi et qu'une skillId est fournie, valider la compétence
      if (isPassed && skillId) {
        try {
          const validationResult = await skillValidationService.validateSkill(
            user.uid,
            skillId,
            quizScore.percentage
          );
          setSkillValidated(validationResult.skillValidated);
          setBadgesUnlocked(validationResult.badgesUnlocked);
          
          if (validationResult.badgesUnlocked.length > 0) {
            Alert.alert(
              '🎉 Félicitations !',
              `Compétence validée ! Vous avez débloqué ${validationResult.badgesUnlocked.length} badge(s) !`,
              [
                {
                  text: 'Voir les badges',
                  onPress: () => navigation.navigate('Badges' as never),
                },
                { text: 'OK' },
              ]
            );
          } else {
            Alert.alert('🎉 Félicitations !', 'Compétence validée à 100% !');
          }
        } catch (validationError: any) {
          console.error('Erreur lors de la validation:', validationError);
          // Ne pas bloquer l'affichage des résultats même si la validation échoue
        }
      }
      
      setShowResults(true);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </LinearGradient>
    );
  }

  if (showResults && score) {
    const passingScore = quiz?.passingScore ?? 80;
    const isPassed = score.percentage >= passingScore;
    
    return (
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Résultats du Quiz</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{score.score} / {score.total}</Text>
            <Text style={styles.percentageText}>{score.percentage}%</Text>
          </View>
          
          {isPassed ? (
            <>
              <Text style={styles.resultsMessage}>🎉 Excellent travail !</Text>
              {skillValidated && (
                <View style={styles.successCard}>
                  <Text style={styles.successTitle}>✅ Compétence validée !</Text>
                  <Text style={styles.successText}>Votre progression est maintenant à 100%</Text>
                </View>
              )}
              {badgesUnlocked.length > 0 && (
                <View style={styles.badgesCard}>
                  <Text style={styles.badgesTitle}>🏆 Badges débloqués</Text>
                  {badgesUnlocked.filter(badge => badge && badge.id).map((badge) => (
                    <View key={badge.id} style={styles.badgeItem}>
                      <Text style={styles.badgeName}>{badge.title}</Text>
                      <Text style={styles.badgeDescription}>{badge.description}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <Text style={styles.resultsMessage}>
              {score.percentage >= 50 ? '👍 Bien joué ! Réessayez pour valider la compétence.' : '💪 Continue tes efforts !'}
            </Text>
          )}
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (skillId) {
                navigation.navigate('SkillDetails' as never, { skillId } as never);
              } else {
                navigation.goBack();
              }
            }}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion || !currentQuestion.id) {
    return (
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Erreur</Text>
          <Text style={styles.resultsMessage}>Question introuvable</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }
  const currentAnswer = answers[currentQuestion.id] || '';

  return (
    <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.quizTitle}>{quiz?.title}</Text>
        <Text style={styles.questionCounter}>
          Question {currentQuestionIndex + 1} / {questions.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.content}</Text>

          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.option,
                    currentAnswer === option && styles.optionSelected,
                  ]}
                  onPress={() => handleAnswer(currentQuestion.id, option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      currentAnswer === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {currentQuestion.type === 'true_false' && (
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.option,
                  currentAnswer === 'true' && styles.optionSelected,
                ]}
                onPress={() => handleAnswer(currentQuestion.id, 'true')}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentAnswer === 'true' && styles.optionTextSelected,
                  ]}
                >
                  Vrai
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.option,
                  currentAnswer === 'false' && styles.optionSelected,
                ]}
                onPress={() => handleAnswer(currentQuestion.id, 'false')}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentAnswer === 'false' && styles.optionTextSelected,
                  ]}
                >
                  Faux
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={styles.navButtonText}>← Précédent</Text>
          </TouchableOpacity>

          {currentQuestionIndex < questions.length - 1 ? (
            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <Text style={styles.navButtonText}>Suivant →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Soumission...' : 'Terminer'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  quizTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  questionCounter: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  navButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FFFFFF',
  },
  submitButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  percentageText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultsMessage: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  badgesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  badgesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  badgeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

