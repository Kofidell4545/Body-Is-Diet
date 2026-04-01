import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../services/api';
import { PrimaryButton, SocialAuthRow, TextField, ErrorBanner } from '../../components/ui';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
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

  const handleSignup = async () => {
    const nErr = name.trim().length < 2 ? 'Name must be at least 2 characters' : '';
    const eErr = validateEmail(email);
    const pErr = password.length < 6 ? 'Password must be at least 6 characters' : '';
    setNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);
    setError('');
    if (nErr || eErr || pErr) return;

    setLoading(true);
    try {
      await authApi.register(name.trim(), email.trim(), password);
      signIn(name.trim());
      router.replace('/(onboarding)/goal');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Registration failed. Please try again.';
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
              <Text style={styles.logo}>Create Account</Text>
              <Text style={styles.tagline}>Start your journey to better nutrition</Text>
            </View>

            {/* Error */}
            <ErrorBanner message={error} />

            {/* Name */}
            <TextField
              label="Full Name"
              icon="person-outline"
              placeholder="Kwame Mensah"
              autoCapitalize="words"
              autoCorrect={false}
              value={name}
              onChangeText={(t) => { setName(t); setNameError(''); setError(''); }}
              error={nameError}
            />

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
            <TextField
              label="Password"
              icon="lock-closed-outline"
              placeholder="Min. 6 characters"
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
            <PrimaryButton label="Sign Up" onPress={handleSignup} loading={loading} style={styles.ctaBtn} />

            {/* Social auth */}
            <SocialAuthRow />

            {/* Footer */}
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
  scroll: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 48, flexGrow: 1, justifyContent: 'center' },
  header: { marginBottom: 36 },
  logo: { fontSize: 36, fontWeight: '800', color: '#FFF', letterSpacing: -1, marginBottom: 6 },
  tagline: { fontSize: 15, color: '#888' },
  ctaBtn: { marginTop: 8, marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#666', fontSize: 14 },
  footerLink: { color: '#00E676', fontSize: 14, fontWeight: '600' },
});
