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

// Peta label lama (yang pernah tersimpan di data sebelum migrasi ke key) → key.
// Mencakup label Inggris (era sekarang) dan label Indonesia (era lama).
const LABEL_TO_KEY: Record<string, string> = {
    // Label Inggris (dari CATEGORIES[].label)
    'vegetables': 'sayur',
    'fruits': 'buah',
    'meat': 'daging',
    'seafood': 'ikan',
    'dairy': 'susu',
    'eggs': 'telur',
    'spices': 'bumbu',
    'beverages': 'minuman',
    'others': 'lainnya',
    // Label Indonesia (data lama, sebelum i18n)
    'sayuran': 'sayur',
    'buah-buahan': 'buah',
    'buah': 'buah',
    'daging/ayam': 'daging',
    'daging': 'daging',
    'ikan/seafood': 'ikan',
    'ikan': 'ikan',
    'susu': 'susu',
    'susu/olahan': 'susu',
    'telur': 'telur',
    'bumbu': 'bumbu',
    'bumbu & rempah': 'bumbu',
    'minuman': 'minuman',
    'makanan jadi': 'lainnya',
    'lainnya': 'lainnya',
};

/**
 * Normalisasi nilai kategori apa pun (key, label Inggris, atau label Indonesia
 * dari data lama) menjadi key kategori yang valid. Nilai tak dikenal → 'lainnya'.
 */
export const normalizeCategoryKey = (value: string | null | undefined): string => {
    if (!value) return 'lainnya';
    const normalized = value.trim().toLowerCase();
    if (CATEGORIES[normalized]) return normalized; // sudah berupa key
    return LABEL_TO_KEY[normalized] || 'lainnya';
};

export const getDefaultExpDate = (categoryKey: string): Date => {
    const days = CATEGORIES[categoryKey]?.defaultShelfLifeDays ?? 7;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};
