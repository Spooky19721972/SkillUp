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
import { adminSkillService } from '../services/adminSkillService';
import { Skill } from '../models/Skill';
import { Course } from '../models/Course';
import { Quiz } from '../models/Quiz';
import { Badge } from '../models/Badge';

export default function AdminSkillsScreen() {
  const navigation = useNavigation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [associationsModalVisible, setAssociationsModalVisible] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const allSkills = await adminSkillService.getAllSkills();
      setSkills(allSkills);
    } catch (error) {
      console.error('Erreur chargement compétences:', error);
      Alert.alert('Erreur', 'Impossible de charger les compétences');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    setEditingSkill(null);
    setFormData({ name: '', description: '' });
    setModalVisible(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      description: skill.description,
    });
    setModalVisible(true);
  };

  const handleSaveSkill = async () => {
    if (!formData.name) {
      Alert.alert('Erreur', 'Le nom de la compétence est requis');
      return;
    }

    setActionLoading(true);
    try {
      if (editingSkill) {
        await adminSkillService.updateSkill(editingSkill.id, formData);
        Alert.alert('Succès', 'Compétence modifiée avec succès');
      } else {
        await adminSkillService.addSkill({
          ...formData,
          userId: '', // Compétence globale, pas liée à un utilisateur
        });
        Alert.alert('Succès', 'Compétence ajoutée avec succès');
      }
      setModalVisible(false);
      loadSkills();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSkill = (skill: Skill) => {
    Alert.alert(
      'Supprimer',
      `Êtes-vous sûr de vouloir supprimer la compétence "${skill.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminSkillService.deleteSkill(skill.id);
              Alert.alert('Succès', 'Compétence supprimée avec succès');
              loadSkills();
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

  const handleViewAssociations = async (skill: Skill) => {
    setActionLoading(true);
    setSelectedSkill(skill);
    try {
      const [skillCourses, skillQuizzes, skillBadges] = await Promise.all([
        adminSkillService.getSkillCourses(skill.id),
        adminSkillService.getSkillQuizzes(skill.id),
        adminSkillService.getSkillBadges(skill.id),
      ]);
      setCourses(skillCourses);
      setQuizzes(skillQuizzes);
      setBadges(skillBadges);
      setAssociationsModalVisible(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les associations');
    } finally {
      setActionLoading(false);
    }
  };

  const renderSkillItem = ({ item }: { item: Skill }) => (
    <View style={styles.skillCard}>
      <View style={styles.skillInfo}>
        <Text style={styles.skillName}>{item.name}</Text>
        <Text style={styles.skillDescription} numberOfLines={2}>
          {item.description || 'Aucune description'}
        </Text>
      </View>

      <View style={styles.skillActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditSkill(item)}
        >
          <Text style={styles.actionButtonText}>Modifier</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.associationsButton]}
          onPress={() => handleViewAssociations(item)}
          disabled={actionLoading}
        >
          <Text style={styles.actionButtonText}>Associations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteSkill(item)}
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
          <Text style={styles.loadingText}>Chargement des compétences...</Text>
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
          <Text style={styles.title}>Gérer les Compétences</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddSkill}>
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>{skills.length} compétence(s)</Text>
      </View>

      <FlatList
        data={skills}
        renderItem={renderSkillItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadSkills}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune compétence</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddSkill}
            >
              <Text style={styles.emptyButtonText}>Créer la première compétence</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal Ajout/Modification */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingSkill ? 'Modifier la compétence' : 'Ajouter une compétence'}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nom de la compétence"
              placeholderTextColor="#9CA3AF"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Description"
              placeholderTextColor="#9CA3AF"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
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
                onPress={handleSaveSkill}
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

      {/* Modal Associations */}
      <Modal
        visible={associationsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAssociationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Associations - {selectedSkill?.name}
            </Text>

            <ScrollView style={styles.associationsList}>
              {/* Cours */}
              <View style={styles.associationSection}>
                <Text style={styles.associationTitle}>📚 Cours ({courses.length})</Text>
                {courses.length === 0 ? (
                  <Text style={styles.noAssociationText}>Aucun cours associé</Text>
                ) : (
                  courses.map((course) => (
                    <View key={course.id} style={styles.associationItem}>
                      <Text style={styles.associationItemText}>{course.title}</Text>
                    </View>
                  ))
                )}
              </View>

              {/* Quiz */}
              <View style={styles.associationSection}>
                <Text style={styles.associationTitle}>📝 Quiz ({quizzes.length})</Text>
                {quizzes.length === 0 ? (
                  <Text style={styles.noAssociationText}>Aucun quiz associé</Text>
                ) : (
                  quizzes.map((quiz) => (
                    <View key={quiz.id} style={styles.associationItem}>
                      <Text style={styles.associationItemText}>{quiz.title}</Text>
                    </View>
                  ))
                )}
              </View>

              {/* Badges */}
              <View style={styles.associationSection}>
                <Text style={styles.associationTitle}>🏆 Badges ({badges.length})</Text>
                {badges.length === 0 ? (
                  <Text style={styles.noAssociationText}>Aucun badge associé</Text>
                ) : (
                  badges.map((badge) => (
                    <View key={badge.id} style={styles.associationItem}>
                      <Text style={styles.associationItemText}>{badge.title}</Text>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setAssociationsModalVisible(false)}
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
  skillCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skillInfo: {
    marginBottom: 15,
  },
  skillName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  skillDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  skillActions: {
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
  associationsButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  associationsList: {
    maxHeight: 400,
  },
  associationSection: {
    marginBottom: 25,
  },
  associationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  noAssociationText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  associationItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  associationItemText: {
    fontSize: 14,
    color: '#111827',
  },
});
