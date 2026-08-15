// Prediksi masa simpan default berdasarkan kategori (dalam hari).
// Digunakan sebagai saran otomatis tanggal kedaluwarsa saat user memilih kategori.

export interface CategoryInfo {
    label: string;
    defaultShelfLifeDays: number;
    icon: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
    sayur: {
        label: 'Vegetables',
        defaultShelfLifeDays: 4,
        icon: '🥬',
    },
    buah: {
        label: 'Fruits',
        defaultShelfLifeDays: 5,
        icon: '🍎',
    },
    daging: {
        label: 'Meat',
        defaultShelfLifeDays: 3,
        icon: '🥩',
    },
    ikan: {
        label: 'Seafood',
        defaultShelfLifeDays: 2,
        icon: '🐟',
    },
    susu: {
        label: 'Dairy',
        defaultShelfLifeDays: 7,
        icon: '🥛',
    },
    telur: {
        label: 'Eggs',
        defaultShelfLifeDays: 14,
        icon: '🥚',
    },
    bumbu: {
        label: 'Spices',
        defaultShelfLifeDays: 30,
        icon: '🧄',
    },
    minuman: {
        label: 'Beverages',
        defaultShelfLifeDays: 14,
        icon: '🧃',
    },
    lainnya: {
        label: 'Others',
        defaultShelfLifeDays: 7,
        icon: '📦',
    },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

export const getDefaultExpDate = (categoryKey: string): Date => {
    const days = CATEGORIES[categoryKey]?.defaultShelfLifeDays ?? 7;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};
