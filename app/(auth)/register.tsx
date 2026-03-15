import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { auth, db } from '../../src/config/firebase';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Mohon isi semua kolom.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Password dan Konfirmasi Password tidak cocok.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password minimal 6 karakter.');
            return;
        }

        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth as any, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                createdAt: serverTimestamp(),
            });

        } catch (error: any) {
            let errorMessage = 'Gagal mendaftar. Silakan coba lagi.';
            if (error.code === 'auth/email-already-in-use') errorMessage = 'Email sudah terdaftar.';
            if (error.code === 'auth/invalid-email') errorMessage = 'Format email tidak valid.';
            if (error.code === 'auth/weak-password') errorMessage = 'Password terlalu lemah.';

            Alert.alert('Pendaftaran Gagal', errorMessage);
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
                            <Text style={styles.title}>Join Us</Text>
                            <Text style={styles.subtitle}>Start managing your fridge smarter.</Text>
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

                            <View style={styles.inputGroup}>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.inputIcon}>
                                        <IconSymbol name="checkmark.shield.fill" size={20} color="#94a3b8" />
                                    </View>
                                    <TextInput
                                        style={[styles.input, { paddingRight: 48 }]}
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#94a3b8"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeBtn}
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        <IconSymbol name={showConfirmPassword ? "eye.slash.fill" : "eye.fill"} size={20} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
                                onPress={handleRegister}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#0f172a" />
                                ) : (
                                    <Text style={styles.loginBtnText}>Sign Up</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Social Login Divider */}
                        <View style={styles.dividerBox}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or register with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Buttons */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialBtn}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ea4335' }}>G</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sign In Footer */}
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <Link href="/(auth)/login" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.footerLinkBold}>Log In</Text>
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
        marginTop: 8,
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
