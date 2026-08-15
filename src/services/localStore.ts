import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// Penyimpanan lokal (tanpa login, tanpa Firebase).
// Semua data aplikasi disimpan di AsyncStorage sebagai JSON.
// Tanggal disimpan sebagai ISO string di storage, dan di-hydrate
// menjadi objek Date saat dibaca agar mudah dipakai di UI.
// ============================================================

export interface InventoryItem {
    id: string;
    itemName: string;
    category: string;
    quantity: string;
    addedDate: Date;
    expiredDate: Date;
    status: 'active' | 'used';
}

// Bentuk serialized (apa yang benar-benar disimpan di disk)
interface StoredInventoryItem {
    id: string;
    itemName: string;
    category: string;
    quantity: string;
    addedDate: string; // ISO
    expiredDate: string; // ISO
    status: 'active' | 'used';
}

export interface ShopItem {
    id: string;
    text: string;
    subtitle?: string;
    amount?: string;
    checked: boolean;
    section: 'suggestion' | 'recipe' | 'fridge' | 'personal';
}

export interface Profile {
    name: string;
}

export interface BackupData {
    version: number;
    exportedAt: string;
    inventory: StoredInventoryItem[];
    shopping: ShopItem[];
    profile: Profile;
}

const KEYS = {
    inventory: '@smartkulkas/inventory/v1',
    shopping: '@smartkulkas/shopping/v1',
    profile: '@smartkulkas/profile/v1',
};

const BACKUP_VERSION = 1;

const generateId = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

async function readJSON<T>(key: string, fallback: T): Promise<T> {
    try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch (error) {
        console.error(`localStore: gagal membaca ${key}`, error);
        return fallback;
    }
}

async function writeJSON(key: string, value: unknown): Promise<void> {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`localStore: gagal menulis ${key}`, error);
        throw error;
    }
}

const hydrateItem = (stored: StoredInventoryItem): InventoryItem => ({
    ...stored,
    addedDate: new Date(stored.addedDate),
    expiredDate: new Date(stored.expiredDate),
});

const serializeItem = (item: InventoryItem): StoredInventoryItem => ({
    id: item.id,
    itemName: item.itemName,
    category: item.category,
    quantity: item.quantity,
    addedDate: item.addedDate.toISOString(),
    expiredDate: item.expiredDate.toISOString(),
    status: item.status,
});

// ---------------- Inventory ----------------

export async function getInventoryItems(): Promise<InventoryItem[]> {
    const items = await readJSON<StoredInventoryItem[]>(KEYS.inventory, []);
    return items
        .filter((it) => it && it.id && it.expiredDate)
        .map(hydrateItem)
        .sort((a, b) => a.expiredDate.getTime() - b.expiredDate.getTime());
}

export interface NewInventoryItem {
    itemName: string;
    category: string;
    quantity: string;
    expiredDate: Date;
}

export async function addInventoryItem(input: NewInventoryItem): Promise<InventoryItem> {
    const items = await readJSON<StoredInventoryItem[]>(KEYS.inventory, []);
    const item: InventoryItem = {
        id: generateId(),
        itemName: input.itemName,
        category: input.category,
        quantity: input.quantity || '1',
        addedDate: new Date(),
        expiredDate: input.expiredDate,
        status: 'active',
    };
    items.push(serializeItem(item));
    await writeJSON(KEYS.inventory, items);
    return item;
}

export async function updateInventoryItem(
    id: string,
    patch: Partial<Pick<InventoryItem, 'status' | 'itemName' | 'category' | 'quantity' | 'expiredDate'>>
): Promise<void> {
    const items = await readJSON<StoredInventoryItem[]>(KEYS.inventory, []);
    const index = items.findIndex((it) => it.id === id);
    if (index === -1) return;
    const current = hydrateItem(items[index]);
    const next: InventoryItem = {
        ...current,
        ...patch,
        expiredDate: patch.expiredDate ?? current.expiredDate,
    };
    items[index] = serializeItem(next);
    await writeJSON(KEYS.inventory, items);
}

export async function deleteInventoryItem(id: string): Promise<void> {
    const items = await readJSON<StoredInventoryItem[]>(KEYS.inventory, []);
    await writeJSON(KEYS.inventory, items.filter((it) => it.id !== id));
}

// ---------------- Shopping list ----------------

export async function getShoppingList(): Promise<ShopItem[]> {
    return readJSON<ShopItem[]>(KEYS.shopping, []);
}

export async function saveShoppingList(items: ShopItem[]): Promise<void> {
    await writeJSON(KEYS.shopping, items);
}

// ---------------- Profile ----------------

export async function getProfile(): Promise<Profile> {
    return readJSON<Profile>(KEYS.profile, { name: '' });
}

export async function setProfileName(name: string): Promise<void> {
    await writeJSON(KEYS.profile, { name });
}

// ---------------- Backup (export/import/clear) ----------------

export async function exportAllData(): Promise<string> {
    const [inventory, shopping, profile] = await Promise.all([
        readJSON<StoredInventoryItem[]>(KEYS.inventory, []),
        readJSON<ShopItem[]>(KEYS.shopping, []),
        readJSON<Profile>(KEYS.profile, { name: '' }),
    ]);

    const backup: BackupData = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        inventory,
        shopping,
        profile,
    };
    return JSON.stringify(backup, null, 2);
}

export async function importAllData(json: string): Promise<void> {
    const parsed = JSON.parse(json) as Partial<BackupData>;
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Format file backup tidak valid.');
    }
    if (parsed.inventory && Array.isArray(parsed.inventory)) {
        await writeJSON(KEYS.inventory, parsed.inventory);
    }
    if (parsed.shopping && Array.isArray(parsed.shopping)) {
        await writeJSON(KEYS.shopping, parsed.shopping);
    }
    if (parsed.profile && typeof parsed.profile === 'object') {
        await writeJSON(KEYS.profile, parsed.profile);
    }
}

export async function clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.inventory, KEYS.shopping, KEYS.profile]);
}
