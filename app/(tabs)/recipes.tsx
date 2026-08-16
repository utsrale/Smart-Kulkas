import { IconSymbol } from '@/components/ui/icon-symbol';
import { IngredientPicker, PickerItem } from '@/components/ui/ingredient-picker';
import { showToast } from '@/components/ui/toast';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getInventoryItems } from '../../src/services/localStore';
import { generateRecipes, RecipeSuggestion } from '../../src/services/aiService';

export default function RecipesScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const [ingredientItems, setIngredientItems] = useState<PickerItem[]>([]);
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadIngredients = useCallback(async () => {
        try {
            const inventory = await getInventoryItems();
            const now = new Date();

            // Ambil bahan aktif, unik per nama (pertahankan item pertama)
            const unique = new Map<string, PickerItem>();
            inventory
                .filter(item => item.status === 'active')
                .forEach(item => {
                    if (unique.has(item.itemName)) return;
                    const diffMs = item.expiredDate.getTime() - now.getTime();
                    unique.set(item.itemName, {
                        name: item.itemName,
                        category: item.category,
                        daysLeft: Math.ceil(diffMs / (1000 * 60 * 60 * 24)),
                    });
                });

            const items = Array.from(unique.values());
            setIngredientItems(items);
        } catch (error) {
            console.error('Gagal memuat bahan:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadIngredients();
        }, [loadIngredients])
    );

    const toggleIngredient = (name: string) => {
        setSelectedIngredients(prev =>
            prev.includes(name)
                ? prev.filter(i => i !== name)
                : [...prev, name]
        );
    };

    const handleSelectAll = () => {
        setSelectedIngredients(ingredientItems.map(it => it.name));
    };

    const handleClearAll = () => {
        setSelectedIngredients([]);
    };

    const handleGenerateRecipes = async () => {
        setPickerVisible(false);

        if (selectedIngredients.length === 0) {
            showToast('error', t('recipes.alertMessage'));
            return;
        }

        setIsLoading(true);
        setRecipes([]); // Reset current list
        try {
            const results = await generateRecipes(selectedIngredients);
            setRecipes(results);
        } catch (error: any) {
            showToast('error', error.message || t('recipes.errorMessage'));
        } finally {
            setIsLoading(false);
        }
    };

    const openRecipeDetail = (recipe: RecipeSuggestion) => {
        router.push({ pathname: '/recipe-detail', params: { recipe: JSON.stringify(recipe) } });
    };

    // Subtitle kartu masuk: netral bila belum ada pilihan / semua terpilih,
    // tampilkan jumlah terpilih hanya saat sebagian (1..total-1)
    const noneOrAll = selectedIngredients.length === 0 || selectedIngredients.length === ingredientItems.length;
    const entrySubtitle = ingredientItems.length === 0
        ? t('recipes.subtitleEmpty')
        : noneOrAll
            ? t('recipes.pickerEntrySubtitle', { count: ingredientItems.length })
            : t('recipes.selectedCount', { count: selectedIngredients.length, total: ingredientItems.length });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>{t('recipes.title')}</Text>
                    <IconSymbol name="sparkles" size={24} color="#8e44ad" />
                </View>
                <Text style={styles.headerSubtitle}>
                    {ingredientItems.length > 0
                        ? t('recipes.subtitleCount', { count: ingredientItems.length })
                        : t('recipes.subtitleEmpty')}
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Satu-satunya pintu: pilih bahan (membuka sheet) */}
                {isLoading ? (
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color="#8e44ad" />
                        <Text style={styles.loadingText}>{t('recipes.generating')}</Text>
                    </View>
                ) : ingredientItems.length > 0 && (
                    <TouchableOpacity
                        style={styles.entryCard}
                        onPress={() => setPickerVisible(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.entryIcon}>
                            <IconSymbol name="refrigerator" size={22} color="#8e44ad" />
                        </View>
                        <View style={styles.entryTextWrap}>
                            <Text style={styles.entryTitle}>{t('recipes.chooseIngredients')}</Text>
                            <Text style={styles.entrySubtitle}>{entrySubtitle}</Text>
                        </View>
                        <IconSymbol name="chevron.right" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                )}

                {ingredientItems.length === 0 && (
                    <View style={styles.emptyIngredients}>
                        <View style={styles.emptyIconCircle}>
                            <IconSymbol name="refrigerator" size={40} color="#cbd5e1" />
                        </View>
                        <Text style={styles.emptyText}>{t('recipes.subtitleEmpty')}</Text>
                    </View>
                )}

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
                                        <Text style={[styles.metaText, { color: '#92400e' }]}>{t('recipes.difficulty', { difficulty: recipe.difficulty })}</Text>
                                    </View>
                                    <View style={styles.metaBadge}>
                                        <Text style={styles.metaText}>🔥 {recipe.calories}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.viewRecipeBtn}>
                                <Text style={styles.viewRecipeText}>{t('recipes.openDetails')}</Text>
                                <IconSymbol name="chevron.right" size={16} color="#8e44ad" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {recipes.length === 0 && !isLoading && (
                    <Text style={styles.hintText}>
                        {ingredientItems.length > 0 ? t('recipes.empty') : t('recipes.subtitleEmpty')}
                    </Text>
                )}
            </ScrollView>

            {/* Bottom-sheet picker bahan */}
            <IngredientPicker
                visible={pickerVisible}
                items={ingredientItems}
                selected={selectedIngredients}
                onToggle={toggleIngredient}
                onSelectAll={handleSelectAll}
                onClear={handleClearAll}
                onGenerate={handleGenerateRecipes}
                onClose={() => setPickerVisible(false)}
            />
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

    entryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1.5,
        borderColor: '#ede9fe',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
        elevation: 3,
    },
    entryIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f5f3ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    entryTextWrap: { flex: 1 },
    entryTitle: { fontSize: 17, fontWeight: '800', color: '#5b21b6' },
    entrySubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 3 },

    emptyIngredients: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '500' },

    recipeList: { gap: 20, marginTop: 28 },
    recipeCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.06)', elevation: 3 },
    recipeHeader: { marginBottom: 12 },
    recipeTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
    recipeDesc: { fontSize: 14, color: '#64748b', lineHeight: 22, marginBottom: 16 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    metaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 6 },
    metaText: { fontSize: 12, color: '#475569', fontWeight: '700' },
    viewRecipeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderTopWidth: 1.5, borderColor: '#f8fafc', paddingTop: 16, marginTop: 4 },
    viewRecipeText: { fontSize: 15, fontWeight: '800', color: '#8e44ad' },

    hintText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 28, paddingHorizontal: 16 },

    loadingCard: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 40,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
        elevation: 2,
    },
    loadingText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#64748b',
        marginTop: 16,
    },
});
