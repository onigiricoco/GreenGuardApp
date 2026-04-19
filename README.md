# PlantCare AI - GreenGuard 🌿

An AI-powered plant identification, health assessment, and care guidance system built with React, Vite, and Google Gemini.

## 🚀 Deployment Guide (Vercel / Netlify)

This project is optimized for deployment on platforms like Vercel or Netlify. Follow these steps to get your app live:

### 1. Prerequisite: Export your Code
- Export this project to **GitHub** or download the **ZIP** from AI Studio.

### 2. Environment Variables
To make the AI features and usage tracking work, you **MUST** configure the following Environment Variables in your hosting provider's dashboard (e.g., Vercel Settings > Environment Variables):

| Variable Name | Description | Where to get it |
| --- | --- | --- |
| `GEMINI_API_KEY` | Your Google Gemini API Key | Get one at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `VITE_FIREBASE_CONFIG` | (Optional) Your custom Firebase config | If you want to use your own Firebase project |

### 3. Setup on Vercel
1. Create a new project on Vercel and import your repository.
2. Vercel will automatically detect the **Vite** framework.
3. Add the `GEMINI_API_KEY` variable as shown above.
4. Click **Deploy**.

## 🛠 Features
- **Instant Identification**: Uses Gemini 1.5 Flash to identify plants from photos.
- **Smart Health Check**: Diagnoses plant diseases and provides recovery steps.
- **Usage Tracking**: Integrated with Firebase Firestore to manage daily limits (25 per user).
- **Multi-lingual Support**: Full support for English and Chinese (Traditional/Simplified).
- **Responsive Design**: Polished Bento-grid layout for Mobile and Desktop.

## 📦 Tech Stack
- **Frontend**: React 19, Tailwind CSS, Motion (Animation)
- **AI**: Google Gemini API
- **Backend/Database**: Firebase Firestore
- **Icons**: Lucide React
