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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('Home' as never);
    } catch (error: any) {
      Alert.alert('Erreur de connexion', error.message);
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
            <Text style={styles.title}>Bienvenue</Text>
            <Text style={styles.subtitle}>Connecte-toi pour continuer</Text>
          </View>

          <View style={styles.form}>
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

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F3F4F6']}
                style={styles.buttonGradient}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigation.navigate('Register' as never)}
              >
                <Text style={styles.registerLinkText}>
                  Pas encore de compte ? <Text style={styles.registerLinkBold}>Créer un compte</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminLink}
                onPress={() => navigation.navigate('AdminLogin' as never)}
              >
                <Text style={styles.adminLinkText}>
                  Accès Administrateur
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    marginBottom: 50,
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
  loginButton: {
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
  loginButtonText: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: 30,
    alignItems: 'center',
  },
  registerLinkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  registerLinkBold: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  adminLink: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  adminLinkText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});






