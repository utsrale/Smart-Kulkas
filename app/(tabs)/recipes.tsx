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
            // Pisahkan item unik
            const uniqueItems = Array.from(new Set(items));
            setIngredients(uniqueItems);
        });

        return () => unsubscribe();
    }, [user]);

    const handleGenerateRecipes = async () => {
        if (ingredients.length === 0) {
            Alert.alert("Kulkas Kosong", "Tambahkan bahan makanan ke kulkas terlebih dahulu agar AI bisa memberikan ide resep!");
            return;
        }

        setIsLoading(true);
        try {
            const results = await generateRecipes(ingredients);
            setRecipes(results);
        } catch (error) {
            Alert.alert("Error", "Gagal mendapatkan resep dari Gemini AI.");
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
                <Text style={styles.headerTitle}>AI Recipes 👨‍🍳</Text>
                <Text style={styles.headerSubtitle}>
                    {ingredients.length > 0
                        ? `${ingredients.length} bahan tersedia di kulkas Anda`
                        : "Kulkas Anda kosong"}
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Available Ingredients Preview */}
                {ingredients.length > 0 && (
                    <View style={styles.ingredientsPillContainer}>
                        {ingredients.slice(0, 5).map((ing, idx) => (
                            <View key={idx} style={styles.ingredientPill}>
                                <Text style={styles.ingredientText}>{ing}</Text>
                            </View>
                        ))}
                        {ingredients.length > 5 && (
                            <View style={styles.ingredientPill}>
                                <Text style={styles.ingredientText}>+{ingredients.length - 5} lainnya</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Generate Button */}
                <TouchableOpacity
                    style={[styles.generateBtn, isLoading && { opacity: 0.7 }]}
                    onPress={handleGenerateRecipes}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.generateBtnText}>Meracik Resep...</Text>
                        </>
                    ) : (
                        <>
                            <IconSymbol name="sparkles" size={20} color="#fff" />
                            <Text style={styles.generateBtnText}>Buat Resep dengan Gemini AI</Text>
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
                            activeOpacity={0.8}
                        >
                            <View style={styles.recipeHeader}>
                                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                                <Text style={styles.recipeDesc}>{recipe.description}</Text>
                                <View style={styles.metaRow}>
                                    <View style={styles.timeBadge}>
                                        <IconSymbol name="clock.fill" size={12} color="#f39c12" />
                                        <Text style={styles.timeText}>{recipe.prepTime}</Text>
                                    </View>
                                    <View style={[styles.timeBadge, { backgroundColor: '#fef3c7' }]}>
                                        <Text style={[styles.timeText, { color: '#e67e22' }]}>🔥 {recipe.difficulty}</Text>
                                    </View>
                                    <View style={styles.timeBadge}>
                                        <Text style={styles.timeText}>⚡ {recipe.calories}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.viewRecipeBtn}>
                                <Text style={styles.viewRecipeText}>Lihat Resep Lengkap</Text>
                                <IconSymbol name="chevron.right" size={16} color="#8e44ad" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {recipes.length === 0 && !isLoading && ingredients.length > 0 && (
                    <View style={styles.emptyState}>
                        <IconSymbol name="book.fill" size={48} color="#e2e8f0" />
                        <Text style={styles.emptyText}>Tekan tombol di atas untuk melihat sihir terjadi!</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f6f8f7' },
    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
    headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    content: { padding: 20, paddingBottom: 100 },
    ingredientsPillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    ingredientPill: { backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    ingredientText: { fontSize: 12, color: '#475569', fontWeight: '500' },
    generateBtn: { flexDirection: 'row', backgroundColor: '#8e44ad', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#8e44ad', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
    recipeList: { gap: 16 },
    recipeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    recipeHeader: { marginBottom: 8 },
    recipeTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
    recipeDesc: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 12 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    timeText: { fontSize: 12, color: '#475569', fontWeight: '600', marginLeft: 4 },
    viewRecipeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 14, marginTop: 8 },
    viewRecipeText: { fontSize: 14, fontWeight: '700', color: '#8e44ad' },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14, textAlign: 'center' }
});
