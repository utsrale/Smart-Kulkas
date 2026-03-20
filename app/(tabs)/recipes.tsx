import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../src/config/firebase';
import { useAuth } from '../../src/contexts/AuthContext';
import { generateRecipes, RecipeSuggestion } from '../../src/services/aiService';

export default function RecipesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const uid = user?.uid || (auth as any).currentUser?.uid;
        if (!uid) return;

        const q = query(
            collection(db, 'inventory'),
            where('userId', '==', uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs
                .filter(doc => doc.data().status === 'active')
                .map(doc => doc.data().itemName as string);
            
            const uniqueItems = Array.from(new Set(items)).sort();
            setIngredients(uniqueItems);
            // By default, select all if none were selected before
            if (selectedIngredients.length === 0 && uniqueItems.length > 0) {
                setSelectedIngredients(uniqueItems);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const toggleIngredient = (name: string) => {
        if (selectedIngredients.includes(name)) {
            setSelectedIngredients(selectedIngredients.filter(i => i !== name));
        } else {
            setSelectedIngredients([...selectedIngredients, name]);
        }
    };

    const handleSelectAll = () => setSelectedIngredients([...ingredients]);
    const handleClearAll = () => setSelectedIngredients([]);

    const handleGenerateRecipes = async () => {
        if (selectedIngredients.length === 0) {
            Alert.alert("Pilih Bahan", "Silakan pilih setidaknya satu bahan untuk meracik resep!");
            return;
        }

        setIsLoading(true);
        setRecipes([]); // Reset current list
        try {
            const results = await generateRecipes(selectedIngredients);
            setRecipes(results);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Gagal mendapatkan resep dari Gemini AI.");
        } finally {
            setIsLoading(false);
        }
    };

    const openRecipeDetail = (recipe: RecipeSuggestion) => {
        router.push({ pathname: '/recipe-detail', params: { recipe: JSON.stringify(recipe) } });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>AI Recipe Maker 👨‍🍳</Text>
                    <IconSymbol name="sparkles" size={24} color="#8e44ad" />
                </View>
                <Text style={styles.headerSubtitle}>
                    {ingredients.length > 0
                        ? `Pilih bahan yang ingin Anda gunakan dari ${ingredients.length} item di kulkas.`
                        : "Kulkas Anda kosong. Tambahkan bahan dulu!"}
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Ingredient Selection Section */}
                {ingredients.length > 0 && (
                    <View style={styles.selectionSection}>
                        <View style={styles.selectionHeader}>
                            <Text style={styles.selectionTitle}>Pilih Bahan Masakan</Text>
                            <View style={styles.selectionActions}>
                                <TouchableOpacity onPress={handleSelectAll}>
                                    <Text style={styles.actionText}>Pilih Semua</Text>
                                </TouchableOpacity>
                                <View style={styles.divider} />
                                <TouchableOpacity onPress={handleClearAll}>
                                    <Text style={styles.actionText}>Hapus</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        <View style={styles.chipContainer}>
                            {ingredients.map((ing) => {
                                const isSelected = selectedIngredients.includes(ing);
                                return (
                                    <TouchableOpacity
                                        key={ing}
                                        style={[styles.chip, isSelected && styles.chipSelected]}
                                        onPress={() => toggleIngredient(ing)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                            {isSelected && <IconSymbol name="checkmark.circle.fill" size={14} color="#fff" />}
                                        </View>
                                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{ing}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Generate Button */}
                <TouchableOpacity
                    style={[styles.generateBtn, (isLoading || selectedIngredients.length === 0) && { opacity: 0.6 }]}
                    onPress={handleGenerateRecipes}
                    disabled={isLoading || selectedIngredients.length === 0}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <IconSymbol name="book.fill" size={20} color="#fff" />
                            <Text style={styles.generateBtnText}>
                                Buat Resep ({selectedIngredients.length} Bahan)
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Recipes List */}
                <View style={styles.recipeList}>
                    {recipes.map((recipe) => (
                        <TouchableOpacity
                            key={recipe.id}
                            style={styles.recipeCard}
                            onPress={() => openRecipeDetail(recipe)}
                            activeOpacity={0.9}
                        >
                            <View style={styles.recipeHeader}>
                                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                                <Text style={styles.recipeDesc} numberOfLines={2}>{recipe.description}</Text>
                                <View style={styles.metaRow}>
                                    <View style={styles.metaBadge}>
                                        <IconSymbol name="clock.fill" size={12} color="#64748b" />
                                        <Text style={styles.metaText}>{recipe.prepTime}</Text>
                                    </View>
                                    <View style={[styles.metaBadge, { backgroundColor: '#fef3c7' }]}>
                                        <Text style={[styles.metaText, { color: '#92400e' }]}>difficulty: {recipe.difficulty}</Text>
                                    </View>
                                    <View style={styles.metaBadge}>
                                        <Text style={styles.metaText}>🔥 {recipe.calories}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.viewRecipeBtn}>
                                <Text style={styles.viewRecipeText}>Buka Detail Resep</Text>
                                <IconSymbol name="chevron.right" size={16} color="#8e44ad" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {recipes.length === 0 && !isLoading && (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <IconSymbol name="refrigerator" size={40} color="#cbd5e1" />
                        </View>
                        <Text style={styles.emptyText}>Pilih bahan di atas kemudian tekan tombol ungu untuk mulai meracik resep terbaik!</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
    headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    headerTitle: { fontSize: 26, fontWeight: '900', color: '#1e293b' },
    headerSubtitle: { fontSize: 14, color: '#64748b', lineHeight: 20, maxWidth: '90%', fontWeight: '500' },
    
    content: { padding: 24, paddingBottom: 120 },
    
    selectionSection: { marginBottom: 30 },
    selectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    selectionTitle: { fontSize: 13, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 1 },
    selectionActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    actionText: { fontSize: 12, fontWeight: '700', color: '#8e44ad' },
    divider: { width: 1, height: 12, backgroundColor: '#e2e8f0' },
    
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    chipSelected: { backgroundColor: '#f5f3ff', borderColor: '#8e44ad', borderWidth: 1.5 },
    checkbox: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
    checkboxSelected: { backgroundColor: '#8e44ad', borderColor: '#8e44ad' },
    chipText: { fontSize: 14, fontWeight: '600', color: '#475569' },
    chipTextSelected: { color: '#5b21b6', fontWeight: '700' },
    
    generateBtn: { flexDirection: 'row', backgroundColor: '#8e44ad', paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 32, shadowColor: '#8e44ad', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 8 },
    generateBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    
    recipeList: { gap: 20 },
    recipeCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    recipeHeader: { marginBottom: 12 },
    recipeTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
    recipeDesc: { fontSize: 14, color: '#64748b', lineHeight: 22, marginBottom: 16 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    metaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 6 },
    metaText: { fontSize: 12, color: '#475569', fontWeight: '700' },
    viewRecipeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderTopWidth: 1.5, borderColor: '#f8fafc', paddingTop: 16, marginTop: 4 },
    viewRecipeText: { fontSize: 15, fontWeight: '800', color: '#8e44ad' },
    
    emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '500' }
});
