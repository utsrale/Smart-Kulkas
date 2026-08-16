import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

// Halaman awal ber-brand: logo (kulkas + daun) seperti di halaman login lama.
// Dirender sebagai overlay di root layout (bukan rute) agar bekerja identik
// di dev server maupun static export. Tap di mana saja untuk skip.
export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    const { t } = useTranslation();

    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();

        const timer = setTimeout(onFinish, 2000);
        return () => clearTimeout(timer);
        // onFinish stabil (useCallback dari parent); opacity/scale stabil dari useRef
    }, [onFinish, opacity, scale]);

    return (
        <Pressable style={styles.container} onPress={onFinish}>
            <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
                {/* Logo — identik dengan halaman login lama */}
                <View style={styles.logoCircle}>
                    <IconSymbol name="refrigerator.fill" size={48} color="#13ec6d" />
                    <View style={styles.ecoBadge}>
                        <IconSymbol name="leaf.fill" size={20} color="#13ec6d" />
                    </View>
                </View>
                <Text style={styles.title}>{t('splash.appName')}</Text>
                <Text style={styles.tagline}>{t('splash.tagline')}</Text>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        // Absolute + semua sisi 0 agar menutupi seluruh layar di semua platform
        // (di web, flex:1 saja tidak mengisi tinggi karena parent root ber-orientasi row)
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        elevation: 1000,
        backgroundColor: '#f6f8f7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    logoCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#13ec6d15',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 28,
        boxShadow: '0 10px 30px rgba(19, 236, 109, 0.25)',
        elevation: 6,
    },
    ecoBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 4,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
        elevation: 2,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 10,
        textAlign: 'center',
    },
});
