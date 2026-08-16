import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from './icon-symbol';

export type ToastType = 'success' | 'error' | 'info';

interface ToastData {
    type: ToastType;
    message: string;
}

const TOAST_STYLES: Record<ToastType, {
    icon: 'checkmark.circle.fill' | 'exclamationmark.triangle.fill' | 'exclamationmark.circle.fill';
    color: string;
    bg: string;
    border: string;
}> = {
    success: { icon: 'checkmark.circle.fill', color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
    error: { icon: 'exclamationmark.triangle.fill', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
    info: { icon: 'exclamationmark.circle.fill', color: '#0ea5e9', bg: '#e0f2fe', border: '#7dd3fc' },
};

// Registrasi global agar showToast bisa dipanggil dari mana saja setelah AppToast ter-mount.
let showToastFn: ((type: ToastType, message: string) => void) | null = null;

// Root toast — mount sekali di root layout.
// Implementasi custom (tanpa library) karena animasi library tidak jalan
// di stack ini (React Compiler + RN Web); pakai pola animasi yang sama
// dengan splash screen yang sudah terbukti bekerja.
export function AppToast() {
    const [current, setCurrent] = useState<ToastData | null>(null);
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-16)).current;

    useEffect(() => {
        showToastFn = (type, message) => setCurrent({ type, message });
        return () => { showToastFn = null; };
    }, []);

    useEffect(() => {
        if (!current) return;

        opacity.setValue(0);
        translateY.setValue(-16);

        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        ]).start();

        const timer = setTimeout(() => {
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
                if (finished) setCurrent(null);
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [current, opacity, translateY]);

    if (!current) return null;

    const s = TOAST_STYLES[current.type];
    return (
        <View style={styles.wrapper} pointerEvents="box-none">
            <Animated.View style={[styles.card, { backgroundColor: s.bg, borderColor: s.border, opacity, transform: [{ translateY }] }]}>
                <IconSymbol name={s.icon} size={22} color={s.color} />
                <Text style={styles.text}>{current.message}</Text>
            </Animated.View>
        </View>
    );
}

// Helper untuk memunculkan notifikasi in-app (bukan dialog browser/sistem).
export const showToast = (type: ToastType, message: string) => {
    showToastFn?.(type, message);
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 100,
        alignItems: 'center',
        zIndex: 2000,
        elevation: 2000,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 16,
        maxWidth: 480,
        width: '92%',
        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
        elevation: 8,
    },
    text: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
});
