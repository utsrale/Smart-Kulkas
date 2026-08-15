# Smart Kulkas (Smart Fridge/Inventory Manager)

Smart Kulkas is a modern, cross-platform React Native (Expo) application designed to help users track their refrigerator inventory, reduce food waste, and generate creative recipes using AI based on the ingredients they already have.

The application leverages **Firebase** for backend services (Authentication, Firestore Database) and integrates powerful AI features via **Google Gemini** (with OpenRouter fallback).

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
    *   Rename the `.env.example` file to `.env` in the root directory.
    *   Fill in your Firebase config values and API keys.
    ```env
    # Firebase configuration
    EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
    EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

    # AI configuration
    EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
    EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
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

## 🔥 Backend Setup (Firebase)

To unlock real functionality, you need to link your own Firebase project:

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  Enable **Email/Password Authentication** in the Authentication section.
3.  Enable **Firestore Database** in test mode, or setup appropriate security rules specifically allowing read/write operations for authenticated users.

Example Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /inventory/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    match /users/{document} {
      allow read, write: if request.auth != null && request.auth.uid == document;
    }
  }
}
```

## 🧠 AI Integration (Gemini)

1. Get an API key from [Google AI Studio](https://aistudio.google.com/).
2. Add the key to `EXPO_PUBLIC_GEMINI_API_KEY` in your `.env` file.
3. (*Optional*) The app includes a fallback to OpenRouter. Get a free key from OpenRouter to ensure 100% uptime when Gemini quotas are hit.

---

## 🛠️ Built With

*   **React Native** & **Expo**
*   **Firebase** (Auth, Firestore)
*   **Google Gemini AI**
*   **React Native SVG** & **Victory Native** (for Analytics Charts)
*   **Expo Router** (for Navigation)

## 📄 License & Redistribution

You are free to build, deploy, or modify this template. Make sure to adhere to open-source licenses linked in the `package.json` for 3rd-party dependencies.
