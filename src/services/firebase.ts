import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Конфигурация Firebase (считывается из Vercel автоматически)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Инициализируем приложение
const app = initializeApp(firebaseConfig);

// Экспортируем auth и db — БЕЗ них база данных и весь остальной проект сломаются!
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Функция регистрации нового пользователя по почте и паролю
 */
export const registerWithEmail = async (email: string, pass: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Ошибка при регистрации:", error);
    throw error;
  }
};

/**
 * Функция входа существующего пользователя по почте и паролю
 */
export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Ошибка при входе:", error);
    throw error;
  }
};

/**
 * Функция выхода из аккаунта
 */
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Ошибка при выходе:", error);
    throw error;
  }
};
