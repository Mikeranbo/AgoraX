import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult,
  signOut 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// (These environment variables are automatically read by Vercel)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure Google Auth Provider
const provider = new GoogleAuthProvider();
// Forces Google to ask which account you want to use every time you log in
provider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Initiates the Google Sign-In process using Redirect.
 * This completely avoids browser popup blockers!
 */
export const signInWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Error initiating redirect sign-in:", error);
    throw error;
  }
};

/**
 * Automatically checks if the user just returned from a Google redirect
 * and logs them in.
 */
getRedirectResult(auth)
  .then((result) => {
    if (result?.user) {
      console.log("Successfully logged in via redirect:", result.user.displayName);
    }
  })
  .catch((error) => {
    console.error("Error processing redirect result:", error);
  });

/**
 * Signs the current user out.
 */
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};
