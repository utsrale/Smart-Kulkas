# 🧊 Smart Kulkas App

A modern, intelligent inventory management application built to help you track your groceries, prevent food waste, and get smart recipe recommendations based on what's available in your fridge.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)

## ✨ Features

- **📦 Inventory Dashboard:** Track all items inside your fridge with a beautiful UI. Grouped by freshness status.
- **⏳ Expiry Alerts:** Get visual warnings and popover notifications when items are about to expire.
- **🤖 Smart Recipe Generator (Powered by Gemini AI):** Select ingredients you have, and let AI suggest creative recipes you can cook right now.
- **🛒 Shopping List:** Easily add missing ingredients directly to your shopping list.
- **📊 Analytics:** Monitor your food consumption habits and get AI-powered tips on sustainability and reducing food waste.
- **☁️ Cloud Sync (Firebase):** Your data is safely stored in the cloud. Access your fridge from anywhere!

## 🚀 Live Demo

The web version of this application is deployed and can be customized via Vercel.

## 🛠️ Installation & Setup (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/utsrale/Smart-Kulkas.git
cd Smart-Kulkas
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add your API keys:
```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run the app
```bash
npm start
```
- Press `a` to open in Android emulator
- Press `i` to open in iOS simulator
- Press `w` to open in web browser

## 🌐 Web Deployment (Vercel)

1. Connect this repository to your Vercel account.
2. Under "Framework Preset", select **Other**.
3. Under "Build Command", enter **`npx expo export -p web`**.
4. Under "Output Directory", enter **`dist`**.
5. Add all your `.env` variables into the **Environment Variables** section in Vercel before deploying.

---
*Developed with ❤️ to fight food waste.*
