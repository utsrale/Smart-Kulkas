import { GoogleGenerativeAI } from "@google/generative-ai";

import i18n, { getAiLanguageName } from "@/src/i18n";

/**
 * AI Service for Smart Inventory Kulkas
 * Primary: Gemini AI (Google) — Free tier
 * Backup:  OpenRouter (nvidia/nemotron-nano-9b-v2:free)
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

// ─── API Keys ───────────────────────────────────────────────
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// ─── OpenRouter Fallback Helper ─────────────────────────────
/**
 * Calls OpenRouter as a fallback when Gemini is exhausted or fails.
 * Uses nvidia/nemotron-nano-9b-v2:free (tested & confirmed working).
 */
const callOpenRouter = async (prompt: string, systemPrompt?: string): Promise<string> => {
    const messages: { role: string; content: string }[] = [];
    if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "nvidia/nemotron-nano-9b-v2:free",
            "messages": messages
        })
    });

    if (!response.ok) {
        const errBody = await response.text();
        console.error("[OpenRouter] ❌ API Error:", response.status, errBody);
        throw new Error(`OpenRouter Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || "";
    // Clean potential markdown code blocks
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return text;
};

/**
 * Robust JSON extractor — finds the first valid JSON object or array
 * from a messy AI response that might contain extra conversational text.
 */
const extractJSON = (text: string): string => {
    // First, clean markdown code blocks
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    // Remove illegal control characters (keep newline, carriage return, tab)
    text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");

    // Try direct parse first
    try {
        JSON.parse(text);
        return text;
    } catch {}

    // Find the first [ or { and extract the matching block
    const startArray = text.indexOf('[');
    const startObject = text.indexOf('{');
    
    let startIdx = -1;
    let openChar = '';
    let closeChar = '';

    if (startArray === -1 && startObject === -1) return text;
    if (startArray === -1) { startIdx = startObject; openChar = '{'; closeChar = '}'; }
    else if (startObject === -1) { startIdx = startArray; openChar = '['; closeChar = ']'; }
    else if (startArray < startObject) { startIdx = startArray; openChar = '['; closeChar = ']'; }
    else { startIdx = startObject; openChar = '{'; closeChar = '}'; }

    // Bracket-match to find the end
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = startIdx; i < text.length; i++) {
        const ch = text[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === openChar) depth++;
        if (ch === closeChar) depth--;
        if (depth === 0) {
            const extracted = text.substring(startIdx, i + 1);
            try {
                JSON.parse(extracted);
                return extracted;
            } catch {}
            break;
        }
    }

    // Last resort: try substring from first [ to last ] (or { to })
    const lastClose = text.lastIndexOf(closeChar);
    if (startIdx >= 0 && lastClose > startIdx) {
        const crude = text.substring(startIdx, lastClose + 1);
        try {
            JSON.parse(crude);
            return crude;
        } catch {}
    }

    return text;
};

// ─── 1. Predict Item Details ────────────────────────────────
/**
 * Predicts item category & shelf life. Tries Gemini first, then OpenRouter.
 */
export const predictItemDetails = async (itemName: string): Promise<PredictionResult | null> => {
    if (!itemName || itemName.length < 3) return null;

    const systemPrompt = "You are a smart refrigerator assistant. Output ONLY valid JSON without any additional text or markdown.";
    const prompt = `
A user added an item named "${itemName}".
Predict the food category and how many days it will last in a standard refrigerator.

Output MUST be a valid JSON object with the following fields:
- categoryKey: One of [sayur, buah, daging, ikan, susu, telur, bumbu, minuman, lainnya]
- shelfLifeDays: Integer (number of days it lasts)
- confidence: Float (e.g. 0.9)
- reason: A short explanation in ${getAiLanguageName()} (e.g., "UHT milk lasts longer due to the sterilization process.").

Respond only with JSON. Do NOT wrap with markdown blocks.
`;

    // --- Try Gemini first ---
    if (API_KEY && API_KEY !== "YOUR_GEMINI_API_KEY_HERE") {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();
            text = extractJSON(text);
            const parsed = JSON.parse(text) as PredictionResult;
            return {
                categoryKey: parsed.categoryKey || 'lainnya',
                shelfLifeDays: parsed.shelfLifeDays || 7,
                confidence: parsed.confidence || 0.8,
                reason: parsed.reason || i18n.t('ai.predictReason')
            };
        } catch (geminiError: any) {
            console.warn("[Gemini] ⚠️ Failed:", geminiError.message?.substring(0, 100));
            // Fall through to OpenRouter backup below
        }
    }

    // --- Fallback: OpenRouter ---
    try {
        const text = await callOpenRouter(prompt, systemPrompt);
        const cleanedText = extractJSON(text);
        const parsed = JSON.parse(cleanedText) as PredictionResult;
        return {
            categoryKey: parsed.categoryKey || 'lainnya',
            shelfLifeDays: parsed.shelfLifeDays || 7,
            confidence: parsed.confidence || 0.8,
            reason: parsed.reason || i18n.t('ai.predictReasonBackup')
        };
    } catch (fallbackError: any) {
        console.error("[OpenRouter] ❌ Backup also failed:", fallbackError.message);
        return {
            categoryKey: 'lainnya',
            shelfLifeDays: 7,
            confidence: 0.1,
            reason: i18n.t('ai.predictUnavailable')
        };
    }
};

// ─── 2. Generate Recipes ────────────────────────────────────
/**
 * Generates recipe suggestions. Tries Gemini first, then OpenRouter.
 */
export const generateRecipes = async (ingredients: string[]): Promise<RecipeSuggestion[]> => {
    if (!ingredients || ingredients.length === 0) return [];

    const systemPrompt = "You are a five-star professional chef. You only respond using a valid JSON array without markdown blocks.";
    const prompt = `
You are a five-star professional chef. I have the following cooking ingredients in my fridge:
${ingredients.join(", ")}

Give me exactly 3 delicious recipe ideas in ${getAiLanguageName()} that primarily use these ingredients. 
You are allowed to add other common spices/complementary ingredients (like salt, sugar, onion, oil, sauce, etc.) that I might not have mentioned, to make the dish perfect.

Output MUST be a strictly valid JSON ARRAY of objects. Each object MUST have these properties:
- title: String (Name of the dish in ${getAiLanguageName()})
- description: String (1 engaging descriptive sentence in ${getAiLanguageName()})
- prepTime: String (Estimated time, e.g. "30 Minutes")
- difficulty: String (Easy / Medium / Hard)
- calories: String (Estimated calories per serving, e.g. "450 kcal")
- imageKeyword: String (2-3 keywords in ${getAiLanguageName()} to describe this dish, e.g. "fried rice plate")
- fridgeIngredients: Array of objects {name: String, amount: String} (ingredients taken from my fridge list in ${getAiLanguageName()})
- pantryStaples: Array of Strings (additional common spices/ingredients you suggest in ${getAiLanguageName()}, e.g. "Salt to taste")
- ingredients: Array of Strings (ALL complete ingredients in ${getAiLanguageName()})
- instructions: Array of Strings (Concise but clear cooking steps in ${getAiLanguageName()})

Respond only with JSON ARRAY. Do NOT wrap with markdown blocks.
`;

    const parseRecipes = (text: string, prefix: string): RecipeSuggestion[] => {
        const cleaned = extractJSON(text);
        const parsed = JSON.parse(cleaned) as any[];
        return parsed.map((item, index) => ({
            id: `${prefix}-${Date.now()}-${index}`,
            title: item.title || i18n.t('ai.untitledRecipe'),
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
    };

    // --- Try Gemini first ---
    if (API_KEY && API_KEY !== "YOUR_GEMINI_API_KEY_HERE") {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();
            text = extractJSON(text);
            return parseRecipes(text, "recipe");
        } catch (geminiError: any) {
            console.warn("[Gemini] ⚠️ Failed:", geminiError.message?.substring(0, 100));
            // Fall through to OpenRouter backup below
        }
    }

    // --- Fallback: OpenRouter ---
    try {
        const text = await callOpenRouter(prompt, systemPrompt);
        return parseRecipes(text, "recipe-backup");
    } catch (fallbackError: any) {
        console.error("[OpenRouter] ❌ Backup also failed:", fallbackError.message);
        throw new Error(i18n.t('ai.errorRecipes'));
    }
};

// ─── 3. Sustainability Tips ─────────────────────────────────
/**
 * Generates a smart sustainability tip. Tries Gemini first, then OpenRouter.
 */
export const generateSustainabilityTips = async (wastedItems: string[], consumedItems: string[]): Promise<string> => {
    const systemPrompt = `You are a reliable environment and food waste reduction expert. Give a short and practical tip in ${getAiLanguageName()}.`;
    const prompt = `
This Smart Fridge app user just wasted the following ingredients (due to expiration): ${wastedItems.length > 0 ? wastedItems.join(", ") : "None!"}
And they managed to consume the following ingredients before expiring: ${consumedItems.length > 0 ? consumedItems.join(", ") : "No data yet."}

Give EXACTLY ONE sentence of tip or motivation (maximum 2 short sentences) in ${getAiLanguageName()} that:
- Is very specific and relevant to the ingredients they wasted (if any).
- Gives praise if they didn't waste many items.
- Is practical and can be directly applied in the kitchen (e.g. how to store certain ingredients to last longer).

Do not use list formatting, markdown, or opening/closing greetings. Just directly give the tip.
`;

    const defaultTip = i18n.t('ai.defaultTip');

    // --- Try Gemini first ---
    if (API_KEY && API_KEY !== "YOUR_GEMINI_API_KEY_HERE") {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim().replace(/['"]/g, '');
        } catch (geminiError: any) {
            console.warn("[Gemini] ⚠️ Tips failed:", geminiError.message?.substring(0, 100));
            // Fall through to OpenRouter backup below
        }
    }

    // --- Fallback: OpenRouter ---
    try {
        const text = await callOpenRouter(prompt, systemPrompt);
        return text.replace(/['"]/g, '');
    } catch (fallbackError: any) {
        console.error("[OpenRouter] ❌ Tips backup also failed:", fallbackError.message);
        return defaultTip;
    }
};
