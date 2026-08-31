import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase Client Configuration for school-management-system-83098
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForWebMessagingSchoolApp123',
  authDomain: 'school-management-system-83098.firebaseapp.com',
  projectId: 'school-management-system-83098',
  storageBucket: 'school-management-system-83098.appspot.com',
  messagingSenderId: '1069207002084',
  appId: '1:1069207002084:web:83098schoolmanageapp',
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Safe getter for Firebase Messaging in supported browser environments
export const getFirebaseMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      return getMessaging(app);
    }
  } catch (err) {
    console.warn('[Firebase] Client messaging not supported in this environment:', err.message);
  }
  return null;
};

export default app;
