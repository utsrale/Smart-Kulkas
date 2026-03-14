// Prediksi masa simpan default berdasarkan kategori (dalam hari).
// Digunakan sebagai saran otomatis tanggal kedaluwarsa saat user memilih kategori.

export interface CategoryInfo {
    label: string;
    defaultShelfLifeDays: number;
    icon: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
    sayur: {
        label: 'Sayuran',
        defaultShelfLifeDays: 4,
        icon: '🥬',
    },
    buah: {
        label: 'Buah-buahan',
        defaultShelfLifeDays: 5,
        icon: '🍎',
    },
    daging: {
        label: 'Daging',
        defaultShelfLifeDays: 3,
        icon: '🥩',
    },
    ikan: {
        label: 'Ikan & Seafood',
        defaultShelfLifeDays: 2,
        icon: '🐟',
    },
    susu: {
        label: 'Susu & Dairy',
        defaultShelfLifeDays: 7,
        icon: '🥛',
    },
    telur: {
        label: 'Telur',
        defaultShelfLifeDays: 14,
        icon: '🥚',
    },
    bumbu: {
        label: 'Bumbu & Rempah',
        defaultShelfLifeDays: 30,
        icon: '🧄',
    },
    minuman: {
        label: 'Minuman',
        defaultShelfLifeDays: 14,
        icon: '🧃',
    },
    lainnya: {
        label: 'Lainnya',
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
