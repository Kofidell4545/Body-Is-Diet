import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { authApi, userApi } from '../../services/api';

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: '', color: 'transparent', width: '0%' };
  if (password.length < 6) return { label: 'Weak', color: '#FF5252', width: '25%' };
  if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
    return { label: 'Fair', color: '#FFC107', width: '55%' };
  return { label: 'Strong', color: '#00E676', width: '100%' };
}

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [termsError, setTermsError] = useState('');
  const [globalError, setGlobalError] = useState('');

  const { signIn } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const strength = getPasswordStrength(password);

  const validate = () => {
    let valid = true;
    if (!name.trim()) { setNameError('Full name is required'); valid = false; } else setNameError('');
    if (!email.trim()) { setEmailError('Email is required'); valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email address'); valid = false; }
    else setEmailError('');
    if (!password) { setPasswordError('Password is required'); valid = false; }
    else if (password.length < 6) { setPasswordError('Password must be at least 6 characters'); valid = false; }
    else setPasswordError('');
    if (!confirmPassword) { setConfirmError('Please confirm your password'); valid = false; }
    else if (password !== confirmPassword) { setConfirmError('Passwords do not match'); valid = false; }
    else setConfirmError('');
    if (!agreed) { setTermsError('You must agree to the Terms & Privacy Policy'); valid = false; } else setTermsError('');
    return valid;
  };

  const handleSignup = async () => {
    setGlobalError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.register(name, email, password);
      signIn();
      router.replace('/(onboarding)/goal');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Could not create account. Please try again.';
      setGlobalError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Back */}
            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#00E676" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Start your local food journey today</Text>
            </View>

            {/* Global error */}
            {globalError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#FF5252" />
                <Text style={styles.errorBannerText}>{globalError}</Text>
              </View>
            ) : null}

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputRow, nameError ? styles.inputError : null]}>
                <Ionicons name="person-outline" size={20} color="#555" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#555"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={(t) => { setName(t); setNameError(''); }}
                />
              </View>
              {nameError ? <Text style={styles.fieldError}>{nameError}</Text> : null}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputRow, emailError ? styles.inputError : null]}>
                <Ionicons name="mail-outline" size={20} color="#555" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#555"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                />
              </View>
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputRow, passwordError ? styles.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#555"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#555" />
                </TouchableOpacity>
              </View>
              {/* Strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthTrack}>
                    <View style={[styles.strengthFill, { width: strength.width as any, backgroundColor: strength.color }]} />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.inputRow, confirmError ? styles.inputError : null]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#555" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#555"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setConfirmError(''); }}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#555" />
                </TouchableOpacity>
              </View>
              {confirmError ? <Text style={styles.fieldError}>{confirmError}</Text> : null}
            </View>

            {/* Terms */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => { setAgreed(!agreed); setTermsError(''); }}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Ionicons name="checkmark" size={13} color="#000" />}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {termsError ? <Text style={[styles.fieldError, { marginTop: 4 }]}>{termsError}</Text> : null}

            {/* Create Account */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.footerLink}>Log in</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 48,
    flexGrow: 1,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 32,
  },
  backText: { color: '#00E676', fontSize: 15 },
  header: { marginBottom: 36 },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 6,
  },
  subtitle: { fontSize: 15, color: '#888' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF525215',
    borderWidth: 1,
    borderColor: '#FF525230',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorBannerText: { color: '#FF5252', fontSize: 13, flex: 1 },
  fieldGroup: { marginBottom: 18 },
  label: {
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#232323',
    paddingHorizontal: 14,
  },
  inputError: { borderColor: '#FF5252' },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeBtn: { padding: 4, marginLeft: 8 },
  fieldError: { color: '#FF5252', fontSize: 12, marginTop: 6, marginLeft: 2 },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#232323',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', width: 44, textAlign: 'right' },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 28,
    marginTop: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
  },
  termsText: { flex: 1, color: '#888', fontSize: 13, lineHeight: 20 },
  termsLink: { color: '#00E676', fontWeight: '600' },
  button: {
    backgroundColor: '#00E676',
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#00E676',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#666', fontSize: 14 },
  footerLink: { color: '#00E676', fontSize: 14, fontWeight: '600' },
});
