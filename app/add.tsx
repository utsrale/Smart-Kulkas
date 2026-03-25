import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text, TextInput,
    useWindowDimensions,
    View
} from 'react-native';
import { auth, db } from '../src/config/firebase';
import { IS_DEMO_MODE, useAuth } from '../src/contexts/AuthContext';
import { predictItemDetails } from '../src/services/aiService';
import { CATEGORIES, CATEGORY_KEYS, getDefaultExpDate } from '../src/utils/categoryDefaults';

export default function AddItemScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    const [itemName, setItemName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [expiredDate, setExpiredDate] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAiPredicting, setIsAiPredicting] = useState(false);
    const [aiReason, setAiReason] = useState('');
    const [predictedShelfLife, setPredictedShelfLife] = useState<number | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Cross-platform alert that works on mobile web
    const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}\n${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const handleCategorySelect = (key: string) => {
        setSelectedCategory(key);
        setExpiredDate(getDefaultExpDate(key));
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '-';
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Format date for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (date: Date | null) => {
        if (!date) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // AI Prediction Logic
    useEffect(() => {
        if (itemName.length < 3) return;

        const timer = setTimeout(async () => {
            setIsAiPredicting(true);
            try {
                const result = await predictItemDetails(itemName);
                if (result) {
                    // Only use AI category if it's a valid key
                    const catKey = CATEGORIES[result.categoryKey] ? result.categoryKey : 'lainnya';
                    setSelectedCategory(catKey);
                    const date = new Date();
                    date.setDate(date.getDate() + result.shelfLifeDays);
                    setExpiredDate(date);
                    setAiReason(result.reason || '');
                    setPredictedShelfLife(result.shelfLifeDays);
                }
            } catch (error) {
                console.error("AI Prediction failed:", error);
            } finally {
                setIsAiPredicting(false);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [itemName]);

    const handleSubmit = async () => {
        setStatusMessage(null);

        if (!itemName.trim()) {
            setStatusMessage({ type: 'error', text: '⚠️ Please enter an item name.' });
            showAlert('Error', 'Please enter an item name.');
            return;
        }
        if (!selectedCategory) {
            setStatusMessage({ type: 'error', text: '⚠️ Please select an item category.' });
            showAlert('Error', 'Please select an item category.');
            return;
        }
        if (!expiredDate) {
            setStatusMessage({ type: 'error', text: '⚠️ Expiry date is not set.' });
            showAlert('Error', 'Expiry date is not set.');
            return;
        }

        setIsLoading(true);

        if (IS_DEMO_MODE) {
            setTimeout(() => {
                setStatusMessage({ type: 'success', text: '✅ ' + itemName + ' has been added!' });
                showAlert('Success! ✅', `${itemName} has been added.`);
                resetForm();
                setIsLoading(false);
            }, 500);
            return;
        }

        try {
            const uid = user?.uid || (auth as any).currentUser?.uid;
            if (!uid) {
                setStatusMessage({ type: 'error', text: '⚠️ You are not logged in. Please log in first.' });
                showAlert('Error', 'You are not logged in. Please log in first.');
                setIsLoading(false);
                return;
            }

            const categoryLabel = CATEGORIES[selectedCategory]?.label || selectedCategory;

            await addDoc(collection(db, 'inventory'), {
                userId: uid,
                itemName: itemName.trim(),
                category: categoryLabel,
                quantity: quantity.toString(),
                addedDate: Timestamp.now(),
                expiredDate: Timestamp.fromDate(expiredDate),
                status: 'active',
            });

            setStatusMessage({ type: 'success', text: '✅ ' + itemName + ' successfully added to the inventory!' });
            showAlert('Success! ✅', `${itemName} has been added to the inventory.`);
            resetForm();

            if (!isLargeScreen) {
                setTimeout(() => router.back(), 1000);
            }
        } catch (error: any) {
            console.error('[AddItem] ❌ Error adding item:', error);
            const msg = error.message?.includes('permission') 
                ? 'Cannot save: check if you are logged in and your internet connection is stable.'
                : `Cannot add item: ${error.message || 'Unknown error'}`;
            setStatusMessage({ type: 'error', text: '❌ ' + msg });
            showAlert('Failed', msg);        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setItemName('');
        setSelectedCategory('');
        setQuantity(1);
        setExpiredDate(null);
        setAiReason('');
        setPredictedShelfLife(null);
    };

    // Safe category label getter
    const getCategoryLabel = (key: string) => {
        return CATEGORIES[key]?.label || key || '';
    };

    return (
        <View style={styles.container}>
            {/* Top Bar with Back Button */}
            <View style={styles.topBar}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <IconSymbol name="arrow.left" size={24} color="#1e293b" />
                </Pressable>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.contentWrapper}>
                    {/* Main Elevated Card */}
                    <View style={styles.mainCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardHeaderTitle}>Add New Item</Text>
                        </View>
                        
                        <View style={styles.mainCardBody}>
                            <View style={[styles.mainCardFlex, isLargeScreen && styles.rowLayout]}>
                                {/* Left Side: Form */}
                                <View style={[styles.formSection, isLargeScreen && { flex: 1.1 }]}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Item Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Example: Milk, Eggs, Chicken..."
                                            placeholderTextColor="#94a3b8"
                                            value={itemName}
                                            onChangeText={setItemName}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Category</Text>
                                        <View style={styles.categoryGrid}>
                                            {CATEGORY_KEYS.map((key) => {
                                                const cat = CATEGORIES[key];
                                                const isSelected = selectedCategory === key;
                                                return (
                                                    <Pressable
                                                        key={key}
                                                        style={[styles.categoryBtn, isSelected && styles.categoryBtnSelected]}
                                                        onPress={() => handleCategorySelect(key)}
                                                    >
                                                        <Text style={styles.categoryBtnIcon}>{cat.icon}</Text>
                                                        <Text style={[styles.categoryBtnLabel, isSelected && styles.categoryBtnLabelSelected]} numberOfLines={1}>
                                                            {cat.label}
                                                        </Text>
                                                    </Pressable>
                                                );
                                            })}
                                        </View>
                                    </View>

                                    <View style={styles.rowLayout}>
                                        <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                            <Text style={styles.label}>Expiry Date</Text>
                                            {Platform.OS === 'web' ? (
                                                <input
                                                    type="date"
                                                    value={formatDateForInput(expiredDate)}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val) {
                                                            setExpiredDate(new Date(val + 'T00:00:00'));
                                                        }
                                                    }}
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        border: '1.5px solid #e2e8f0',
                                                        borderRadius: 10,
                                                        paddingLeft: 16,
                                                        paddingRight: 16,
                                                        height: 50,
                                                        fontSize: 16,
                                                        color: '#1e293b',
                                                        fontFamily: 'inherit',
                                                        width: '100%',
                                                        boxSizing: 'border-box' as any,
                                                    }}
                                                />
                                            ) : (
                                                <View style={styles.inputControl}>
                                                    <Text style={styles.inputText}>{formatDate(expiredDate)}</Text>
                                                    <IconSymbol name="calendar" size={20} color="#94a3b8" />
                                                </View>
                                            )}
                                        </View>
                                        <View style={[styles.inputGroup, { flex: 1 }]}>
                                            <Text style={styles.label}>Quantity</Text>
                                            <View style={styles.stepperControl}>
                                                <Pressable style={styles.stepBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                                                    <Text style={styles.stepBtnText}>−</Text>
                                                </Pressable>
                                                {Platform.OS === 'web' ? (
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={quantity}
                                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                        style={{
                                                            flex: 1,
                                                            textAlign: 'center',
                                                            fontSize: 16,
                                                            fontWeight: 800,
                                                            color: '#1e293b',
                                                            border: 'none',
                                                            outline: 'none',
                                                            background: 'transparent',
                                                            width: '100%',
                                                            height: '100%',
                                                            fontFamily: 'inherit',
                                                            MozAppearance: 'textfield' as any,
                                                        }}
                                                    />
                                                ) : (
                                                    <TextInput
                                                        style={styles.stepperInput}
                                                        value={quantity.toString()}
                                                        onChangeText={(v) => setQuantity(Math.max(1, parseInt(v) || 1))}
                                                        keyboardType="numeric"
                                                    />
                                                )}
                                                <Pressable style={styles.stepBtn} onPress={() => setQuantity(quantity + 1)}>
                                                    <Text style={styles.stepBtnText}>+</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Right Side: Storage Guide (AI Insight) */}
                                <View style={[styles.guideSection, isLargeScreen && { flex: 0.9 }]}>
                                    <View style={styles.guideBanner}>
                                        <Text style={styles.guideBannerText}>Storage Guide</Text>
                                    </View>
                                    <View style={styles.guideContent}>
                                        {isAiPredicting ? (
                                            <View style={styles.guideLoading}>
                                                <ActivityIndicator size="small" color="#2d9254" />
                                                <Text style={styles.guideLoadingText}>Analyzing with AI...</Text>
                                            </View>
                                        ) : itemName.length >= 2 ? (
                                            <View>
                                                <Text style={styles.guideText}>
                                                    For <Text style={{fontWeight: '700'}}>"{selectedCategory ? getCategoryLabel(selectedCategory) : itemName}"</Text>:
                                                </Text>
                                                <Text style={styles.guideText}>
                                                    {aiReason || `Store in the refrigerator to maintain freshness longer. Once opened, consume within a few days for best quality.`}
                                                </Text>
                                                {predictedShelfLife && (
                                                    <View style={styles.shelfLifeBadge}>
                                                        <IconSymbol name="clock.arrow.circlepath" size={16} color="#065f46" />
                                                        <Text style={styles.shelfLifeText}>Estimated: {predictedShelfLife} Days</Text>
                                                    </View>
                                                )}
                                            </View>
                                        ) : (
                                            <Text style={styles.guidePlaceholder}>
                                                Enter an item name to see AI-powered storage tips and shelf life recommendations.
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Status Message Banner */}
                            {statusMessage && (
                                <View style={[
                                    styles.statusBanner, 
                                    statusMessage.type === 'success' ? styles.statusSuccess : styles.statusError
                                ]}>
                                    <Text style={[
                                        styles.statusText, 
                                        statusMessage.type === 'success' ? styles.statusTextSuccess : styles.statusTextError
                                    ]}>
                                        {statusMessage.text}
                                    </Text>
                                </View>
                            )}

                            {/* Footer Submit Button */}
                            <Pressable 
                                style={[styles.submitBtn, isLoading && { opacity: 0.8 }]} 
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Add to Inventory</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    topBar: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 64 : 24, paddingBottom: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    
    scrollContent: { paddingBottom: 60 },
    contentWrapper: { alignItems: 'center', paddingHorizontal: 24 },
    
    mainCard: { width: '100%', maxWidth: 1040, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 30, elevation: 10, marginTop: 10 },
    cardHeader: { backgroundColor: '#2d9254', paddingVertical: 18, alignItems: 'center' },
    cardHeaderTitle: { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },
    
    mainCardBody: { padding: 20 },
    mainCardFlex: { gap: 20 },
    rowLayout: { flexDirection: 'row', gap: 16 },
    formSection: { gap: 16 },
    guideSection: { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', minHeight: 180 },
    
    inputGroup: { gap: 8 },
    label: { fontSize: 13, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 16, height: 50, fontSize: 16, color: '#1e293b' },
    inputControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 16, height: 50 },
    inputText: { flex: 1, fontSize: 16, color: '#1e293b' },
    
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryBtn: { flexDirection: 'row', alignItems: 'center', width: '48%', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, gap: 8 },
    categoryBtnSelected: { backgroundColor: '#f0fdf4', borderColor: '#22c55e', borderWidth: 2 },
    categoryBtnIcon: { fontSize: 20 },
    categoryBtnLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', flexShrink: 1 },
    categoryBtnLabelSelected: { color: '#166534' },
    
    stepperControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, height: 50, overflow: 'hidden' },
    stepBtn: { width: 44, height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    stepBtnText: { fontSize: 22, fontWeight: '600', color: '#475569' },
    stepperInput: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#1e293b' },
    
    guideBanner: { backgroundColor: '#ecfdf5', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1.5, borderColor: '#d1fae5' },
    guideBannerText: { color: '#065f46', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
    guideContent: { padding: 16, gap: 12 },
    guideText: { fontSize: 14, color: '#475569', lineHeight: 22 },
    guidePlaceholder: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', lineHeight: 20 },
    guideLoading: { alignItems: 'center', paddingVertical: 24, gap: 10 },
    guideLoadingText: { fontSize: 13, color: '#64748b' },
    
    shelfLifeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', gap: 6, marginTop: 4 },
    shelfLifeText: { fontSize: 13, fontWeight: '800', color: '#065f46' },
    
    submitBtn: { backgroundColor: '#2d9254', height: 56, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 16, shadowColor: '#2d9254', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4, cursor: 'pointer' as any },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },

    statusBanner: { padding: 14, borderRadius: 10, marginTop: 16 },
    statusSuccess: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac' },
    statusError: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5' },
    statusText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
    statusTextSuccess: { color: '#166534' },
    statusTextError: { color: '#991b1b' },
});
