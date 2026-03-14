import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { auth } from '../../src/config/firebase';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Mohon isi email dan password.');
            return;
        }

        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth as any, email, password);
            // Navigation is handled by layout observer
        } catch (error: any) {
            let errorMessage = 'Gagal login. Silakan coba lagi.';
            if (error.code === 'auth/invalid-email') errorMessage = 'Format email tidak valid.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') errorMessage = 'Email atau password salah.';

            Alert.alert('Login Gagal', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    {/* Decoration Gradient (simulated with borderTop) */}
                    <View style={styles.decorationTop} />

                    <View style={styles.content}>
                        {/* Logo Section */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoCircle}>
                                <IconSymbol name="refrigerator.fill" size={48} color="#13ec6d" />
                                <View style={styles.ecoBadge}>
                                    <IconSymbol name="leaf.fill" size={20} color="#13ec6d" />
                                </View>
                            </View>
                        </View>

                        {/* Header */}
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Manage your fridge, save the planet.</Text>
                        </View>

                        {/* Form */}
                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.inputIcon}>
                                        <IconSymbol name="envelope.fill" size={20} color="#94a3b8" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email Address"
                                        placeholderTextColor="#94a3b8"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.inputIcon}>
                                        <IconSymbol name="lock.fill" size={20} color="#94a3b8" />
                                    </View>
                                    <TextInput
                                        style={[styles.input, { paddingRight: 48 }]}
                                        placeholder="Password"
                                        placeholderTextColor="#94a3b8"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeBtn}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <IconSymbol name={showPassword ? "eye.slash.fill" : "eye.fill"} size={20} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.forgotBtn}>
                                <TouchableOpacity>
                                    <Text style={styles.forgotText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
                                onPress={handleLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#0f172a" />
                                ) : (
                                    <Text style={styles.loginBtnText}>Login</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Divider */}
                        <View style={styles.dividerBox}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or continue with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Buttons */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialBtn}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ea4335' }}>G</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialBtn}>
                                <IconSymbol name="applelogo" size={20} color="#0f172a" />
                            </TouchableOpacity>
                        </View>

                        {/* Sign Up Footer */}
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <Link href="/(auth)/register" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.footerLinkBold}>Sign Up</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>

                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoid: { flex: 1, backgroundColor: '#f6f8f7' },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 40 },
    card: {
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
    },
    decorationTop: {
        height: 8,
        backgroundColor: '#13ec6d',
        width: '100%',
    },
    content: {
        padding: 32,
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    logoCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#13ec6d15',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    ecoBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    headerTextContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
        lineHeight: 20,
    },
    formContainer: {
        width: '100%',
        gap: 20,
    },
    inputGroup: {
        width: '100%',
    },
    inputWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    inputIcon: {
        position: 'absolute',
        left: 16,
        zIndex: 1,
    },
    input: {
        flex: 1,
        height: 52,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingLeft: 44,
        paddingRight: 16,
        fontSize: 16,
        color: '#0f172a',
    },
    eyeBtn: {
        position: 'absolute',
        right: 16,
        padding: 4,
        zIndex: 1,
    },
    forgotBtn: {
        alignItems: 'flex-end',
        marginTop: -8,
        marginBottom: 4,
    },
    forgotText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    loginBtn: {
        height: 52,
        backgroundColor: '#13ec6d',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#13ec6d',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    loginBtnText: {
        color: '#0f172a',
        fontSize: 16,
        fontWeight: '700',
    },
    dividerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 32,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 12,
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    socialRow: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
    },
    socialBtn: {
        flex: 1,
        height: 48,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerContainer: {
        flexDirection: 'row',
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#64748b',
    },
    footerLinkBold: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },
});
