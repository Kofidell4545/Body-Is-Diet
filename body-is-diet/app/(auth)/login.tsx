import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { authApi, userApi } from '../../services/api';
import { PrimaryButton, SocialAuthRow, TextField, ErrorBanner } from '../../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { signIn } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address';
    return '';
  };

  const handleLogin = async () => {
    const eErr = validateEmail(email);
    const pErr = password ? '' : 'Password is required';
    setEmailError(eErr);
    setPasswordError(pErr);
    setError('');
    if (eErr || pErr) return;

    setLoading(true);
    try {
      await authApi.login(email, password);
      signIn();
      
      // Check if user has completed onboarding
      try {
        const prefs = await userApi.getPreferences();
        if (prefs && prefs.goal) {
          router.replace('/(tabs)/');
        } else {
          router.replace('/(onboarding)/goal');
        }
      } catch (e) {
        // If 404 or other error fetching prefs, assume new user
        router.replace('/(onboarding)/goal');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>Body is Diet</Text>
              <Text style={styles.tagline}>Fuel your goals with local meals</Text>
            </View>

            {/* Error */}
            <ErrorBanner message={error} />

            {/* Email */}
            <TextField
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => { setEmail(t); setEmailError(''); setError(''); }}
              error={emailError}
            />

            {/* Password */}
            <View style={styles.passwordLabelRow}>
              <Text style={styles.passwordLabel}>Password</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <TextField
              label=""
              icon="lock-closed-outline"
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(t) => { setPassword(t); setPasswordError(''); setError(''); }}
              error={passwordError}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4, marginLeft: 8 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#555" />
                </TouchableOpacity>
              }
            />

            {/* CTA */}
            <PrimaryButton label="Log In" onPress={handleLogin} loading={loading} style={styles.ctaBtn} />

            {/* Social auth */}
            <SocialAuthRow />

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.footerLink}>Sign up</Text>
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
  scroll: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 48, flexGrow: 1, justifyContent: 'center' },
  header: { marginBottom: 36 },
  logo: { fontSize: 36, fontWeight: '800', color: '#FFF', letterSpacing: -1, marginBottom: 6 },
  tagline: { fontSize: 15, color: '#888' },
  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: -8 },
  passwordLabel: { color: '#AAAAAA', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  forgotLink: { color: '#00E676', fontSize: 13, fontWeight: '500' },
  ctaBtn: { marginTop: 8, marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#666', fontSize: 14 },
  footerLink: { color: '#00E676', fontSize: 14, fontWeight: '600' },
});