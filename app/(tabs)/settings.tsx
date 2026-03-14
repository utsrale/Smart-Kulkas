import { IconSymbol } from '@/components/ui/icon-symbol';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    Alert, ScrollView,
    StyleSheet,
    Text, TouchableOpacity,
    View,
} from 'react-native';
import { auth, db } from '../../src/config/firebase';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ProfileScreen() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ active: 0, used: 0, expired: 0 });

    useEffect(() => {
        if (!user) return;

        // Listen to all inventory items for stats
        const q = query(
            collection(db, 'inventory'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let active = 0;
            let used = 0;
            let expired = 0;
            const now = new Date();

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.status === 'used') {
                    used++;
                } else if (data.expiredDate && data.expiredDate.toDate() < now) {
                    expired++;
                } else {
                    active++;
                }
            });

            setStats({ active, used, expired });
        });

        return () => unsubscribe();
    }, [user]);

    const handleLogout = () => {
        Alert.alert(
            'Keluar',
            'Apakah Anda yakin ingin keluar dari akun?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Keluar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                        } catch (error) {
                            Alert.alert('Error', 'Gagal keluar. Coba lagi.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* User Info Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.email?.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            {/* Stats */}
            <Text style={styles.sectionTitle}>Ringkasan Inventaris</Text>
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { borderTopColor: '#55efc4' }]}>
                    <Text style={styles.statNumber}>{stats.active}</Text>
                    <Text style={styles.statLabel}>Aktif</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#fdcb6e' }]}>
                    <Text style={styles.statNumber}>{stats.used}</Text>
                    <Text style={styles.statLabel}>Dipakai</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#ff7675' }]}>
                    <Text style={styles.statNumber}>{stats.expired}</Text>
                    <Text style={styles.statLabel}>Expired</Text>
                </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#d63031" />
                <Text style={styles.logoutText}>Keluar dari Akun</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#0984e3',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    email: {
        fontSize: 16,
        color: '#636e72',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d3436',
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderTopWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2d3436',
    },
    statLabel: {
        fontSize: 13,
        color: '#636e72',
        marginTop: 4,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#ff7675',
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#d63031',
    },
});
