import { GoogleGenerativeAI } from "@google/generative-ai";
import { Platform } from "react-native";

/**
 * AI Service for Smart Inventory Kulkas
 * Providing intelligent predictions for item categories and shelf life.
 */

export interface PredictionResult {
    categoryKey: string;
    shelfLifeDays: number;
    confidence: number;
    reason?: string;
}

export interface RecipeSuggestion {
    id: string;
    title: string;
    description: string;
    prepTime: string;
    difficulty: string;
    calories: string;
    imageKeyword: string;
    fridgeIngredients: { name: string; amount: string }[];
    pantryStaples: string[];
    ingredients: string[];
    instructions: string[];
}

// Access the API Key from environment variables
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Predicts item details based on the item name using Real Gemini AI API.
 */
export const predictItemDetails = async (itemName: string): Promise<PredictionResult | null> => {
    if (!itemName || itemName.length < 3) return null;

    if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        console.warn("[Gemini AI] API Key is missing. Please set EXPO_PUBLIC_GEMINI_API_KEY in .env");
        if (Platform.OS === 'web') alert("API Key Gemini belum diset. Silakan isi file .env");
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      You are a smart refrigerator assistant. A user added an item named "${itemName}".
      Predict the food category and how many days it will last in a standard refrigerator.
      
      Output MUST be a valid JSON object with the following fields:
      - categoryKey: One of [sayur, buah, daging, ikan, susu, telur, bumbu, minuman, lainnya]
      - shelfLifeDays: Integer (number of days it lasts)
      - confidence: Float (e.g. 0.9)
      - reason: A short explanation in Indonesian (e.g., "Susu UHT tahan lama karena proses sterilisasi.").
      
      Respond only with JSON. Do NOT wrap with markdown blocks.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean potential markdown code blocks from response
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(text) as PredictionResult;

        return {
            categoryKey: parsed.categoryKey || 'lainnya',
            shelfLifeDays: parsed.shelfLifeDays || 7,
            confidence: parsed.confidence || 0.8,
            reason: parsed.reason || "Berdasarkan analisis AI Gemini."
        };
    } catch (error: any) {
        console.error("[Gemini AI] Error:", error);
        if (Platform.OS === 'web') {
            alert(`Gemini AI Error: ${error.message || "Gagal memproses prediksi."}`);
        }
        return {
            categoryKey: 'lainnya',
            shelfLifeDays: 7,
            confidence: 0.1,
            reason: `Gagal koneksi ke Gemini AI: ${error.message}`
        };
    }
};

/**
 * Generates recipe suggestions based on a list of ingredients.
 */
export const generateRecipes = async (ingredients: string[]): Promise<RecipeSuggestion[]> => {
    if (!ingredients || ingredients.length === 0) return [];

    if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        console.warn("[Gemini AI] API Key is missing. Cannot generate recipes.");
        return [];
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      Anda adalah koki profesional bintang lima. Saya memiliki bahan-bahan masakan berikut di kulkas saya:
      ${ingredients.join(", ")}
      
      Berikan saya tepat 3 ide resep masakan enak berbahasa Indonesia yang utama menggunakan bahan-bahan tersebut. 
      Anda diizinkan untuk menambahkan bumbu/bahan pelengkap umum lainnya (seperti garam, gula, bawang, minyak, saus, dll) yang mungkin tidak saya sebutkan, agar masakan menjadi sempurna.
      
      Output MUST be a strictly valid JSON ARRAY of objects. Each object MUST have these properties:
      - title: String (Nama masakan dalam Bahasa Indonesia)
      - description: String (1 kalimat deskripsi menarik)
      - prepTime: String (Estimasi waktu, contoh: "30 Menit")
      - difficulty: String (Easy / Medium / Hard)
      - calories: String (Estimasi kalori per porsi, contoh: "450 kcal")
      - imageKeyword: String (2-3 kata kunci dalam Bahasa Inggris untuk menggambarkan hidangan ini, contoh: "fried rice plate")
      - fridgeIngredients: Array of objects {name: String, amount: String} (bahan yang diambil dari daftar kulkas saya)
      - pantryStaples: Array of Strings (bumbu/bahan umum tambahan yang Anda sarankan, contoh: "Garam secukupnya")
      - ingredients: Array of Strings (SEMUA bahan lengkap)
      - instructions: Array of Strings (Langkah-langkah memasak yang ringkas namun jelas)
      
      Respond only with JSON ARRAY. Do NOT wrap with markdown blocks.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean potential markdown code blocks from response
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(text) as any[];

        return parsed.map((item, index) => ({
            id: `recipe-${Date.now()}-${index}`,
            title: item.title || "Resep Tanpa Nama",
            description: item.description || "",
            prepTime: item.prepTime || "-",
            difficulty: item.difficulty || "Easy",
            calories: item.calories || "-",
            imageKeyword: item.imageKeyword || "food dish",
            fridgeIngredients: item.fridgeIngredients || [],
            pantryStaples: item.pantryStaples || [],
            ingredients: item.ingredients || [],
            instructions: item.instructions || []
        }));

    } catch (error: any) {
        console.error("[Gemini AI] Error generating recipes:", error);
        return [];
    }
};

/**
 * Generates a smart sustainability tip based on user's wasted and consumed items.
 */
export const generateSustainabilityTips = async (wastedItems: string[], consumedItems: string[]): Promise<string> => {
    if (!API_KEY || API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        return "Beli bahan dalam jumlah kecil tapi sering, daripada membeli banyak sekaligus.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      Anda adalah pakar lingkungan dan food waste reduction. 
      Pengguna aplikasi Smart Fridge ini baru saja membuang bahan-bahan berikut (karena kedaluwarsa): ${wastedItems.length > 0 ? wastedItems.join(", ") : "Tidak ada!"}
      Dan mereka berhasil menghabiskan bahan-bahan berikut sebelum kedaluwarsa: ${consumedItems.length > 0 ? consumedItems.join(", ") : "Belum ada data."}
      
      Berikan TEPAT SATU kalimat tips atau motivasi (maksimal 2 kalimat singkat) dalam Bahasa Indonesia yang:
      - Sangat spesifik dan relevan dengan bahan yang mereka buang (jika ada).
      - Memberikan pujian jika mereka tidak membuang banyak barang.
      - Praktis dan bisa langsung diterapkan di dapur (misalnya cara menyimpan bahan tertentu agar lebih awet).
      
      Jangan gunakan format list, markdown, atau pembukaan/penutup doa/salam. Cukup langsung berikan tipsnya.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim().replace(/['"]/g, '');

    } catch (error: any) {
        console.error("[Gemini AI] Error generating tips:", error);
        return "Letakkan bahan baru di bagian belakang kulkas (Metode First In, First Out) agar bahan lama terpakai lebih dulu!";
    }
};
