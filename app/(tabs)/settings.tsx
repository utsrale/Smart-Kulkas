import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert, Platform, ScrollView,
    StyleSheet,
    Text, TouchableOpacity,
    View,
} from 'react-native';
import { SUPPORTED_LANGUAGES, changeLanguage } from '../../src/i18n';
import { clearAllData, getInventoryItems, getProfile } from '../../src/services/localStore';

export default function ProfileScreen() {
    const { t, i18n } = useTranslation();
    const [stats, setStats] = useState({ active: 0, used: 0, expired: 0 });
    const [profileName, setProfileName] = useState('User');

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

    const handleClearAll = async () => {
        const proceed = Platform.OS === 'web'
            ? window.confirm(t('settings.clearConfirmWeb'))
            : await new Promise<boolean>(resolve => {
                Alert.alert(t('settings.clearConfirmTitle'), t('settings.clearConfirmMessage'), [
                    { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
                    { text: t('common.delete'), style: 'destructive', onPress: () => resolve(true) },
                ]);
            });

        if (!proceed) return;

        try {
            await clearAllData();
            loadData();
            Alert.alert(t('settings.clearDone'));
        } catch (error) {
            console.error('Gagal menghapus data:', error);
            Alert.alert(t('common.error'), t('settings.clearFailed'));
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
            </View>

            {/* Stats */}
            <Text style={styles.sectionTitle}>{t('settings.inventorySummary')}</Text>
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { borderTopColor: '#55efc4' }]}>
                    <Text style={styles.statNumber}>{stats.active}</Text>
                    <Text style={styles.statLabel}>{t('settings.active')}</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#fdcb6e' }]}>
                    <Text style={styles.statNumber}>{stats.used}</Text>
                    <Text style={styles.statLabel}>{t('settings.used')}</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#ff7675' }]}>
                    <Text style={styles.statNumber}>{stats.expired}</Text>
                    <Text style={styles.statLabel}>{t('settings.expired')}</Text>
                </View>
            </View>

            {/* Language */}
            <Text style={styles.sectionTitle}>{t('settings.languageTitle')}</Text>
            <View style={styles.languageRow}>
                {SUPPORTED_LANGUAGES.map(lang => {
                    const active = String(i18n.language || '').startsWith(lang.code);
                    return (
                        <TouchableOpacity
                            key={lang.code}
                            style={[styles.languageBtn, active && styles.languageBtnActive]}
                            onPress={() => changeLanguage(lang.code)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.languageBtnText, active && styles.languageBtnTextActive]}>{lang.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <Text style={styles.localHint}>{t('settings.languageHint')}</Text>

            {/* Data */}
            <Text style={styles.sectionTitle}>{t('settings.dataTitle')}</Text>
            <TouchableOpacity style={[styles.actionButton, { borderColor: '#ff7675' }]} onPress={handleClearAll}>
                <IconSymbol name="trash.fill" size={20} color="#d63031" />
                <Text style={[styles.actionText, { color: '#d63031' }]}>{t('settings.clearAll')}</Text>
            </TouchableOpacity>
            <Text style={styles.localHint}>
                {t('settings.localHint')}
            </Text>
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
    languageRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    languageBtn: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#dfe6e9',
    },
    languageBtnActive: {
        borderColor: '#0984e3',
        backgroundColor: '#eef4fd',
    },
    languageBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#636e72',
    },
    languageBtnTextActive: {
        color: '#0984e3',
        fontWeight: '800',
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
});
