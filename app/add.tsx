import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { addDoc, collection, limit, onSnapshot, query, orderBy, Timestamp, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { auth, db } from '../src/config/firebase';
import { IS_DEMO_MODE, useAuth } from '../src/contexts/AuthContext';
import { predictItemDetails } from '../src/services/aiService';
import { CATEGORIES, CATEGORY_KEYS, getDefaultExpDate } from '../src/utils/categoryDefaults';
import { scheduleExpiryNotification } from '../src/utils/notifications';

export default function AddItemScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    const [itemName, setItemName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [expiredDate, setExpiredDate] = useState<Date | null>(null);
    const isSmartPrediction = true;
    const [isLoading, setIsLoading] = useState(false);
    const [isAiPredicting, setIsAiPredicting] = useState(false);
    const [aiConfidence, setAiConfidence] = useState(0);
    const [aiReason, setAiReason] = useState('');
    const [predictedShelfLife, setPredictedShelfLife] = useState<number | null>(null);
    const [recentItems, setRecentItems] = useState<any[]>([]);

    const handleCategorySelect = (key: string) => {
        setSelectedCategory(key);
        setExpiredDate(getDefaultExpDate(key));
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Oct 28, 2023';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // AI Prediction Logic
    useEffect(() => {
        if (!isSmartPrediction || itemName.length < 3) return;

        const timer = setTimeout(async () => {
            setIsAiPredicting(true);
            try {
                const result = await predictItemDetails(itemName);
                if (result && isSmartPrediction) {
                    setSelectedCategory(result.categoryKey);
                    const date = new Date();
                    date.setDate(date.getDate() + result.shelfLifeDays);
                    setExpiredDate(date);
                    setAiConfidence(result.confidence);
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
    }, [itemName, isSmartPrediction]);

    // Fetch Recent Items
    useEffect(() => {
        const uid = user?.uid || (auth as any).currentUser?.uid;
        if (!uid) return;

        const q = query(
            collection(db, 'inventory'),
            where('userId', '==', uid),
            orderBy('addedDate', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRecentItems(items);
        });

        return () => unsubscribe();
    }, [user]);

    const handleSubmit = async () => {
        if (!itemName.trim()) {
            Alert.alert('Error', 'Please enter item name.');
            return;
        }
        if (!selectedCategory) {
            Alert.alert('Error', 'Please select a category.');
            return;
        }
        if (!expiredDate) {
            Alert.alert('Error', 'Please set an expiry date.');
            return;
        }

        setIsLoading(true);

        if (IS_DEMO_MODE) {
            scheduleExpiryNotification(itemName, 2);
            setTimeout(() => {
                Alert.alert('Success! ✅', `${itemName} has been added.`);
                setItemName('');
                setSelectedCategory('');
                setQuantity(1);
                setExpiredDate(null);
                setIsLoading(false);
            }, 500);
            return;
        }

        try {
            const uid = user?.uid || (auth as any).currentUser?.uid;
            if (!uid) {
                Alert.alert('Error', 'User not authenticated.');
                setIsLoading(false);
                return;
            }

            await addDoc(collection(db, 'inventory'), {
                userId: uid,
                itemName: itemName.trim(),
                category: CATEGORIES[selectedCategory].label,
                quantity: quantity.toString(),
                addedDate: Timestamp.now(),
                expiredDate: Timestamp.fromDate(expiredDate),
                status: 'active',
            });

            setItemName('');
            setSelectedCategory('');
            setQuantity(1);
            setExpiredDate(null);
            
            if (!isLargeScreen) router.back();
            else Alert.alert("Berhasil!", "Item ditambahkan.");

        } catch (error) {
            console.error('Error adding item:', error);
            Alert.alert('Failed', 'Could not add item.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Top Bar with Back Button */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <IconSymbol name="arrow.left" size={24} color="#1e293b" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.contentWrapper}>
                    {/* Main Elevated Card */}
                    <View style={styles.mainCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardHeaderTitle}>Add New Item</Text>
                        </View>
                        
                        <View style={styles.mainCardBody}>
                            <View style={[styles.mainCardFlex, isLargeScreen && styles.rowLayout]}>
                                {/* Left Side: Form */}
                                <View style={styles.formSection}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Item Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Milk"
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
                                                    <TouchableOpacity
                                                        key={key}
                                                        style={[styles.categoryBtn, isSelected && styles.categoryBtnSelected]}
                                                        onPress={() => handleCategorySelect(key)}
                                                    >
                                                        <Text style={styles.categoryBtnIcon}>{cat.icon}</Text>
                                                        <Text style={[styles.categoryBtnLabel, isSelected && styles.categoryBtnLabelSelected]} numberOfLines={1}>
                                                            {cat.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>

                                    <View style={styles.rowLayout}>
                                        <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                            <Text style={styles.label}>Expiry Date</Text>
                                            <TouchableOpacity style={styles.inputControl} onPress={() => Alert.alert("Date Picker", "Pilih tanggal")}>
                                                <Text style={styles.inputText}>{formatDate(expiredDate)}</Text>
                                                <IconSymbol name="calendar" size={20} color="#94a3b8" />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={[styles.inputGroup, { flex: 1 }]}>
                                            <Text style={styles.label}>Quantity</Text>
                                            <View style={styles.stepperControl}>
                                                <TouchableOpacity style={styles.stepBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                                                    <Text style={styles.stepBtnText}>−</Text>
                                                </TouchableOpacity>
                                                <TextInput
                                                    style={styles.stepperInput}
                                                    value={quantity.toString()}
                                                    onChangeText={(v) => setQuantity(parseInt(v) || 0)}
                                                    keyboardType="numeric"
                                                />
                                                <TouchableOpacity style={styles.stepBtn} onPress={() => setQuantity(quantity + 1)}>
                                                    <Text style={styles.stepBtnText}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Right Side: Storage Guide (AI Insight) */}
                                <View style={styles.guideSection}>
                                    <View style={styles.guideBanner}>
                                        <Text style={styles.guideBannerText}>Storage Guide</Text>
                                    </View>
                                    <View style={styles.guideContent}>
                                        {isAiPredicting ? (
                                            <View style={styles.guideLoading}>
                                                <ActivityIndicator size="small" color="#2d9254" />
                                                <Text style={styles.guideLoadingText}>Analyzing with Gemini AI...</Text>
                                            </View>
                                        ) : itemName.length >= 2 ? (
                                            <View>
                                                <Text style={styles.guideText}>
                                                    For <Text style={{fontWeight: '700'}}>"{selectedCategory ? CATEGORIES[selectedCategory].label : itemName}"</Text>:
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

                            {/* Footer Submit Button */}
                            <TouchableOpacity 
                                style={[styles.submitBtn, isLoading && { opacity: 0.8 }]} 
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Add to Inventory</Text>
                                )}
                            </TouchableOpacity>
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
    
    mainCardBody: { padding: 32 },
    mainCardFlex: { gap: 32 },
    rowLayout: { flexDirection: 'row', gap: 24 },
    formSection: { flex: 1.1, gap: 20 },
    guideSection: { flex: 0.9, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', minHeight: 220 },
    
    inputGroup: { gap: 8 },
    label: { fontSize: 13, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 16, height: 50, fontSize: 16, color: '#1e293b' },
    inputControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 16, height: 50 },
    inputText: { flex: 1, fontSize: 16, color: '#1e293b' },
    
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryBtn: { flexDirection: 'row', alignItems: 'center', width: '48.5%', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, gap: 10 },
    categoryBtnSelected: { backgroundColor: '#f0fdf4', borderColor: '#22c55e', borderWidth: 2 },
    categoryBtnIcon: { fontSize: 22 },
    categoryBtnLabel: { fontSize: 13, fontWeight: '700', color: '#64748b' },
    categoryBtnLabelSelected: { color: '#166534' },
    
    stepperControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, height: 50, overflow: 'hidden' },
    stepBtn: { width: 44, height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    stepBtnText: { fontSize: 22, fontWeight: '600', color: '#475569' },
    stepperInput: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#1e293b' },
    
    guideBanner: { backgroundColor: '#ecfdf5', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1.5, borderColor: '#d1fae5' },
    guideBannerText: { color: '#065f46', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
    guideContent: { padding: 20, gap: 16 },
    guideText: { fontSize: 14, color: '#475569', lineHeight: 22 },
    guidePlaceholder: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', lineHeight: 20 },
    guideLoading: { alignItems: 'center', paddingVertical: 30, gap: 12 },
    guideLoadingText: { fontSize: 13, color: '#64748b' },
    
    shelfLifeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', gap: 6, marginTop: 4 },
    shelfLifeText: { fontSize: 13, fontWeight: '800', color: '#065f46' },
    
    submitBtn: { backgroundColor: '#2d9254', height: 56, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: '#2d9254', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
