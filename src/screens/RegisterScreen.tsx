import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { userService } from '../services/userService';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Créer le profil utilisateur dans Firestore
      await userService.createUserProfile(user.uid, {
        name,
        email,
      });

      navigation.navigate('Home' as never);
    } catch (error: any) {
      Alert.alert('Erreur d\'inscription', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Créer un compte</Text>
              <Text style={styles.subtitle}>Rejoins la communauté SkillUp</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nom complet"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F3F4F6']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.registerButtonText}>
                    {loading ? 'Inscription...' : 'Créer un compte'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login' as never)}
              >
                <Text style={styles.loginLinkText}>
                  Déjà un compte ? <Text style={styles.loginLinkBold}>Se connecter</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  registerButton: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 30,
    alignItems: 'center',
  },
  loginLinkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  loginLinkBold: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

