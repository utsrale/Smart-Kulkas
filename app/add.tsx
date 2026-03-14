import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
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

    const [itemName, setItemName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [expiredDate, setExpiredDate] = useState<Date | null>(null);
    const isSmartPrediction = true; // Selalu true
    const [isLoading, setIsLoading] = useState(false);
    const [isAiPredicting, setIsAiPredicting] = useState(false);
    const [aiConfidence, setAiConfidence] = useState(0);
    const [aiReason, setAiReason] = useState('');

    const handleCategorySelect = (key: string) => {
        setSelectedCategory(key);
        setExpiredDate(getDefaultExpDate(key));
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'mm/dd/yyyy';
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
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
                }
            } catch (error) {
                console.error("AI Prediction failed:", error);
            } finally {
                setIsAiPredicting(false);
            }
        }, 1000); // 1 second debounce

        return () => clearTimeout(timer);
    }, [itemName, isSmartPrediction]);

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
            scheduleExpiryNotification(itemName, 2); // Dummy trigger 5 seconds from now
            setTimeout(() => {
                Alert.alert('Berhasil! ✅', `${itemName} telah ditambahkan ke kulkas Anda.`);
                router.back();
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
                quantity: quantity.trim() || '1',
                addedDate: Timestamp.now(),
                expiredDate: Timestamp.fromDate(expiredDate),
                status: 'active',
            });

            router.back();
        } catch (error) {
            console.error('Error adding item:', error);
            Alert.alert('Failed', 'Could not add item. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                    <IconSymbol name="arrow.left" size={24} color="#2f3542" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Item</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                    <IconSymbol name="xmark" size={24} color="#2f3542" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Quick Capture */}
                <Text style={styles.sectionTitle}>Quick Capture</Text>
                <View style={styles.captureRow}>
                    <TouchableOpacity style={styles.captureCard} onPress={() => Alert.alert("Scan Barcode", "Fitur ini akan ditambahkan di Versi 2.")}>
                        <View style={[styles.captureIconBg, { backgroundColor: '#e8f8f5' }]}>
                            <IconSymbol name="barcode.viewfinder" size={28} color="#2ecc71" />
                        </View>
                        <Text style={styles.captureText}>Scan Barcode</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.captureCard} onPress={() => Alert.alert("Scan Receipt", "Fitur OCR Struk akan ditambahkan di Versi 2.")}>
                        <View style={[styles.captureIconBg, { backgroundColor: '#e8f8f5' }]}>
                            <IconSymbol name="doc.text.viewfinder" size={28} color="#2ecc71" />
                        </View>
                        <Text style={styles.captureText}>Scan Receipt</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.dividerBox}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or add manually</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Form Fields */}
                <Text style={styles.label}>Item Name</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Milk, Avocados"
                        placeholderTextColor="#a4b0be"
                        value={itemName}
                        onChangeText={setItemName}
                    />
                    {isAiPredicting ? (
                        <ActivityIndicator size="small" color="#13ec6d" style={{ marginRight: 8 }} />
                    ) : (
                        <IconSymbol name="pencil" size={20} color="#a4b0be" />
                    )}
                </View>
                {isAiPredicting && (
                    <Text style={{ fontSize: 12, color: '#13ec6d', marginTop: -20, marginBottom: 20, fontWeight: '600' }}>
                        <ActivityIndicator size="small" color="#13ec6d" /> Menghubungkan ke Gemini AI... ✨
                    </Text>
                )}

                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {CATEGORY_KEYS.map((key) => {
                        const cat = CATEGORIES[key];
                        const isSelected = selectedCategory === key;
                        return (
                            <TouchableOpacity
                                key={key}
                                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                                onPress={() => handleCategorySelect(key)}
                            >
                                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.row}>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Expiry Date</Text>
                        <TouchableOpacity style={styles.inputContainer} onPress={() => Alert.alert("Date Picker", "Pilih tanggal dari modal (native picker)")}>
                            <Text style={[styles.inputText, !expiredDate && { color: '#a4b0be' }]}>
                                {formatDate(expiredDate)}
                            </Text>
                            <IconSymbol name="calendar" size={20} color="#2f3542" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.halfWidth}>
                        <Text style={styles.label}>Quantity</Text>
                        <View style={[styles.inputContainer, { marginBottom: 24 }]}>
                            <TextInput
                                style={styles.input}
                                placeholder="1"
                                placeholderTextColor="#a4b0be"
                                value={quantity}
                                onChangeText={setQuantity}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>

                {/* Smart Prediction Info */}
                <View style={styles.smartPredictionCard}>
                    <View style={styles.smartRow}>
                        <View>
                            <View style={styles.smartTitleRow}>
                                <IconSymbol name="sparkles" size={18} color="#2ecc71" />
                                <Text style={styles.smartTitle}>Smart Prediction Aktif</Text>
                            </View>
                            <Text style={styles.smartSub}>Prediksi otomatis oleh Gemini AI</Text>
                        </View>
                    </View>
                </View>

                {isSmartPrediction && selectedCategory && (
                    <View style={[styles.predictedCard, aiConfidence > 0.8 && { backgroundColor: '#13ec6d25', borderColor: '#13ec6d' }]}>
                        <IconSymbol name={aiConfidence > 0.8 ? "sparkles" : "lightbulb.fill"} size={24} color="#13ec6d" />
                        <View style={styles.predictedTextCol}>
                            <Text style={styles.predictedTitle}>
                                {aiConfidence > 0.8 ? 'AI Recommendation: ' : 'Predicted: '}
                                <Text style={{ fontWeight: 'bold' }}>{Math.round((expiredDate!.getTime() - new Date().getTime()) / (1000 * 3600 * 24))} Days</Text>
                            </Text>
                            <Text style={styles.predictedSub}>
                                {aiReason || `Berdasarkan analisis AI, ${itemName} (${CATEGORIES[selectedCategory].label}) biasanya bertahan selama ${Math.round((expiredDate!.getTime() - new Date().getTime()) / (1000 * 3600 * 24))} hari.`}
                            </Text>
                        </View>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer / Submit Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <IconSymbol name="archivebox.fill" size={20} color="#fff" />
                            <Text style={styles.submitBtnText}>Add to Inventory</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f6f8f7' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: 'rgba(246, 248, 247, 0.9)' },
    headerIcon: { padding: 8, borderRadius: 20 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: -0.5 },
    content: { padding: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
    captureRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    captureCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, borderWidth: 1, borderColor: '#e2e8f0' },
    captureIconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    captureText: { fontSize: 14, fontWeight: '700', color: '#334155' },
    dividerBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
    dividerText: { marginHorizontal: 12, fontSize: 14, fontWeight: '500', color: '#64748b' },
    label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    input: { flex: 1, fontSize: 16, color: '#0f172a' },
    inputText: { flex: 1, fontSize: 16, color: '#0f172a' },
    categoryScroll: { paddingBottom: 24, gap: 12 },
    categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingHorizontal: 16, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 12 },
    categoryChipSelected: { backgroundColor: '#13ec6d10', borderColor: '#13ec6d' },
    categoryIcon: { fontSize: 18, marginRight: 8 },
    categoryText: { fontSize: 14, fontWeight: '500', color: '#475569' },
    categoryTextSelected: { color: '#0f172a', fontWeight: 'bold' },
    row: { flexDirection: 'row', gap: 16 },
    halfWidth: { flex: 1 },
    quantityContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderRadius: 12, height: 48, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 4, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    qBtn: { padding: 8, width: 40, alignItems: 'center' },
    qText: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    smartPredictionCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, borderWidth: 1, borderColor: '#f1f5f9' },
    smartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    smartTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    smartTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginLeft: 6 },
    smartSub: { fontSize: 12, color: '#64748b' },
    predictedCard: { flexDirection: 'row', backgroundColor: '#13ec6d15', borderRadius: 8, padding: 12, alignItems: 'flex-start' },
    predictedTextCol: { flex: 1, marginLeft: 12 },
    predictedTitle: { fontSize: 14, fontWeight: '500', color: '#1e293b', marginBottom: 4 },
    predictedSub: { fontSize: 12, color: '#475569', lineHeight: 18 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent', padding: 20, paddingTop: 40, paddingBottom: 40 },
    submitBtn: { flexDirection: 'row', backgroundColor: '#13ec6d', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#13ec6d', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
    submitBtnText: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
});
