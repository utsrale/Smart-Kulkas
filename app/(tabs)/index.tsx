import { ConfirmModal } from '@/components/ui/confirm-modal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { showToast } from '@/components/ui/toast';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { InventoryItem, deleteInventoryItem, getInventoryItems, getProfile, setProfileName } from '../../src/services/localStore';

const calculateDaysRemaining = (expiredDate: Date) => {
  if (!expiredDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expiredDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function InventoryDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [firstName, setFirstName] = useState('User');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const didInitialLoad = useRef(false);

  const loadData = useCallback(async () => {
    if (!didInitialLoad.current) setLoading(true);
    try {
      const [inventory, profile] = await Promise.all([getInventoryItems(), getProfile()]);
      setItems(inventory);
      setFirstName(profile.name || 'User');
    } catch (error) {
      console.error('Gagal memuat inventory:', error);
    } finally {
      didInitialLoad.current = true;
      setLoading(false);
    }
  }, []);

  // Muat ulang setiap kali tab mendapat fokus, agar data dari layar lain ikut ter-refresh
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleMarkAsDeleted = (id: string, itemName: string) => {
    setItemToDelete({ id, name: itemName });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    const { id } = itemToDelete;
    setDeleteModalVisible(false);

    try {
      await deleteInventoryItem(id);
      setItems(prevItems => prevItems.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting item: ", error);
      showToast('error', t('fridge.deleteFailed'));
    } finally {
      setItemToDelete(null);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      setIsEditingName(false);
      return;
    }
    const newName = editedName.trim();
    setFirstName(newName);
    setIsEditingName(false);

    try {
      await setProfileName(newName);
    } catch (error) {
      console.error('Failed to update name', error);
    }
  };

  // Group items
  const filteredItems = items.filter(item => item.itemName.toLowerCase().includes(searchQuery.toLowerCase()));

  const stats = { fresh: 0, soon: 0, expired: 0 };
  const soonItems: any[] = [];
  const weekItems: any[] = [];
  const freshItems: any[] = [];

  filteredItems.forEach(item => {
    const days = calculateDaysRemaining(item.expiredDate);
    if (days < 0) {
      stats.expired++;
      soonItems.push({ ...item, days }); // Treat expired as soon/critical too
    } else if (days <= 2) {
      stats.soon++;
      soonItems.push({ ...item, days });
    } else if (days <= 7) {
      stats.soon++; // Counted as 'use soon' in overview? The design says 4 "Use soon"
      weekItems.push({ ...item, days });
    } else {
      stats.fresh++;
      freshItems.push({ ...item, days });
    }
  });

  const ProgressBar = ({ days }: { days: number }) => {
    let color = '#13ec6d'; // Primary from Stitch
    let width = '100%';
    if (days <= 2) { color = '#ef4444'; width = '15%'; } // red-500
    else if (days <= 7) { color = '#facc15'; width = '45%'; } // yellow-400

    return (
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { backgroundColor: color, width: width as any }]} />
      </View>
    );
  };

  const ItemCard = ({ item, color, sectionDaysMax }: { item: any, color: string, sectionDaysMax: number }) => {
    // Ikon per key kategori (kategori tersimpan sebagai key, lihat normalizeCategoryKey)
    const CATEGORY_EMOJI: Record<string, string> = {
        sayur: '🥬',
        buah: '🍎',
        daging: '🥩',
        ikan: '🐟',
        susu: '🥛',
        telur: '🥚',
        bumbu: '🧂',
        minuman: '🧃',
        lainnya: '🛒',
    };
    let emoji = '🛒'; // Default ikon keranjang
    if (CATEGORY_EMOJI[item.category]) emoji = CATEGORY_EMOJI[item.category];

    // Fallback based on item string parsing untuk deteksi kata populer —
    // hanya dipakai jika kategori belum memberi emoji spesifik (mis. 'lainnya'),
    // agar emoji kategori (mis. bayam → 🥬) tidak tertimpa oleh kata yang mirip.
    if (emoji === '🛒') {
        if (item.itemName.toLowerCase().includes('susu') || item.itemName.toLowerCase().includes('milk')) emoji = '🥛';
        if (item.itemName.toLowerCase().includes('alpukat') || item.itemName.toLowerCase().includes('avocado')) emoji = '🥑';
        if (item.itemName.toLowerCase().includes('ayam') || item.itemName.toLowerCase().includes('chicken')) emoji = '🍗';
        if (item.itemName.toLowerCase().includes('telur') || item.itemName.toLowerCase().includes('egg')) emoji = '🥚';
    }

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemIconBox}>
          <Text style={{ fontSize: 24 }}>{emoji}</Text>
        </View>
        <View style={styles.itemDetails}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <View style={{ backgroundColor: `${color}20`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: color }}>
                {item.days < 0 ? t('fridge.expired') : t('fridge.daysLeft', { count: item.days })}
              </Text>
            </View>
          </View>
          <ProgressBar days={item.days} />
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity onPress={() => handleMarkAsDeleted(item.id, item.itemName)} style={styles.checkBtn}>
            <IconSymbol name="trash.fill" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

      </View>
    );
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2ecc71" /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('fridge.greeting')}</Text>
            {isEditingName ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[styles.title, { borderBottomWidth: 1, borderColor: '#13ec6d', padding: 0, minWidth: 150 }]}
                  value={editedName}
                  onChangeText={setEditedName}
                  onSubmitEditing={handleSaveName}
                  autoFocus
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={handleSaveName} style={{ marginLeft: 8, padding: 4 }}>
                  <IconSymbol name="checkmark.seal.fill" size={24} color="#13ec6d" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setEditedName(firstName); setIsEditingName(true); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.title}>{t('fridge.title', { name: firstName })}</Text>
                  <IconSymbol name="pencil" size={20} color="#94a3b8" style={{ marginLeft: 8 }} />
                </View>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.bellIcon} onPress={() => setShowNotifications(true)}>
            <IconSymbol name="bell.fill" size={24} color="#2f3542" />
            {soonItems.length > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={20} color="#a4b0be" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('fridge.searchPlaceholder')}
            placeholderTextColor="#a4b0be"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Overview Row */}
        <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>{t('fridge.overview')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.overviewScroll}>
          <View style={[styles.overviewCard, { borderColor: '#f1f5f9', borderWidth: 1 }]}>
            <View style={[styles.overviewIconBg, { backgroundColor: '#13ec6d20' }]}>
              <IconSymbol name="leaf.fill" size={20} color="#15803d" />
            </View>
            <Text style={styles.overviewValue}>{stats.fresh}</Text>
            <Text style={styles.overviewLabel}>{t('fridge.freshItems')}</Text>
          </View>
          <View style={[styles.overviewCard, { borderColor: '#f1f5f9', borderWidth: 1 }]}>
            <View style={[styles.overviewIconBg, { backgroundColor: '#fef3c7' }]}>
              <IconSymbol name="clock.fill" size={20} color="#ca8a04" />
            </View>
            <Text style={styles.overviewValue}>{stats.soon}</Text>
            <Text style={styles.overviewLabel}>{t('fridge.useSoon')}</Text>
          </View>
          <View style={[styles.overviewCard, { borderColor: '#fee2e2', borderWidth: 1 }]}>
            <View style={[styles.overviewIconBg, { backgroundColor: '#fee2e2' }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#b91c1c" />
            </View>
            <Text style={styles.overviewValue}>{stats.expired}</Text>
            <Text style={[styles.overviewLabel, { color: '#dc2626' }]}>{t('fridge.expiring')}</Text>
          </View>
        </ScrollView>

        {/* Lists */}
        {soonItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <IconSymbol name="exclamationmark.circle.fill" size={18} color="#dc2626" />
              <Text style={[styles.sectionTitle, { color: '#dc2626', flex: 1, marginLeft: 6 }]}>{t('fridge.expiringSoon')}</Text>
              <View style={[styles.badgeCritical, { backgroundColor: '#fee2e2' }]}><Text style={[styles.badgeCriticalText, { color: '#b91c1c' }]}>{t('fridge.critical')}</Text></View>
            </View>
            {soonItems.map(item => <ItemCard key={item.id} item={item} color="#ef4444" sectionDaysMax={2} />)}
          </View>
        )}

        {weekItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <IconSymbol name="clock.fill" size={18} color="#ca8a04" />
              <Text style={[styles.sectionTitle, { color: '#a16207', marginLeft: 6 }]}>{t('fridge.useWithinWeek')}</Text>
            </View>
            {weekItems.map(item => <ItemCard key={item.id} item={item} color="#ca8a04" sectionDaysMax={7} />)}
          </View>
        )}

        {freshItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <IconSymbol name="checkmark.seal.fill" size={18} color="#13ec6d" />
              <Text style={[styles.sectionTitle, { color: '#0f172a', marginLeft: 6 }]}>{t('fridge.freshGood')}</Text>
            </View>
            {freshItems.map(item => <ItemCard key={item.id} item={item} color="#13ec6d" sectionDaysMax={14} />)}
          </View>
        )}

        {items.length === 0 && (
          <View style={styles.emptyContainer}>
            <IconSymbol name="archivebox" size={48} color="#dfe6e9" />
            <Text style={styles.emptyText}>{t('fridge.emptyTitle')}</Text>
            <Text style={styles.emptySub}>{t('fridge.emptySub')}</Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add')}>
        <IconSymbol name="plus" size={32} color="#fff" />
      </TouchableOpacity>

      <ConfirmModal
        visible={deleteModalVisible}
        title={t('fridge.deleteItemTitle')}
        message={t('fridge.deleteItemMessage', { name: itemToDelete?.name })}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setItemToDelete(null);
        }}
      />

      {/* Notifications Popover */}
      <Modal
        transparent
        visible={showNotifications}
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowNotifications(false)}>
          <Pressable style={styles.notifModalContent}>
            <View style={styles.notifModalHeader}>
              <Text style={styles.notifModalTitle}>{t('fridge.notificationsTitle')}</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)} style={{ padding: 4 }}>
                <IconSymbol name="xmark" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {soonItems.length === 0 ? (
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <IconSymbol name="bell.slash" size={32} color="#cbd5e1" />
                  <Text style={{ color: '#64748b', marginTop: 12 }}>{t('fridge.noAlerts')}</Text>
                </View>
              ) : (
                soonItems.map((item, index) => (
                  <View key={item.id + index} style={styles.notifCard}>
                     <View style={[styles.notifIconBox, { backgroundColor: item.days <= 0 ? '#fee2e2' : '#fef3c7' }]}>
                        <IconSymbol 
                          name={item.days <= 0 ? 'exclamationmark.triangle.fill' : 'clock.fill'} 
                          size={20} 
                          color={item.days <= 0 ? '#ef4444' : '#d97706'} 
                        />
                     </View>
                     <View style={{ flex: 1 }}>
                        <Text style={styles.notifTitle}>{item.days <= 0 ? t('fridge.expired') : t('fridge.expiringSoon')}</Text>
                        <Text style={styles.notifMessage}>{item.days <= 0 ? t('fridge.expiredMessage', { name: item.itemName }) : t('fridge.expiringMessage', { name: item.itemName, count: item.days })}</Text>
                     </View>
                  </View>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, color: '#64748b', marginBottom: 4, fontWeight: '500' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  bellIcon: { position: 'relative', padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 },
  notificationDot: { position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#f1f5f9' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { marginLeft: 12, fontSize: 14, color: '#0f172a', flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  overviewScroll: { paddingBottom: 8, gap: 16 },
  overviewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: 140, marginRight: 16, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', elevation: 1 },
  overviewIconBg: { alignSelf: 'flex-start', padding: 8, borderRadius: 8, marginBottom: 16 },
  overviewValue: { fontSize: 30, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 },
  overviewLabel: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  section: { marginBottom: 24 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  badgeCritical: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  badgeCriticalText: { fontSize: 12, fontWeight: '600' },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', elevation: 1 },
  itemIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  itemDetails: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  progressTrack: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, width: '100%' },
  progressFill: { height: 6, borderRadius: 3 },
  itemActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  itemDays: { fontSize: 12, fontWeight: '700' },
  checkBtn: { padding: 4, marginLeft: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginTop: 12 },
  emptySub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  fab: { position: 'absolute', right: 24, bottom: 96, width: 56, height: 56, borderRadius: 28, backgroundColor: '#13ec6d', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 10px rgba(19, 236, 109, 0.4)', elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-start', alignItems: 'flex-end', padding: 20, paddingTop: 100 },
  notifModalContent: { backgroundColor: '#fff', borderRadius: 20, width: 320, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)', elevation: 10, overflow: 'hidden' },
  notifModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  notifModalTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  notifCard: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  notifIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  notifMessage: { fontSize: 13, color: '#475569', lineHeight: 18 },
});
