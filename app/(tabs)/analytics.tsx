import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getInventoryItems } from '../../src/services/localStore';
import { generateSustainabilityTips } from '../../src/services/aiService';
import { normalizeCategoryKey } from '../../src/utils/categoryDefaults';

interface CategoryStat {
    name: string;
    icon: string;
    color: string;
    bgColor: string;
    wastedKg: number;
    detail: string;
}

export default function AnalyticsScreen() {
    const { t } = useTranslation();
    const [totalItems, setTotalItems] = useState(0);
    const [activeItems, setActiveItems] = useState(0);
    const [expiredItems, setExpiredItems] = useState(0);
    const [nearExpiryItems, setNearExpiryItems] = useState(0);
    const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
    const [aiTip, setAiTip] = useState<string>('');
    // Menandai bahwa AI tip sudah pernah difetch agar tidak berulang saat snapshot berubah
    const tipFetchedRef = useRef(false);
    const [isLoadingTip, setIsLoadingTip] = useState(false);

    const loadStats = useCallback(async () => {
        try {
            const inventory = await getInventoryItems();

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let total = 0, active = 0, expired = 0, nearExpiry = 0;
            const catMap: Record<string, { total: number; expired: number; items: string[] }> = {};

            inventory.forEach(item => {
                if (item.status !== 'active') return;

                total++;
                // Kategori tersimpan sebagai key (data lama otomatis dimigrasi oleh localStore)
                const category = normalizeCategoryKey(item.category);

                if (!catMap[category]) catMap[category] = { total: 0, expired: 0, items: [] };
                catMap[category].total++;

                const expDate = new Date(item.expiredDate);
                expDate.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays <= 0) {
                    expired++;
                    catMap[category].expired++;
                    catMap[category].items.push(item.itemName);
                } else if (diffDays <= 3) {
                    nearExpiry++;
                } else {
                    active++;
                }
            });

            setTotalItems(total);
            setActiveItems(active);
            setExpiredItems(expired);
            setNearExpiryItems(nearExpiry);

            // Build category stats (top wasted) — ikon/warna dipetakan per key kategori
            const catColors: Record<string, { icon: any; color: string; bg: string }> = {
                sayur: { icon: 'leaf.fill', color: '#16a34a', bg: '#dcfce7' },
                buah: { icon: 'applelogo', color: '#ea580c', bg: '#ffedd5' },
                daging: { icon: 'fork.knife', color: '#dc2626', bg: '#fee2e2' },
                ikan: { icon: 'fish.fill', color: '#0891b2', bg: '#cffafe' },
                susu: { icon: 'carton.fill', color: '#2563eb', bg: '#dbeafe' },
                telur: { icon: 'egg.fill', color: '#d97706', bg: '#fef3c7' },
                bumbu: { icon: 'flame.fill', color: '#9333ea', bg: '#f3e8ff' },
                minuman: { icon: 'drop.fill', color: '#0ea5e9', bg: '#e0f2fe' },
                lainnya: { icon: 'archivebox.fill', color: '#64748b', bg: '#f1f5f9' },
            };

            const stats: CategoryStat[] = Object.entries(catMap)
                .filter(([_, val]) => val.expired > 0)
                .sort((a, b) => b[1].expired - a[1].expired)
                .slice(0, 3)
                .map(([name, val]) => {
                    const c = catColors[name] || catColors['lainnya'];
                    return {
                        name, // tetap key — dirender via t('category.' + name)
                        icon: c.icon,
                        color: c.color,
                        bgColor: c.bg,
                        wastedKg: Number((val.expired * 0.35).toFixed(1)),
                        detail: val.items.slice(0, 2).join(' & ') || t('analytics.expiredDetail'),
                    };
                });
            setCategoryStats(stats);

            // Fetch AI Tip if we have data and haven't fetched yet
            if (!tipFetchedRef.current) {
                tipFetchedRef.current = true;
                setIsLoadingTip(true);
                const wastedList = Object.entries(catMap).filter(([_, v]) => v.expired > 0).flatMap(([_, v]) => v.items);
                // Kirim nama kategori yang sudah diterjemahkan agar prompt AI terbaca jelas
                const consumedList = Object.entries(catMap).filter(([_, v]) => v.total > v.expired).map(([k]) => t('category.' + k));

                generateSustainabilityTips(wastedList.slice(0, 5), consumedList.slice(0, 5))
                    .then(tip => setAiTip(tip))
                    .catch(() => setAiTip(t('analytics.tipError')))
                    .finally(() => setIsLoadingTip(false));
            }

        } catch (error) {
            console.error('Gagal memuat statistik:', error);
        }
    }, [t]);

    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [loadStats])
    );

    // Calculations
    const consumed = activeItems + nearExpiryItems;
    const wasted = expiredItems;
    const totalKg = Number(((consumed + wasted) * 0.35).toFixed(1));
    const consumedKg = Number((consumed * 0.35).toFixed(1));
    const wastedKg = Number((wasted * 0.35).toFixed(1));
    const consumedPct = totalItems > 0 ? Math.round((consumed / totalItems) * 100) : 100;
    const wastedPct = totalItems > 0 ? Math.round((wasted / totalItems) * 100) : 0;
    const savingsRp = Math.round(consumed * 15000); // ~Rp15k per item saved
    const co2Reduced = Number((consumed * 2.5).toFixed(1)); // ~2.5 kg CO2 per item

    // Donut chart values
    const circumference = 2 * Math.PI * 45;
    const consumedDash = (consumedPct / 100) * circumference;
    const wastedDash = (wastedPct / 100) * circumference;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('analytics.title')}</Text>
                <Text style={styles.headerSubtitle}>{t('analytics.subtitle')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Donut Chart Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t('analytics.consumedVsWasted')}</Text>
                    <View style={styles.chartRow}>
                        <View style={styles.chartContainer}>
                            <Svg width={130} height={130} viewBox="0 0 120 120">
                                {/* Background circle */}
                                <Circle cx={60} cy={60} r={45} stroke="#e2e8f0" strokeWidth={10} fill="none" />
                                {/* Consumed arc */}
                                <Circle
                                    cx={60} cy={60} r={45} stroke="#13ec6d" strokeWidth={10} fill="none"
                                    strokeDasharray={`${consumedDash} ${circumference}`}
                                    strokeDashoffset={0} strokeLinecap="round"
                                    rotation={-90} origin="60, 60"
                                />
                                {/* Wasted arc */}
                                {wastedPct > 0 && (
                                    <Circle
                                        cx={60} cy={60} r={45} stroke="#f87171" strokeWidth={10} fill="none"
                                        strokeDasharray={`${wastedDash} ${circumference}`}
                                        strokeDashoffset={-consumedDash} strokeLinecap="round"
                                        rotation={-90} origin="60, 60"
                                    />
                                )}
                            </Svg>
                            <View style={styles.chartCenter}>
                                <Text style={styles.chartBig}>{totalKg}</Text>
                                <Text style={styles.chartLabel}>{t('analytics.totalKg')}</Text>
                            </View>
                        </View>

                        <View style={styles.legendColumn}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#13ec6d' }]} />
                                <View>
                                    <Text style={styles.legendLabel}>{t('analytics.consumed')}</Text>
                                    <Text style={styles.legendValue}>{consumedKg} kg ({consumedPct}%)</Text>
                                </View>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#f87171' }]} />
                                <View>
                                    <Text style={styles.legendLabel}>{t('analytics.wasted')}</Text>
                                    <Text style={styles.legendValue}>{wastedKg} kg ({wastedPct}%)</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={styles.statIconRow}>
                            <Text style={{ fontSize: 18 }}>💰</Text>
                            <Text style={styles.statLabel}>{t('analytics.savings')}</Text>
                        </View>
                        <Text style={styles.statValue}>Rp {savingsRp.toLocaleString('id-ID')}</Text>
                        <Text style={styles.statHint}>{t('analytics.savingsHint')}</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardGreen]}>
                        <View style={styles.statIconRow}>
                            <Text style={{ fontSize: 18 }}>🌍</Text>
                            <Text style={[styles.statLabel, { color: '#0f172a' }]}>{t('analytics.ecoImpact')}</Text>
                        </View>
                        <Text style={[styles.statValue, { color: '#0f172a' }]}>-{co2Reduced} kg</Text>
                        <Text style={[styles.statHint, { color: '#0f172a', opacity: 0.7 }]}>{t('analytics.co2Hint')}</Text>
                    </View>
                </View>

                {/* Top Wasted Categories */}
                {categoryStats.length > 0 && (
                    <View style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>{t('analytics.topWasted')}</Text>
                        {categoryStats.map((cat, idx) => {
                            const maxWaste = categoryStats[0]?.wastedKg || 1;
                            const barWidth = Math.max((cat.wastedKg / maxWaste) * 100, 10);
                            return (
                                <View key={idx} style={styles.catCard}>
                                    <View style={[styles.catIcon, { backgroundColor: cat.bgColor }]}>
                                        <IconSymbol name={cat.icon as any} size={20} color={cat.color} />
                                    </View>
                                    <View style={styles.catContent}>
                                        <Text style={styles.catName}>{t('category.' + cat.name)}</Text>
                                        <Text style={styles.catDetail}>{cat.detail}</Text>
                                    </View>
                                    <View style={styles.catRight}>
                                        <Text style={styles.catWaste}>{cat.wastedKg} kg</Text>
                                        <View style={styles.catBar}>
                                            <View style={[styles.catBarFill, { width: `${barWidth}%` }]} />
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {categoryStats.length === 0 && (
                    <View style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>{t('analytics.topWasted')}</Text>
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIconCircle}>
                                <IconSymbol name="checkmark.seal.fill" size={28} color="#15803d" />
                            </View>
                            <Text style={styles.emptyText}>{t('analytics.noWaste')}</Text>
                        </View>
                    </View>
                )}

                {/* Tip Card */}
                <View style={styles.tipCard}>
                    <View style={{ marginTop: 2 }}>
                        <IconSymbol name="sparkles" size={24} color="#13ec6d" />
                    </View>
                    <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>{t('analytics.aiInsights')}</Text>
                        {isLoadingTip ? (
                            <ActivityIndicator size="small" color="#13ec6d" style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                        ) : (
                            <Text style={styles.tipText}>{aiTip || t('analytics.tipFallback')}</Text>
                        )}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f6f8f7' },
    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
    headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    scrollContent: { padding: 16, paddingBottom: 100 },

    // Donut Card
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(19,236,109,0.06)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)', elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
    chartRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    chartContainer: { position: 'relative', width: 130, height: 130, justifyContent: 'center', alignItems: 'center' },
    chartCenter: { position: 'absolute', alignItems: 'center' },
    chartBig: { fontSize: 26, fontWeight: '800', color: '#0f172a' },
    chartLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 2, marginTop: 2 },
    legendColumn: { flex: 1, paddingLeft: 20, gap: 14 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    legendDot: { width: 12, height: 12, borderRadius: 6 },
    legendLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
    legendValue: { fontSize: 14, fontWeight: '700', color: '#0f172a' },

    // Stats Grid
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(19,236,109,0.06)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)', elevation: 2 },
    statCardGreen: { backgroundColor: '#13ec6d', borderColor: 'transparent' },
    statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    statLabel: { fontSize: 10, fontWeight: '800', color: '#13ec6d', letterSpacing: 1 },
    statValue: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
    statHint: { fontSize: 10, color: '#13ec6d', fontWeight: '700' },

    // Section
    sectionBlock: { marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },

    // Category Cards
    catCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(19,236,109,0.06)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)', elevation: 1 },
    catIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    catContent: { flex: 1 },
    catName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    catDetail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    catRight: { alignItems: 'flex-end' },
    catWaste: { fontSize: 14, fontWeight: '700', color: '#f87171', marginBottom: 4 },
    catBar: { width: 64, height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' },
    catBarFill: { height: 4, backgroundColor: '#f87171', borderRadius: 2 },

    // Empty
    emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(19,236,109,0.06)' },
    emptyIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },

    // Tip
    tipCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(19,236,109,0.08)', borderWidth: 1, borderColor: 'rgba(19,236,109,0.2)', borderRadius: 14, padding: 16, gap: 14 },
    tipContent: { flex: 1 },
    tipTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
    tipText: { fontSize: 13, color: '#475569', lineHeight: 20 },
});
