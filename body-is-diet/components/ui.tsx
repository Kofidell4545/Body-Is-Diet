/**
 * Reusable UI Components — Body is Diet
 * ─────────────────────────────────────
 * PrimaryButton     — green CTA (Log In, Sign Up, Next →)
 * SecondaryButton   — outline ghost button (I already have an account)
 * SocialAuthButton  — social login pill (Google / Apple)
 * TextField         — icon + text input with error state
 * ErrorBanner       — red inline error bar
 * ScreenHeader      — back arrow + optional title
 */

import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    ViewStyle,
    TextStyle,
    TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// ─── PrimaryButton ───────────────────────────────────────────────────────────
type PrimaryButtonProps = {
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, loading, disabled, style }: PrimaryButtonProps) {
    return (
        <TouchableOpacity
            style={[styles.primaryBtn, (loading || disabled) && styles.btnDisabled, style]}
            onPress={onPress}
            disabled={loading || disabled}
            activeOpacity={0.85}
        >
            {loading
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.primaryBtnText}>{label}</Text>
            }
        </TouchableOpacity>
    );
}

// ─── SecondaryButton ─────────────────────────────────────────────────────────
type SecondaryButtonProps = {
    label: string;
    onPress: () => void;
    style?: ViewStyle;
};

export function SecondaryButton({ label, onPress, style }: SecondaryButtonProps) {
    return (
        <TouchableOpacity
            style={[styles.secondaryBtn, style]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={styles.secondaryBtnText}>{label}</Text>
        </TouchableOpacity>
    );
}

// ─── SocialAuthButton ────────────────────────────────────────────────────────
type SocialAuthButtonProps = {
    provider: 'google' | 'apple';
    onPress?: () => void;
};

export function SocialAuthButton({ provider, onPress }: SocialAuthButtonProps) {
    return (
        <TouchableOpacity style={styles.socialBtn} onPress={onPress} activeOpacity={0.8}>
            {provider === 'google'
                ? <Text style={styles.socialIcon}>G</Text>
                : <Ionicons name="logo-apple" size={18} color="#FFF" />
            }
            <Text style={styles.socialText}>
                {provider === 'google' ? 'Google' : 'Apple'}
            </Text>
        </TouchableOpacity>
    );
}

// ─── SocialAuthRow ───────────────────────────────────────────────────────────
export function SocialAuthRow() {
    return (
        <View>
            <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialRow}>
                <SocialAuthButton provider="google" />
                <SocialAuthButton provider="apple" />
            </View>
        </View>
    );
}

// ─── TextField ───────────────────────────────────────────────────────────────
type TextFieldProps = TextInputProps & {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    error?: string;
    rightElement?: React.ReactNode;
};

export function TextField({ label, icon, error, rightElement, ...inputProps }: TextFieldProps) {
    return (
        <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
                <Ionicons name={icon} size={20} color="#555" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholderTextColor="#555"
                    {...inputProps}
                />
                {rightElement}
            </View>
            {error ? <Text style={styles.fieldError}>{error}</Text> : null}
        </View>
    );
}

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
export function ErrorBanner({ message }: { message: string }) {
    if (!message) return null;
    return (
        <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#FF5252" />
            <Text style={styles.errorBannerText}>{message}</Text>
        </View>
    );
}

// ─── ScreenHeader ─────────────────────────────────────────────────────────────
type ScreenHeaderProps = {
    title?: string;
    onBack?: () => void;
    style?: ViewStyle;
    titleStyle?: TextStyle;
};

export function ScreenHeader({ title, onBack, style, titleStyle }: ScreenHeaderProps) {
    return (
        <View style={[styles.screenHeader, style]}>
            <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack ?? (() => router.back())}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            {title && <Text style={[styles.screenHeaderTitle, titleStyle]}>{title}</Text>}
            {/* Right spacer so title stays centred */}
            {title && <View style={{ width: 38 }} />}
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    /* PrimaryButton */
    primaryBtn: {
        backgroundColor: '#00E676',
        borderRadius: 14,
        padding: 17,
        alignItems: 'center',
        shadowColor: '#00E676',
        shadowOpacity: 0.28,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    btnDisabled: { opacity: 0.65 },
    primaryBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    /* SecondaryButton */
    secondaryBtn: {
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    secondaryBtnText: {
        color: '#AAAAAA',
        fontSize: 15,
        fontWeight: '500',
    },

    /* SocialAuthButton */
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#141414',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#232323',
        padding: 14,
    },
    socialIcon: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    socialText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

    /* SocialAuthRow */
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 22,
        gap: 10,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#222' },
    dividerText: { color: '#555', fontSize: 13 },
    socialRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },

    /* TextField */
    fieldGroup: { marginBottom: 20 },
    fieldLabel: {
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
    inputRowError: { borderColor: '#FF5252' },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#FFF' },
    fieldError: { color: '#FF5252', fontSize: 12, marginTop: 6, marginLeft: 2 },

    /* ErrorBanner */
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

    /* ScreenHeader */
    screenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#141414',
        borderWidth: 1,
        borderColor: '#232323',
        alignItems: 'center',
        justifyContent: 'center',
    },
    screenHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.2,
    },
});
