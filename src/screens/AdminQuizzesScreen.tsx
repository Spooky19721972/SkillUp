import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { adminQuizService } from '../services/adminQuizService';
import { adminSkillService } from '../services/adminSkillService';
import { Quiz } from '../models/Quiz';
import { Question } from '../models/Question';
import { Skill } from '../models/Skill';
import { Progress } from '../models/Progress';

export default function AdminQuizzesScreen() {
  const navigation = useNavigation();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<Array<Progress & { userName?: string; userEmail?: string }>>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [questionModalVisible, setQuestionModalVisible] = useState(false);
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    skillId: '',
    passingScore: 80,
    timeLimit: 30,
  });
  const [questionFormData, setQuestionFormData] = useState({
    content: '',
    type: 'multiple_choice' as const,
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
    order: 1,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allQuizzes, allSkills] = await Promise.all([
        adminQuizService.getAllQuizzes(),
        adminSkillService.getAllSkills(),
      ]);
      setQuizzes(allQuizzes);
      setSkills(allSkills);
    } catch (error: any) {
      console.error('Erreur loadData:', error);
      Alert.alert(
        'Erreur de chargement',
        'Impossible de charger les quiz et compétences. Vérifiez votre connexion internet et réessayez.',
        [
          { text: 'Réessayer', onPress: () => loadData() },
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async (quizId: string) => {
    if (!quizId) {
      console.warn('loadQuestions: quizId est vide');
      setQuestions([]);
      return;
    }

    try {
      const quizQuestions = await adminQuizService.getQuizQuestions(quizId);
      setQuestions(quizQuestions || []);
    } catch (error: any) {
      console.error('Erreur loadQuestions:', error);
      // Ne pas afficher d'alerte si c'est juste qu'il n'y a pas de questions
      // Initialiser avec un tableau vide pour permettre l'ajout
      setQuestions([]);
    }
  };

  const handleAddQuiz = () => {
    setEditingQuiz(null);
    setFormData({ title: '', skillId: '', passingScore: 80, timeLimit: 30 });
    setModalVisible(true);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      title: quiz.title,
      skillId: quiz.skillId || '',
      passingScore: quiz.passingScore || 80,
      timeLimit: quiz.timeLimit || 30,
    });
    setModalVisible(true);
  };

  const handleSaveQuiz = async () => {
    if (!formData.title || !formData.skillId) {
      Alert.alert('Erreur', 'Le titre et la compétence sont requis');
      return;
    }

    setActionLoading(true);
    try {
      if (editingQuiz) {
        await adminQuizService.updateQuiz(editingQuiz.id, formData);
        Alert.alert('Succès', 'Quiz modifié avec succès');
      } else {
        await adminQuizService.addQuiz(formData);
        Alert.alert('Succès', 'Quiz ajouté avec succès');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuiz = (quiz: Quiz) => {
    Alert.alert(
      'Supprimer',
      `Êtes-vous sûr de vouloir supprimer le quiz "${quiz.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminQuizService.deleteQuiz(quiz.id);
              Alert.alert('Succès', 'Quiz supprimé avec succès');
              loadData();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleManageQuestions = async (quiz: Quiz) => {
    if (!quiz || !quiz.id) {
      Alert.alert('Erreur', 'Quiz invalide');
      return;
    }
    setSelectedQuiz(quiz);
    try {
      await loadQuestions(quiz.id);
      setQuestionModalVisible(true);
    } catch (error: any) {
      console.error('Erreur handleManageQuestions:', error);
      // Ouvrir quand même le modal même en cas d'erreur pour permettre l'ajout
      setQuestionModalVisible(true);
    }
  };

  const handleAddQuestion = () => {
    setQuestionFormData({
      content: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      order: questions.length + 1,
    });
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuiz || !questionFormData.content) {
      Alert.alert('Erreur', 'Le contenu de la question est requis');
      return;
    }

    if (questionFormData.options.filter(o => o).length < 2) {
      Alert.alert('Erreur', 'Au moins 2 options sont requises');
      return;
    }

    // Vérifier qu'une seule bonne réponse est sélectionnée
    const filledOptions = questionFormData.options.filter(o => o);
    if (!filledOptions.includes(questionFormData.correctAnswer)) {
      Alert.alert('Erreur', 'La bonne réponse doit correspondre à une des options');
      return;
    }

    if (!questionFormData.correctAnswer) {
      Alert.alert('Erreur', 'La bonne réponse est requise');
      return;
    }

    setActionLoading(true);
    try {
      await adminQuizService.addQuestion({
        ...questionFormData,
        quizId: selectedQuiz.id,
        options: questionFormData.options.filter(o => o), // Filtrer les options vides
      });
      Alert.alert('Succès', 'Question ajoutée avec succès');
      await loadQuestions(selectedQuiz.id);
      setQuestionFormData({
        content: '',
        type: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1,
        order: questions.length + 2,
      });
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuestion = async (question: Question) => {
    if (!selectedQuiz) return;

    Alert.alert(
      'Supprimer',
      `Êtes-vous sûr de vouloir supprimer cette question ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminQuizService.deleteQuestion(question.id);
              Alert.alert('Succès', 'Question supprimée avec succès');
              await loadQuestions(selectedQuiz.id);
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewResults = async (quiz: Quiz) => {
    setActionLoading(true);
    try {
      const quizResults = await adminQuizService.getQuizResults(quiz.id);
      setSelectedQuiz(quiz);
      setResults(quizResults);
      setResultsModalVisible(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les résultats');
    } finally {
      setActionLoading(false);
    }
  };

  const renderQuizItem = ({ item }: { item: Quiz }) => (
    <View style={styles.quizCard}>
      <View style={styles.quizInfo}>
        <Text style={styles.quizName}>{item.title}</Text>
        <Text style={styles.quizDetails}>
          Score minimum: {item.passingScore || 80}% | Temps: {item.timeLimit || 30} min
        </Text>
        <Text style={styles.quizQuestions}>
          {item.questions?.length || 0} question(s)
        </Text>
      </View>

      <View style={styles.quizActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditQuiz(item)}
        >
          <Text style={styles.actionButtonText}>Modifier</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.questionsButton]}
          onPress={() => handleManageQuestions(item)}
        >
          <Text style={styles.actionButtonText}>Questions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.resultsButton]}
          onPress={() => handleViewResults(item)}
          disabled={actionLoading}
        >
          <Text style={styles.actionButtonText}>Résultats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteQuiz(item)}
          disabled={actionLoading}
        >
          <Text style={styles.actionButtonText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
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
        <View style={styles.headerContent}>
          <Text style={styles.title}>Gérer les Quiz</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddQuiz}>
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>{quizzes.length} quiz</Text>
      </View>

      <FlatList
        data={quizzes}
        renderItem={renderQuizItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadData}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun quiz</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddQuiz}
            >
              <Text style={styles.emptyButtonText}>Créer le premier quiz</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal Ajout/Modification Quiz */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingQuiz ? 'Modifier le quiz' : 'Ajouter un quiz'}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Titre du quiz"
              placeholderTextColor="#9CA3AF"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <Text style={styles.modalLabel}>Compétence associée</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Rechercher une compétence..."
              placeholderTextColor="#9CA3AF"
              value={skillSearchQuery}
              onChangeText={setSkillSearchQuery}
            />
            <ScrollView style={styles.skillsDropdown}>
              {skills
                .filter(skill =>
                  skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                  skill.description?.toLowerCase().includes(skillSearchQuery.toLowerCase())
                )
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((skill) => (
                  <TouchableOpacity
                    key={skill.id}
                    style={[
                      styles.skillOption,
                      formData.skillId === skill.id && styles.skillOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, skillId: skill.id })}
                  >
                    <View style={styles.skillOptionContent}>
                      <Text
                        style={[
                          styles.skillOptionText,
                          formData.skillId === skill.id && styles.skillOptionTextSelected,
                        ]}
                      >
                        {skill.name}
                      </Text>
                      {skill.description && (
                        <Text style={styles.skillDescription} numberOfLines={1}>
                          {skill.description}
                        </Text>
                      )}
                    </View>
                    {formData.skillId === skill.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              {skills.filter(skill =>
                skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                skill.description?.toLowerCase().includes(skillSearchQuery.toLowerCase())
              ).length === 0 && (
                  <View style={styles.emptySkillsContainer}>
                    <Text style={styles.emptySkillsText}>Aucune compétence trouvée</Text>
                  </View>
                )}
            </ScrollView>
            <Text style={styles.skillCount}>
              {skills.filter(skill =>
                skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                skill.description?.toLowerCase().includes(skillSearchQuery.toLowerCase())
              ).length} compétence(s) disponible(s)
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Score minimum (%)"
              placeholderTextColor="#9CA3AF"
              value={formData.passingScore.toString()}
              onChangeText={(text) => setFormData({ ...formData, passingScore: parseInt(text) || 80 })}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Temps limite (minutes)"
              placeholderTextColor="#9CA3AF"
              value={formData.timeLimit.toString()}
              onChangeText={(text) => setFormData({ ...formData, timeLimit: parseInt(text) || 30 })}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveQuiz}
                disabled={actionLoading}
              >
                <Text style={styles.saveButtonText}>
                  {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Gestion des Questions */}
      <Modal
        visible={questionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setQuestionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.questionModalContent]}>
            <Text style={styles.modalTitle}>
              Questions - {selectedQuiz?.title}
            </Text>

            <ScrollView
              style={styles.questionsList}
              contentContainerStyle={styles.questionsListContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {questions.map((question, index) => (
                <View key={question.id} style={styles.questionItem}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>Q{index + 1}</Text>
                    <View style={styles.questionInfo}>
                      <Text style={styles.questionContent}>{question.content}</Text>
                      <Text style={styles.questionType}>
                        Type: Choix multiple
                      </Text>
                      <Text style={styles.questionPoints}>
                        Points: {question.points}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteQuestionButton}
                      onPress={() => handleDeleteQuestion(question)}
                    >
                      <Text style={styles.deleteQuestionButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.addQuestionSection}>
                <Text style={styles.sectionTitle}>Ajouter une question</Text>

                <TextInput
                  style={styles.modalInput}
                  placeholder="Contenu de la question"
                  placeholderTextColor="#9CA3AF"
                  value={questionFormData.content}
                  onChangeText={(text) => setQuestionFormData({ ...questionFormData, content: text })}
                />

                <Text style={styles.modalLabel}>Type de question</Text>
                <Text style={styles.infoText}>
                  Les questions sont limitées aux choix multiples avec une seule bonne réponse.
                </Text>

                <View>
                  <Text style={styles.modalLabel}>Options de réponse (choix multiples)</Text>
                  {questionFormData.options.map((option, index) => (
                    <TextInput
                      key={index}
                      style={styles.modalInput}
                      placeholder={`Option ${index + 1}`}
                      placeholderTextColor="#9CA3AF"
                      value={option}
                      onChangeText={(text) => {
                        const newOptions = [...questionFormData.options];
                        newOptions[index] = text;
                        setQuestionFormData({ ...questionFormData, options: newOptions });
                      }}
                    />
                  ))}
                </View>

                <Text style={styles.modalLabel}>Bonne réponse</Text>
                <View style={styles.correctAnswerContainer}>
                  {questionFormData.options.filter(o => o).map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.correctAnswerOption,
                        questionFormData.correctAnswer === option && styles.correctAnswerOptionSelected,
                      ]}
                      onPress={() => setQuestionFormData({ ...questionFormData, correctAnswer: option })}
                    >
                      <Text
                        style={[
                          styles.correctAnswerOptionText,
                          questionFormData.correctAnswer === option && styles.correctAnswerOptionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.modalInput}
                  placeholder="Points"
                  placeholderTextColor="#9CA3AF"
                  value={questionFormData.points.toString()}
                  onChangeText={(text) => setQuestionFormData({ ...questionFormData, points: parseInt(text) || 1 })}
                  keyboardType="numeric"
                />

                <TouchableOpacity
                  style={styles.addQuestionButton}
                  onPress={handleSaveQuestion}
                  disabled={actionLoading}
                >
                  <Text style={styles.addQuestionButtonText}>
                    {actionLoading ? 'Ajout...' : 'Ajouter la question'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setQuestionModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Fermer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Résultats */}
      <Modal
        visible={resultsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setResultsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Résultats - {selectedQuiz?.title}
            </Text>
            <ScrollView style={styles.resultsList}>
              {results.length === 0 ? (
                <Text style={styles.noResultsText}>Aucun résultat</Text>
              ) : (
                results.map((result) => (
                  <View key={result.id} style={styles.resultItem}>
                    <Text style={styles.resultUserName}>
                      {result.userName || result.userEmail || 'Utilisateur inconnu'}
                    </Text>
                    <View style={styles.resultDetails}>
                      <Text style={styles.resultScore}>
                        Score: {result.percentage}%
                      </Text>
                      <Text style={styles.resultStatus}>
                        {result.completed ? '✓ Complété' : 'En cours'}
                      </Text>
                    </View>
                    {result.completedAt && (
                      <Text style={styles.resultDate}>
                        Complété le {new Date(result.completedAt).toLocaleDateString('fr-FR')}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setResultsModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  },
  quizInfo: {
    marginBottom: 15,
  },
  quizName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  quizDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  quizQuestions: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  quizActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  questionsButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  resultsButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  actionButtonText: {
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
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  questionModalContent: {
    maxHeight: '90%',
    height: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#111827',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  questionsList: {
    flex: 1,
  },
  questionsListContent: {
    paddingBottom: 20,
  },
  questionItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6366f1',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: 'bold',
    marginRight: 10,
  },
  questionInfo: {
    flex: 1,
  },
  questionContent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  questionType: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  questionPoints: {
    fontSize: 12,
    color: '#6B7280',
  },
  deleteQuestionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteQuestionButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addQuestionSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  questionTypeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  questionTypeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  questionTypeOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366f1',
  },
  questionTypeOptionText: {
    fontSize: 12,
    color: '#111827',
  },
  questionTypeOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  trueFalseOption: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trueFalseOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366f1',
  },
  trueFalseOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  trueFalseOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  addQuestionButton: {
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    marginTop: 10,
  },
  addQuestionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsList: {
    maxHeight: 400,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#6B7280',
    paddingVertical: 40,
  },
  resultItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  resultScore: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  resultStatus: {
    fontSize: 14,
    color: '#22C55E',
  },
  resultDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  skillsDropdown: {
    maxHeight: 150,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  skillOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  skillOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  skillOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  skillOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  checkmark: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  skillOptionContent: {
    flex: 1,
  },
  skillDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  skillCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySkillsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptySkillsText: {
    color: '#6B7280',
    fontSize: 14,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  correctAnswerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  correctAnswerOption: {
    flex: 1,
    minWidth: '45%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  correctAnswerOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366f1',
  },
  correctAnswerOptionText: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  correctAnswerOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
});
