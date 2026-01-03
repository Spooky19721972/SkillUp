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
import { adminBadgeService } from '../services/adminBadgeService';
import { adminSkillService } from '../services/adminSkillService';
import { Badge, BadgeCondition } from '../models/Badge';
import { Skill } from '../models/Skill';

export default function AdminBadgesScreen() {
  const navigation = useNavigation();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: '',
    color: '#6366f1',
    image: '',
    skillId: '',
    conditionType: 'complete_skills' as BadgeCondition['type'],
    conditionValue: 5,
    conditionSkillIds: [] as string[],
    conditionQuizId: '',
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
      const [allBadges, allSkills] = await Promise.all([
        adminBadgeService.getAllBadges(),
        adminSkillService.getAllSkills(),
      ]);
      setBadges(allBadges);
      setSkills(allSkills);
    } catch (error: any) {
      console.error('Erreur loadData:', error);
      Alert.alert(
        'Erreur de chargement',
        'Impossible de charger les badges et compétences. Vérifiez votre connexion internet et réessayez.',
        [
          { text: 'Réessayer', onPress: () => loadData() },
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddBadge = () => {
    setEditingBadge(null);
    setFormData({
      title: '',
      description: '',
      icon: '',
      color: '#6366f1',
      image: '',
      skillId: '',
      conditionType: 'complete_skills',
      conditionValue: 5,
      conditionSkillIds: [],
      conditionQuizId: '',
    });
    setModalVisible(true);
  };

  const handleEditBadge = (badge: Badge) => {
    setEditingBadge(badge);
    setFormData({
      title: badge.title,
      description: badge.description,
      icon: badge.icon || '',
      color: badge.color || '#6366f1',
      image: badge.image || '',
      skillId: badge.skillId || '',
      conditionType: badge.conditions?.type || 'complete_skills',
      conditionValue: badge.conditions?.value || 5,
      conditionSkillIds: badge.conditions?.skillIds || [],
      conditionQuizId: badge.conditions?.quizId || '',
    });
    setModalVisible(true);
  };

  const handleSaveBadge = async () => {
    if (!formData.title || !formData.description) {
      Alert.alert('Erreur', 'Le titre et la description sont requis');
      return;
    }

    setActionLoading(true);
    try {
      // Construire l'objet badge en excluant les champs undefined
      const badgeData: any = {
        title: formData.title,
        description: formData.description,
        color: formData.color,
        conditions: {
          type: formData.conditionType,
          value: formData.conditionValue,
        },
      };

      // Ajouter les champs optionnels uniquement s'ils sont définis
      if (formData.icon && formData.icon.trim()) {
        badgeData.icon = formData.icon;
      }
      if (formData.image && formData.image.trim()) {
        badgeData.image = formData.image;
      }
      if (formData.skillId && formData.skillId.trim()) {
        badgeData.skillId = formData.skillId;
      }
      if (formData.conditionSkillIds.length > 0) {
        badgeData.conditions.skillIds = formData.conditionSkillIds;
      }
      if (formData.conditionQuizId && formData.conditionQuizId.trim()) {
        badgeData.conditions.quizId = formData.conditionQuizId;
      }

      if (editingBadge) {
        await adminBadgeService.updateBadge(editingBadge.id, badgeData);
        Alert.alert('Succès', 'Badge modifié avec succès');
      } else {
        await adminBadgeService.createBadge(badgeData);
        Alert.alert('Succès', 'Badge créé avec succès');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBadge = (badge: Badge) => {
    Alert.alert(
      'Supprimer',
      `Êtes-vous sûr de vouloir supprimer le badge "${badge.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminBadgeService.deleteBadge(badge.id);
              Alert.alert('Succès', 'Badge supprimé avec succès');
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

  const toggleSkillSelection = (skillId: string) => {
    const isSelected = formData.conditionSkillIds.includes(skillId);
    setFormData({
      ...formData,
      conditionSkillIds: isSelected
        ? formData.conditionSkillIds.filter(id => id !== skillId)
        : [...formData.conditionSkillIds, skillId],
    });
  };

  const renderBadgeItem = ({ item }: { item: Badge }) => {
    const skill = skills.find(s => s.id === item.skillId);
    const conditionText = item.conditions
      ? item.conditions.type === 'complete_skills'
        ? `Terminer ${item.conditions.value} compétence(s)`
        : item.conditions.type === 'quiz_score'
          ? `Avoir ${item.conditions.value}% dans un quiz`
          : item.conditions.type === 'complete_courses'
            ? `Terminer ${item.conditions.value} cours`
            : 'Condition personnalisée'
      : 'Aucune condition';

    return (
      <View style={styles.badgeCard}>
        <View style={styles.badgeHeader}>
          {item.icon && <Text style={styles.badgeIcon}>{item.icon}</Text>}
          <View style={styles.badgeInfo}>
            <Text style={styles.badgeName}>{item.title}</Text>
            <Text style={styles.badgeDescription} numberOfLines={2}>
              {item.description}
            </Text>
            {skill && (
              <Text style={styles.badgeSkill}>
                Compétence: {skill.name}
              </Text>
            )}
            <Text style={styles.badgeCondition}>{conditionText}</Text>
          </View>
        </View>

        <View style={styles.badgeActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditBadge(item)}
          >
            <Text style={styles.actionButtonText}>Modifier</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteBadge(item)}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement des badges...</Text>
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
          <Text style={styles.title}>Gérer les Badges</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddBadge}>
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>{badges.length} badge(s)</Text>
      </View>

      <FlatList
        data={badges}
        renderItem={renderBadgeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadData}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun badge</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddBadge}
            >
              <Text style={styles.emptyButtonText}>Créer le premier badge</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal Ajout/Modification Badge */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingBadge ? 'Modifier le badge' : 'Créer un badge'}
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Titre du badge"
                placeholderTextColor="#9CA3AF"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
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

              <TextInput
                style={styles.modalInput}
                placeholder="Icône (emoji)"
                placeholderTextColor="#9CA3AF"
                value={formData.icon}
                onChangeText={(text) => setFormData({ ...formData, icon: text })}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="URL de l'image"
                placeholderTextColor="#9CA3AF"
                value={formData.image}
                onChangeText={(text) => setFormData({ ...formData, image: text })}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Couleur (hex)"
                placeholderTextColor="#9CA3AF"
                value={formData.color}
                onChangeText={(text) => setFormData({ ...formData, color: text })}
              />

              <Text style={styles.modalLabel}>Compétence associée (optionnel)</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Rechercher une compétence..."
                placeholderTextColor="#9CA3AF"
                value={skillSearchQuery}
                onChangeText={setSkillSearchQuery}
              />
              <ScrollView style={styles.skillsList}>
                <TouchableOpacity
                  style={[
                    styles.skillOption,
                    !formData.skillId && styles.skillOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, skillId: '' })}
                >
                  <Text
                    style={[
                      styles.skillOptionText,
                      !formData.skillId && styles.skillOptionTextSelected,
                    ]}
                  >
                    Aucune
                  </Text>
                </TouchableOpacity>
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
                ).length === 0 && skillSearchQuery !== '' && (
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

              <Text style={styles.modalLabel}>Type de condition</Text>
              <View style={styles.conditionTypeContainer}>
                {(['complete_skills', 'quiz_score', 'complete_courses'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.conditionTypeOption,
                      formData.conditionType === type && styles.conditionTypeOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, conditionType: type })}
                  >
                    <Text
                      style={[
                        styles.conditionTypeOptionText,
                        formData.conditionType === type && styles.conditionTypeOptionTextSelected,
                      ]}
                    >
                      {type === 'complete_skills'
                        ? 'Terminer compétences'
                        : type === 'quiz_score'
                          ? 'Score quiz'
                          : 'Terminer cours'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Valeur (nombre)"
                placeholderTextColor="#9CA3AF"
                value={formData.conditionValue.toString()}
                onChangeText={(text) => setFormData({ ...formData, conditionValue: parseInt(text) || 0 })}
                keyboardType="numeric"
              />

              {formData.conditionType === 'complete_skills' && (
                <View>
                  <Text style={styles.modalLabel}>Compétences spécifiques (optionnel)</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Rechercher une compétence..."
                    placeholderTextColor="#9CA3AF"
                    value={skillSearchQuery}
                    onChangeText={setSkillSearchQuery}
                  />
                  <ScrollView
                    style={styles.specificSkillsList}
                    nestedScrollEnabled={true}
                  >
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
                            formData.conditionSkillIds.includes(skill.id) && styles.skillOptionSelected,
                          ]}
                          onPress={() => toggleSkillSelection(skill.id)}
                        >
                          <View style={styles.skillOptionContent}>
                            <Text
                              style={[
                                styles.skillOptionText,
                                formData.conditionSkillIds.includes(skill.id) && styles.skillOptionTextSelected,
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
                          {formData.conditionSkillIds.includes(skill.id) && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    {skills.filter(skill =>
                      skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                      skill.description?.toLowerCase().includes(skillSearchQuery.toLowerCase())
                    ).length === 0 && skillSearchQuery !== '' && (
                        <View style={styles.emptySkillsContainer}>
                          <Text style={styles.emptySkillsText}>Aucune compétence trouvée</Text>
                        </View>
                      )}
                  </ScrollView>
                  <Text style={styles.skillCount}>
                    {formData.conditionSkillIds.length} sélectionnée(s) / {skills.filter(skill =>
                      skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                      skill.description?.toLowerCase().includes(skillSearchQuery.toLowerCase())
                    ).length} disponible(s)
                  </Text>
                </View>
              )}

              {formData.conditionType === 'quiz_score' && (
                <TextInput
                  style={styles.modalInput}
                  placeholder="ID du quiz (optionnel)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.conditionQuizId}
                  onChangeText={(text) => setFormData({ ...formData, conditionQuizId: text })}
                />
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveBadge}
                  disabled={actionLoading}
                >
                  <Text style={styles.saveButtonText}>
                    {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  badgeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  badgeIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  badgeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  badgeSkill: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  badgeCondition: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  badgeActions: {
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
  modalScrollView: {
    width: '90%',
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
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
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  skillsList: {
    maxHeight: 150,
    marginBottom: 15,
  },
  specificSkillsList: {
    maxHeight: 200,
    marginBottom: 10,
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
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  skillOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366f1',
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
  conditionTypeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  conditionTypeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  conditionTypeOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366f1',
  },
  conditionTypeOptionText: {
    fontSize: 12,
    color: '#111827',
  },
  conditionTypeOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
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
});
