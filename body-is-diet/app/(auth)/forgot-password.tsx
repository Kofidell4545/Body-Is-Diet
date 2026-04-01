import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../services/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleSend = async () => {
        if (!email.trim()) { setEmailError('Email is required'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email address'); return; }
        setEmailError('');
        setLoading(true);
        try {
            await authApi.forgotPassword(email);
            setSent(true);
        } catch {
            // Always show success to avoid user enumeration
            setSent(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

                    {/* Back */}
                    <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={20} color="#00E676" />
                        <Text style={styles.backText}>Back to Login</Text>
                    </TouchableOpacity>

                    {!sent ? (
                        <>
                            {/* Icon */}
                            <View style={styles.iconWrap}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="key-outline" size={40} color="#00E676" />
                                </View>
                            </View>

                            {/* Header */}
                            <Text style={styles.title}>Forgot Password?</Text>
                            <Text style={styles.subtitle}>
                                Enter your email address and we'll send you a link to reset your password.
                            </Text>

                            {/* Email input */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Email Address</Text>
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

                            {/* Send button */}
                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleSend}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text style={styles.buttonText}>Send Reset Link</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        /* Success state */
                        <View style={styles.successContainer}>
                            <View style={styles.successCircle}>
                                <Ionicons name="checkmark" size={42} color="#00E676" />
                            </View>
                            <Text style={styles.successTitle}>Check Your Inbox</Text>
                            <Text style={styles.successSubtitle}>
                                We've sent a password reset link to{'\n'}
                                <Text style={styles.successEmail}>{email}</Text>
                            </Text>
                            <Text style={styles.successHint}>
                                Didn't receive it? Check your spam folder or try again.
                            </Text>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => { setSent(false); setEmail(''); }}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.buttonText}>Try Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/(auth)/login')}>
                                <Text style={styles.loginLinkText}>Back to Login</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    inner: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 24,
        paddingBottom: 48,
    },
    back: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 40,
    },
    backText: { color: '#00E676', fontSize: 15 },
    iconWrap: { alignItems: 'center', marginBottom: 28 },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#00E67615',
        borderWidth: 1,
        borderColor: '#00E67630',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.8,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#888',
        lineHeight: 22,
        marginBottom: 36,
    },
    fieldGroup: { marginBottom: 24 },
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
    fieldError: { color: '#FF5252', fontSize: 12, marginTop: 6, marginLeft: 2 },
    button: {
        backgroundColor: '#00E676',
        borderRadius: 14,
        padding: 17,
        alignItems: 'center',
        shadowColor: '#00E676',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
        marginBottom: 16,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    /* Success */
    successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    successCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#00E67615',
        borderWidth: 1.5,
        borderColor: '#00E67640',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    successTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.8,
        marginBottom: 12,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 10,
    },
    successEmail: { color: '#00E676', fontWeight: '600' },
    successHint: {
        fontSize: 13,
        color: '#555',
        textAlign: 'center',
        marginBottom: 36,
        lineHeight: 20,
    },
    loginLink: { padding: 8 },
    loginLinkText: { color: '#00E676', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
