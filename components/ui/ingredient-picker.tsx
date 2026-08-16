import { CATEGORY_KEYS, CATEGORIES } from '@/src/utils/categoryDefaults';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { IconSymbol } from './icon-symbol';

export interface PickerItem {
    name: string;
    category: string; // kategori key (sayur, buah, ...)
    daysLeft: number; // sisa hari sebelum kedaluwarsa
}

interface IngredientPickerProps {
    visible: boolean;
    items: PickerItem[];
    selected: string[]; // nama bahan yang terpilih
    onToggle: (name: string) => void;
    onSelectAll: () => void;
    onClear: () => void;
    onGenerate: () => void;
    onClose: () => void;
}

/**
 * Bottom-sheet picker untuk memilih bahan masak.
 * Muncul dari bawah layar, dikelompokkan per kategori, dengan pencarian.
 */
export function IngredientPicker({
    visible,
    items,
    selected,
    onToggle,
    onSelectAll,
    onClear,
    onGenerate,
    onClose,
}: IngredientPickerProps) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((it) => it.name.toLowerCase().includes(q));
    }, [items, query]);

    // Kelompokkan per kategori, urut sesuai CATEGORY_KEYS
    const groups = useMemo(() => {
        const byKey = new Map<string, PickerItem[]>();
        for (const it of filtered) {
            const list = byKey.get(it.category) ?? [];
            list.push(it);
            byKey.set(it.category, list);
        }
        return CATEGORY_KEYS
            .filter((key) => byKey.has(key))
            .map((key) => ({ key, list: byKey.get(key)! }));
    }, [filtered]);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />

                <View style={styles.sheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>{t('recipes.selectTitle')}</Text>
                            <Text style={styles.subtitle}>{t('recipes.pickerSubtitle')}</Text>
                        </View>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{selected.length}/{items.length}</Text>
                        </View>
                    </View>

                    {/* Search */}
                    <View style={styles.searchWrap}>
                        <IconSymbol name="magnifyingglass" size={18} color="#94a3b8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('recipes.searchPlaceholder')}
                            placeholderTextColor="#94a3b8"
                            value={query}
                            onChangeText={setQuery}
                            autoCorrect={false}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <IconSymbol name="xmark" size={18} color="#94a3b8" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Select All / Clear */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity onPress={onSelectAll} hitSlop={{ top: 8, bottom: 8 }}>
                            <Text style={styles.actionText}>{t('recipes.selectAll')}</Text>
                        </TouchableOpacity>
                        <View style={styles.actionDivider} />
                        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8 }}>
                            <Text style={styles.actionText}>{t('recipes.clear')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Grouped list */}
                    <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
                        {groups.length === 0 ? (
                            <Text style={styles.noResult}>{t('recipes.searchEmpty')}</Text>
                        ) : (
                            groups.map((group) => (
                                <View key={group.key} style={styles.group}>
                                    <View style={styles.groupHeader}>
                                        <Text style={styles.groupIcon}>{CATEGORIES[group.key]?.icon ?? '📦'}</Text>
                                        <Text style={styles.groupTitle}>
                                            {t(`category.${group.key}`).toUpperCase()}
                                        </Text>
                                        <Text style={styles.groupCount}>{group.list.length}</Text>
                                    </View>
                                    {group.list.map((item) => {
                                        const isSelected = selected.includes(item.name);
                                        return (
                                            <TouchableOpacity
                                                key={item.name}
                                                style={styles.row}
                                                onPress={() => onToggle(item.name)}
                                                activeOpacity={0.7}
                                            >
                                                <IconSymbol
                                                    name={isSelected ? 'checkmark.circle.fill' : 'checkmark.circle'}
                                                    size={22}
                                                    color={isSelected ? '#13ec6d' : '#cbd5e1'}
                                                />
                                                <Text style={[styles.rowName, isSelected && styles.rowNameSelected]}>
                                                    {item.name}
                                                </Text>
                                                <Text style={styles.rowDays}>
                                                    {item.daysLeft <= 0
                                                        ? t('fridge.expired')
                                                        : t('fridge.daysLeft', { count: item.daysLeft })}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ))
                        )}
                        <View style={{ height: 12 }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.generateBtn, selected.length === 0 && styles.generateBtnDisabled]}
                            onPress={onGenerate}
                            disabled={selected.length === 0}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.generateText}>
                                {t('recipes.generateShort', { count: selected.length })}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 20,
        maxHeight: '78%',
        boxShadow: '0 -8px 24px rgba(15, 23, 42, 0.12)',
        elevation: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    headerText: { flex: 1, paddingRight: 12 },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
        lineHeight: 18,
    },
    countBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        minWidth: 44,
        alignItems: 'center',
    },
    countText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#16a34a',
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#0f172a',
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8e44ad',
    },
    actionDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#e2e8f0',
    },
    list: {
        flexGrow: 0,
    },
    group: {
        marginBottom: 6,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
    },
    groupIcon: { fontSize: 16 },
    groupTitle: {
        flex: 1,
        fontSize: 12,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1,
    },
    groupCount: {
        fontSize: 12,
        fontWeight: '700',
        color: '#cbd5e1',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    rowName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
    },
    rowNameSelected: {
        color: '#5b21b6',
    },
    rowDays: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
    },
    noResult: {
        paddingVertical: 24,
        textAlign: 'center',
        fontSize: 14,
        color: '#94a3b8',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 14,
        paddingBottom: 24,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 14,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748b',
    },
    generateBtn: {
        flex: 1.6,
        paddingVertical: 15,
        borderRadius: 14,
        backgroundColor: '#13ec6d',
        alignItems: 'center',
    },
    generateBtnDisabled: {
        opacity: 0.45,
    },
    generateText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
    },
});
