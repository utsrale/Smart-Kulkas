import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert, Modal, Platform, Pressable, ScrollView, Share,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native';
import { clearAllData, exportAllData, getInventoryItems, getProfile, importAllData } from '../../src/services/localStore';

export default function ProfileScreen() {
    const [stats, setStats] = useState({ active: 0, used: 0, expired: 0 });
    const [profileName, setProfileName] = useState('User');
    const [importVisible, setImportVisible] = useState(false);
    const [importText, setImportText] = useState('');

    const loadData = useCallback(async () => {
        try {
            const [inventory, profile] = await Promise.all([getInventoryItems(), getProfile()]);

            let active = 0;
            let used = 0;
            let expired = 0;
            const now = new Date();

            inventory.forEach((item) => {
                if (item.status === 'used') {
                    used++;
                } else if (item.expiredDate < now) {
                    expired++;
                } else {
                    active++;
                }
            });

            setStats({ active, used, expired });
            setProfileName(profile.name || 'User');
        } catch (error) {
            console.error('Gagal memuat statistik profil:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleExport = async () => {
        try {
            const json = await exportAllData();
            if (Platform.OS === 'web') {
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `smart-kulkas-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                window.alert('Backup berhasil diunduh.');
            } else {
                await Share.share({ title: 'Smart Kulkas Backup', message: json });
            }
        } catch (error) {
            console.error('Gagal export:', error);
            Alert.alert('Error', 'Gagal membuat backup.');
        }
    };

    const handleImport = async () => {
        try {
            await importAllData(importText);
            setImportVisible(false);
            setImportText('');
            Alert.alert('Berhasil', 'Data berhasil diimpor.');
            loadData();
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Gagal mengimpor data. Periksa format JSON.');
        }
    };

    const handleClearAll = async () => {
        const proceed = Platform.OS === 'web'
            ? window.confirm('Hapus SEMUA data lokal (inventory, shopping list, profil)? Tindakan ini tidak bisa dibatalkan.')
            : await new Promise<boolean>(resolve => {
                Alert.alert('Hapus Semua Data', 'Semua data lokal akan dihapus permanen. Lanjutkan?', [
                    { text: 'Batal', style: 'cancel', onPress: () => resolve(false) },
                    { text: 'Hapus', style: 'destructive', onPress: () => resolve(true) },
                ]);
            });

        if (!proceed) return;

        try {
            await clearAllData();
            loadData();
            Alert.alert('Selesai', 'Semua data lokal telah dihapus.');
        } catch (error) {
            console.error('Gagal menghapus data:', error);
            Alert.alert('Error', 'Gagal menghapus data.');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* User Info Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {profileName.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
                <Text style={styles.email}>{profileName}</Text>
                <Text style={styles.localBadge}>📱 Mode Lokal — data tersimpan di perangkat</Text>
            </View>

            {/* Stats */}
            <Text style={styles.sectionTitle}>Inventory Summary</Text>
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { borderTopColor: '#55efc4' }]}>
                    <Text style={styles.statNumber}>{stats.active}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#fdcb6e' }]}>
                    <Text style={styles.statNumber}>{stats.used}</Text>
                    <Text style={styles.statLabel}>Used</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#ff7675' }]}>
                    <Text style={styles.statNumber}>{stats.expired}</Text>
                    <Text style={styles.statLabel}>Expired</Text>
                </View>
            </View>

            {/* Data actions */}
            <Text style={styles.sectionTitle}>Backup & Data</Text>
            <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
                <IconSymbol name="square.and.arrow.up" size={20} color="#0984e3" />
                <Text style={styles.actionText}>Export Data (Backup JSON)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setImportVisible(true)}>
                <IconSymbol name="square.and.arrow.down" size={20} color="#0984e3" />
                <Text style={styles.actionText}>Import Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { borderColor: '#ff7675' }]} onPress={handleClearAll}>
                <IconSymbol name="trash.fill" size={20} color="#d63031" />
                <Text style={[styles.actionText, { color: '#d63031' }]}>Hapus Semua Data</Text>
            </TouchableOpacity>
            <Text style={styles.localHint}>
                Data disimpan hanya di perangkat ini. Gunakan Export/Import untuk memindahkan atau mencadangkan data.
            </Text>

            {/* Import Modal */}
            <Modal
                transparent
                visible={importVisible}
                animationType="fade"
                onRequestClose={() => setImportVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setImportVisible(false)}>
                    <Pressable style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Import Data</Text>
                        <Text style={styles.modalSubtitle}>Tempel isi file backup JSON di bawah ini:</Text>
                        <TextInput
                            style={styles.modalInput}
                            multiline
                            placeholder='{ "version": 1, ... }'
                            placeholderTextColor="#94a3b8"
                            value={importText}
                            onChangeText={setImportText}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setImportVisible(false)}>
                                <Text style={styles.modalCancelText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleImport}>
                                <Text style={styles.modalConfirmText}>Import</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
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
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
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
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
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
    localBadge: {
        fontSize: 13,
        color: '#0984e3',
        marginTop: 8,
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#dfe6e9',
        gap: 10,
        marginBottom: 12,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2d3436',
    },
    localHint: {
        fontSize: 12,
        color: '#94a3b8',
        lineHeight: 18,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 12,
    },
    modalInput: {
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 12,
        minHeight: 120,
        fontSize: 13,
        color: '#0f172a',
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 16,
    },
    modalCancelBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    modalConfirmBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#0984e3',
    },
    modalConfirmText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
