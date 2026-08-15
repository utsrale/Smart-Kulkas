import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ShopItem, deleteInventoryItem, getInventoryItems, getShoppingList, saveShoppingList } from '../../src/services/localStore';


export default function ShopScreen() {
    const [newItemText, setNewItemText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Smart suggestions (could be dynamic later)
    const [suggestions] = useState(['Susu UHT', 'Telur', 'Roti Tawar', 'Keju', 'Yogurt']);

    // Auto-detected from fridge (low stock / expiring)
    const [fridgeItems, setFridgeItems] = useState<ShopItem[]>([]);

    // Personal list
    const [personalItems, setPersonalItems] = useState<ShopItem[]>([]);

    // Muat ulang setiap kali tab mendapat fokus: bahan hampir kedaluwarsa (≤2 hari) + list pribadi
    const loadData = useCallback(async () => {
        try {
            const [inventory, savedList] = await Promise.all([getInventoryItems(), getShoppingList()]);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const expiring: ShopItem[] = [];
            inventory.forEach(item => {
                if (item.status !== 'active') return;
                const expDate = new Date(item.expiredDate);
                expDate.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays <= 2) {
                    expiring.push({
                        id: `fridge-${item.id}`,
                        text: item.itemName,
                        subtitle: diffDays <= 0 ? 'Already expired' : `${diffDays} days left`,
                        amount: item.quantity || '1',
                        checked: false,
                        section: 'fridge'
                    });
                }
            });
            setFridgeItems(expiring);
            setPersonalItems(savedList);
        } catch (error) {
            console.error('Gagal memuat shopping list:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const persistPersonal = (next: ShopItem[]) => {
        setPersonalItems(next);
        saveShoppingList(next).catch(err => console.error('Gagal menyimpan list:', err));
    };

    const addFromSuggestion = (text: string) => {
        if (personalItems.some(item => item.text === text)) return;
        persistPersonal([{
            id: `personal-${Date.now()}`,
            text,
            checked: false,
            section: 'personal'
        }, ...personalItems]);
    };

    const addPersonalItem = () => {
        if (!newItemText.trim()) return;
        persistPersonal([{
            id: `personal-${Date.now()}`,
            text: newItemText.trim(),
            checked: false,
            section: 'personal'
        }, ...personalItems]);
        setNewItemText('');
    };

    const toggleItem = (id: string, section: 'fridge' | 'personal') => {
        if (section === 'fridge') {
            setFridgeItems(prev => prev.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            ));
        } else {
            persistPersonal(personalItems.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            ));
        }
    };

    const deletePersonalItem = (id: string) => {
        persistPersonal(personalItems.filter(item => item.id !== id));
    };

    const handleMarkAsPurchased = async () => {
        const checkedFridgeItems = fridgeItems.filter(i => i.checked);
        const checkedPersonalItems = personalItems.filter(i => i.checked);
        const totalChecked = checkedFridgeItems.length + checkedPersonalItems.length;

        if (totalChecked === 0) {
            if (Platform.OS === 'web') alert('Check the items that have been purchased first.');
            else Alert.alert('Info', 'Check the items that have been purchased first.');
            return;
        }

        const confirmMsg = `${totalChecked} items will be marked as purchased.${checkedFridgeItems.length > 0 ? `\n\n${checkedFridgeItems.length} items from the fridge will be deleted from the inventory.` : ''}`;

        const proceed = Platform.OS === 'web'
            ? window.confirm(confirmMsg)
            : await new Promise<boolean>(resolve => {
                Alert.alert("Purchase Confirmation", confirmMsg, [
                    { text: "Cancel", onPress: () => resolve(false) },
                    { text: "Purchased!", onPress: () => resolve(true), style: 'default' }
                ]);
            });

        if (!proceed) return;

        setIsProcessing(true);
        try {
            // Delete checked fridge items dari inventory lokal
            for (const item of checkedFridgeItems) {
                const inventoryId = item.id.replace('fridge-', '');
                try {
                    await deleteInventoryItem(inventoryId);
                } catch {
                    console.warn('Could not delete:', inventoryId);
                }
            }

            // Remove checked personal items from list
            persistPersonal(personalItems.filter(i => !i.checked));

            const msg = `✅ ${totalChecked} items successfully updated!`;
            if (Platform.OS === 'web') alert(msg);
            else Alert.alert("Success!", msg);
        } catch (error) {
            console.error('Error marking as purchased:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Shopping List 🛒</Text>
                <Text style={styles.headerSubtitle}>Your smart shopping list</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Search/Add Input */}
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <IconSymbol name="plus" size={20} color="#94a3b8" />
                        <TextInput
                            style={styles.input}
                            placeholder="Add shopping item..."
                            placeholderTextColor="#94a3b8"
                            value={newItemText}
                            onChangeText={setNewItemText}
                            onSubmitEditing={addPersonalItem}
                        />
                    </View>
                </View>

                {/* Smart Suggestions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionLabel}>✨ QUICK SUGGESTIONS</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsRow}>
                        {suggestions.map((s, idx) => (
                            <TouchableOpacity key={idx} style={styles.suggestionPill} onPress={() => addFromSuggestion(s)}>
                                <IconSymbol name="plus" size={14} color="#13ec6d" />
                                <Text style={styles.suggestionText}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Auto-Added from Fridge */}
                {fridgeItems.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <IconSymbol name="refrigerator" size={18} color="#13ec6d" />
                            <Text style={styles.sectionLabel}>NEED TO REBUY</Text>
                        </View>
                        <Text style={styles.sectionHint}>Low stock or near expiry</Text>
                        {fridgeItems.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.listItem, item.checked && styles.listItemChecked]}
                                onPress={() => toggleItem(item.id, 'fridge')}
                                activeOpacity={0.7}
                            >
                                <IconSymbol
                                    name={item.checked ? "checkmark.circle.fill" : "checkmark.circle"}
                                    size={22}
                                    color={item.checked ? "#13ec6d" : "#cbd5e1"}
                                />
                                <View style={styles.itemContent}>
                                    <Text style={[styles.itemName, item.checked && styles.textChecked]}>{item.text}</Text>
                                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                                </View>
                                <Text style={styles.itemAmount}>{item.amount}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Personal List */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <IconSymbol name="pencil" size={18} color="#64748b" />
                        <Text style={styles.sectionLabel}>PERSONAL LIST</Text>
                    </View>
                    {personalItems.length === 0 ? (
                        <View style={styles.emptyPersonal}>
                            <Text style={styles.emptyText}>No items yet. Type in the field above to add.</Text>
                        </View>
                    ) : (
                        personalItems.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.listItem, item.checked && styles.listItemChecked]}
                                onPress={() => toggleItem(item.id, 'personal')}
                                activeOpacity={0.7}
                            >
                                <IconSymbol
                                    name={item.checked ? "checkmark.circle.fill" : "checkmark.circle"}
                                    size={22}
                                    color={item.checked ? "#13ec6d" : "#cbd5e1"}
                                />
                                <View style={styles.itemContent}>
                                    <Text style={[styles.itemName, item.checked && styles.textChecked]}>{item.text}</Text>
                                </View>
                                <TouchableOpacity onPress={() => deletePersonalItem(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <IconSymbol name="xmark" size={18} color="#ff7675" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Action */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[styles.fabButton, isProcessing && { opacity: 0.7 }]}
                    onPress={handleMarkAsPurchased}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="#0f172a" />
                    ) : (
                        <>
                            <IconSymbol name="checkmark.circle.fill" size={22} color="#0f172a" />
                            <Text style={styles.fabText}>Mark as Purchased</Text>
                        </>
                    )}
                </TouchableOpacity>
                <Text style={styles.fabHint}>Checked items will be updated in the inventory</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f6f8f7' },
    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
    headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

    scrollContent: { paddingBottom: 20 },

    inputContainer: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, height: 48 },
    input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#334155' },

    section: { paddingHorizontal: 16, paddingTop: 20 },
    sectionHeader: { marginBottom: 12 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    sectionLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
    sectionHint: { fontSize: 12, color: '#94a3b8', marginBottom: 12 },

    suggestionsRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
    suggestionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(19,236,109,0.08)', borderWidth: 1, borderColor: 'rgba(19,236,109,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    suggestionText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },

    listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f1f5f9' },
    listItemChecked: { opacity: 0.55 },
    itemContent: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '500', color: '#0f172a' },
    itemSubtitle: { fontSize: 12, color: '#f39c12', fontStyle: 'italic', marginTop: 2 },
    itemAmount: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
    textChecked: { textDecorationLine: 'line-through', color: '#94a3b8' },

    emptyPersonal: { paddingVertical: 20, alignItems: 'center' },
    emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },

    fabContainer: { position: 'absolute', bottom: Platform.OS === 'web' ? 80 : 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 20, paddingTop: 16, backgroundColor: '#f6f8f7' },
    fabButton: { flexDirection: 'row', backgroundColor: '#13ec6d', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8, boxShadow: '0 8px 16px rgba(19, 236, 109, 0.3)', elevation: 6 },
    fabText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
    fabHint: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 8 },
});
