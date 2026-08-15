# Smart Kulkas (Smart Fridge/Inventory Manager)

Smart Kulkas is a modern, cross-platform React Native (Expo) application designed to help users track their refrigerator inventory, reduce food waste, and generate creative recipes using AI based on the ingredients they already have.

The app is **fully local-first**: your data lives in your device's storage (AsyncStorage), with no account or backend required. AI features (category prediction, recipe suggestions, waste-reduction tips) are powered by **Google Gemini**, with an **OpenRouter** fallback.

---

## 🌟 Key Features

*   **Smart Inventory Tracking:** Add, edit, and organize grocery items by categories (Vegetables, Fruits, Meat, Dairy, etc.).
*   **AI Auto-Prediction:** Automatically predicts category and shelf-life logic when adding a generic item name using AI.
*   **Expiration Alerts:** Get notified visually for items nearing their expiry dates or have already expired.
*   **AI Recipe Maker:** Select available ingredients from your fridge to dynamically generate recipe ideas, complete with cooking instructions and preparation time.
*   **Sustainability Report & Analytics:** Visualize your ecological impact by comparing consumed vs. wasted (expired) food items, accompanied by AI-generated smart tips.
*   **Smart Shopping List:** Seamlessly transfer low-stock or newly requested items into a checklist, and mark them as bought to auto-replenish the inventory.

---

## 🚀 Getting Started

### Prerequisites
1.  **Node.js** (v18 or higher)
2.  **npm**, **Yarn**, or **Bun** package manager
3.  **Expo CLI** (Install globally via `npm install -g expo-cli`)

### Installation Steps

1.  **Clone the Repository** and navigate into the folder:
    ```bash
    cd smart-kulkas
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Setup Environment Variables**:
    *   Copy `.env.example` to `.env` in the root directory (`.env` is gitignored — never commit it).
    *   Fill in your AI keys (see [AI Integration](#ai-integration-gemini--openrouter) below).
    ```env
    # Required — Google Gemini API key (get one at https://aistudio.google.com/apikey)
    EXPO_PUBLIC_GEMINI_API_KEY=

    # Optional — OpenRouter fallback key (get one at https://openrouter.ai/keys)
    EXPO_PUBLIC_OPENROUTER_API_KEY=
    ```

### Running the App

Start the Expo development server:

```bash
npx expo start
```

*   **iOS**: Press `i` to run on an iOS simulator.
*   **Android**: Press `a` to run on an Android emulator.
*   **Web**: Press `w` to run directly in your browser.

---

## 🧠 AI Integration (Gemini + OpenRouter)

AI features (category prediction, recipe suggestions, waste-reduction tips) need an API key. Without a key the app still works — those features just show a friendly fallback.

1.  **Required — Google Gemini** (primary):
    *   Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey).
    *   Set it as `EXPO_PUBLIC_GEMINI_API_KEY` in your `.env`.
2.  **Optional — OpenRouter** (fallback):
    *   Used automatically when Gemini is unavailable or hits its quota.
    *   Get a key at [OpenRouter](https://openrouter.ai/keys) and set it as `EXPO_PUBLIC_OPENROUTER_API_KEY`.

> ⚠️ `EXPO_PUBLIC_*` values are inlined into the app bundle at build time, so they are extractable from a built app/APK. That is acceptable for a personal app; treat the keys as public values and never rely on them as a secret. For real secrecy, route AI calls through a small proxy server.

---

## 🛠️ Built With

*   **React Native** & **Expo**
*   **Google Gemini AI** (with OpenRouter fallback)
*   **React Native SVG** & **Victory Native** (for Analytics Charts)
*   **Expo Router** (for Navigation)

## 📄 License & Redistribution

You are free to build, deploy, or modify this template. Make sure to adhere to open-source licenses linked in the `package.json` for 3rd-party dependencies.
