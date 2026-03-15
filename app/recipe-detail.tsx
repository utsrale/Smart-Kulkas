import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../src/config/firebase';
import { useAuth } from '../src/contexts/AuthContext';
import { RecipeSuggestion } from '../src/services/aiService';

export default function RecipeDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuth();

    const [recipe, setRecipe] = useState<RecipeSuggestion | null>(null);
    const [checkedFridge, setCheckedFridge] = useState<Set<number>>(new Set());
    const [checkedPantry, setCheckedPantry] = useState<Set<number>>(new Set());
    const [isFinishing, setIsFinishing] = useState(false);
    const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);

    useEffect(() => {
        try {
            const recipeData = JSON.parse(params.recipe as string) as RecipeSuggestion;
            setRecipe(recipeData);

            // Use a curated list of premium food images that never fail CORS and look amazing
            const foodImages = [
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
                "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
                "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
                "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80",
                "https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=800&q=80",
                "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80",
                "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
                "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
                "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80"
            ];
            
            // Pick a consistent image based on the title's length and character codes
            let hash = 0;
            const title = recipeData.title || "recipe";
            for (let i = 0; i < title.length; i++) {
                hash = title.charCodeAt(i) + ((hash << 5) - hash);
            }
            const imgIndex = Math.abs(hash) % foodImages.length;
            
            setHeroImageUrl(foodImages[imgIndex]);
        } catch (e) {
            console.error('Failed to parse recipe data:', e);
        }
    }, [params.recipe]);

    const toggleFridgeCheck = (idx: number) => {
        setCheckedFridge(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const togglePantryCheck = (idx: number) => {
        setCheckedPantry(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const handleFinishCooking = async () => {
        if (!recipe) return;

        const uid = user?.uid || (auth as any).currentUser?.uid;
        if (!uid) {
            Alert.alert("Error", "Anda harus login terlebih dahulu.");
            return;
        }

        const selectedItems = recipe.fridgeIngredients
            .filter((_, idx) => checkedFridge.has(idx))
            .map(item => item.name);

        if (selectedItems.length === 0) {
            Alert.alert("Peringatan", "Pilih bahan dari kulkas yang sudah Anda gunakan.");
            return;
        }

        const confirmMsg = `Bahan berikut akan dihapus dari kulkas Anda:\n\n${selectedItems.map(n => `• ${n}`).join('\n')}\n\nLanjutkan?`;

        const proceed = Platform.OS === 'web'
            ? window.confirm(confirmMsg)
            : await new Promise<boolean>(resolve => {
                Alert.alert("Selesai Memasak?", confirmMsg, [
                    { text: "Batal", onPress: () => resolve(false) },
                    { text: "Ya, Hapus", onPress: () => resolve(true), style: 'destructive' }
                ]);
            });

        if (!proceed) return;

        setIsFinishing(true);
        try {
            for (const itemName of selectedItems) {
                const q = query(
                    collection(db, 'inventory'),
                    where('userId', '==', uid),
                    where('itemName', '==', itemName),
                    where('status', '==', 'active')
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    await deleteDoc(doc(db, 'inventory', snapshot.docs[0].id));
                }
            }

            if (Platform.OS === 'web') {
                alert(`✅ Selesai! ${selectedItems.length} bahan telah dihapus dari kulkas.`);
            } else {
                Alert.alert("Selesai!", `${selectedItems.length} bahan telah dihapus dari kulkas.`);
            }
            router.back();
        } catch (error: any) {
            console.error("Error finishing cooking:", error);
            Alert.alert("Error", "Gagal memperbarui stok kulkas.");
        } finally {
            setIsFinishing(false);
        }
    };

    if (!recipe) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#13ec6d" />
            </View>
        );
    }

    const difficultyColor = recipe.difficulty === 'Easy' ? '#f39c12' : recipe.difficulty === 'Medium' ? '#e67e22' : '#e74c3c';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
                    <IconSymbol name="arrow.left" size={22} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{recipe.title}</Text>
                <View style={styles.headerBtn} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    {heroImageUrl && (
                        <Image
                            source={{ uri: heroImageUrl }}
                            style={styles.heroImage}
                            resizeMode="cover"
                        />
                    )}
                    <View style={styles.heroOverlay} />
                </View>

                {/* Title & Meta */}
                <View style={styles.titleSection}>
                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                    <Text style={styles.recipeDesc}>{recipe.description}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaBadge}>
                            <IconSymbol name="clock.fill" size={16} color="#64748b" />
                            <Text style={styles.metaText}>{recipe.prepTime}</Text>
                        </View>
                        <View style={[styles.metaBadge, { backgroundColor: '#fef3c7' }]}>
                            <Text style={[styles.metaText, { color: difficultyColor }]}>🔥 {recipe.difficulty}</Text>
                        </View>
                        <View style={styles.metaBadge}>
                            <Text style={styles.metaText}>⚡ {recipe.calories}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Fridge Ingredients */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🧊 Bahan dari Kulkas</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{recipe.fridgeIngredients.length} item</Text>
                        </View>
                    </View>
                    {recipe.fridgeIngredients.map((item, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.fridgeItem, checkedFridge.has(idx) && styles.fridgeItemChecked]}
                            onPress={() => toggleFridgeCheck(idx)}
                            activeOpacity={0.7}
                        >
                            <IconSymbol
                                name={checkedFridge.has(idx) ? "checkmark.circle.fill" : "checkmark.circle"}
                                size={24}
                                color={checkedFridge.has(idx) ? "#2ecc71" : "#cbd5e1"}
                            />
                            <View style={styles.fridgeItemContent}>
                                <Text style={[styles.fridgeItemName, checkedFridge.has(idx) && styles.textChecked]}>{item.name}</Text>
                                <Text style={styles.fridgeItemAmount}>{item.amount}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Pantry Staples */}
                {recipe.pantryStaples.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitleSmall}>🫙 Bumbu & Bahan Tambahan</Text>
                        {recipe.pantryStaples.map((item, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.pantryItem}
                                onPress={() => togglePantryCheck(idx)}
                                activeOpacity={0.7}
                            >
                                <IconSymbol
                                    name={checkedPantry.has(idx) ? "checkmark.circle.fill" : "checkmark.circle"}
                                    size={20}
                                    color={checkedPantry.has(idx) ? "#2ecc71" : "#cbd5e1"}
                                />
                                <Text style={[styles.pantryText, checkedPantry.has(idx) && styles.textChecked]}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={styles.divider} />

                {/* Instructions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitleLarge}>📝 Cara Memasak</Text>
                    <View style={styles.timeline}>
                        {recipe.instructions.map((step, idx) => (
                            <View key={idx} style={styles.timelineStep}>
                                <View style={styles.timelineLeft}>
                                    <View style={[styles.stepCircle, idx === 0 && styles.stepCircleActive]}>
                                        <Text style={[styles.stepNum, idx === 0 && styles.stepNumActive]}>{idx + 1}</Text>
                                    </View>
                                    {idx < recipe.instructions.length - 1 && <View style={styles.timelineLine} />}
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={styles.stepText}>{step}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Floating Action Button */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[styles.fabButton, isFinishing && { opacity: 0.7 }]}
                    onPress={handleFinishCooking}
                    disabled={isFinishing}
                    activeOpacity={0.85}
                >
                    {isFinishing ? (
                        <ActivityIndicator color="#0f172a" />
                    ) : (
                        <>
                            <IconSymbol name="checkmark.circle.fill" size={22} color="#0f172a" />
                            <Text style={styles.fabText}>Selesai Masak & Update Kulkas</Text>
                        </>
                    )}
                </TouchableOpacity>
                <Text style={styles.fabHint}>Bahan yang dicentang akan dihapus dari inventaris</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f6f8f7' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f8f7' },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    headerBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', maxWidth: 200, textAlign: 'center' },

    scrollContent: { paddingBottom: 20 },

    // Hero
    heroContainer: { width: '100%', height: 240, backgroundColor: '#e2e8f0', overflow: 'hidden' },
    heroImage: { width: '100%', height: '100%' },
    heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'transparent' },

    // Title Section
    titleSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
    recipeTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
    recipeDesc: { fontSize: 15, color: '#64748b', lineHeight: 22, marginBottom: 16 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    metaText: { fontSize: 13, fontWeight: '600', color: '#475569' },

    divider: { height: 1, backgroundColor: '#e2e8f0', marginHorizontal: 20, marginVertical: 8 },

    // Sections
    section: { paddingHorizontal: 20, paddingVertical: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    sectionTitleSmall: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
    sectionTitleLarge: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
    countBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    countText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },

    // Fridge Items
    fridgeItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
    fridgeItemChecked: { opacity: 0.65, backgroundColor: '#f8fafc' },
    fridgeItemContent: { flex: 1 },
    fridgeItemName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    fridgeItemAmount: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

    // Pantry
    pantryItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f1f5f9' },
    pantryText: { fontSize: 15, color: '#475569' },

    textChecked: { textDecorationLine: 'line-through', color: '#94a3b8' },

    // Timeline
    timeline: { paddingLeft: 4 },
    timelineStep: { flexDirection: 'row', minHeight: 80 },
    timelineLeft: { width: 36, alignItems: 'center' },
    stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    stepCircleActive: { backgroundColor: '#13ec6d', borderColor: '#13ec6d' },
    stepNum: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
    stepNumActive: { color: '#0f172a' },
    timelineLine: { flex: 1, width: 2, backgroundColor: '#e2e8f0', marginVertical: 4 },
    stepContent: { flex: 1, paddingLeft: 14, paddingBottom: 20 },
    stepText: { fontSize: 15, color: '#475569', lineHeight: 24 },

    // FAB
    fabContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 20, paddingTop: 16, backgroundColor: '#f6f8f7' },
    fabButton: { flexDirection: 'row', backgroundColor: '#13ec6d', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#13ec6d', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 },
    fabText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
    fabHint: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 8 },
});
