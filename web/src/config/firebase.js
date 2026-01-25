// src/config/firebase.js - FRONTEND FILE
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

// Firebase configuration using the API key from your .env
const firebaseConfig = {
  apiKey: "AIzaSyAOsHUYerp3odNfFUacEzU0rRHf9FnWIw4",
  authDomain: "harmoniahub-2efd5.firebaseapp.com",
  projectId: "harmoniahub-2efd5",
  storageBucket: "harmoniahub-2efd5.firebasestorage.app",
  messagingSenderId: "976942824492",
  appId: "1:976942824492:web:33245e98dc9124475d2589",
  measurementId: "G-M5SWDS5N8B"
};

console.log('🔧 Initializing Firebase with config:', {
  apiKey: firebaseConfig.apiKey ? '✅ Present' : '❌ Missing',
  authDomain: firebaseConfig.authDomain ? '✅ Present' : '❌ Missing',
  projectId: firebaseConfig.projectId ? '✅ Present' : '❌ Missing'
});

// Validate required config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Firebase configuration is missing required fields');
}

// Initialize Firebase
let app;
let auth;
let googleProvider;
let facebookProvider;

try {
  console.log('🚀 Initializing Firebase app...');
  app = initializeApp(firebaseConfig);
  
  console.log('🔐 Initializing Firebase Auth...');
  auth = getAuth(app);
  
  console.log('🔍 Initializing Google Auth Provider...');
  googleProvider = new GoogleAuthProvider();
  
  // Add scopes for Google auth
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
  
  console.log('🔍 Initializing Facebook Auth Provider...');
  facebookProvider = new FacebookAuthProvider();
  
  // Add scopes for Facebook auth
  facebookProvider.addScope('email');
  facebookProvider.addScope('public_profile');
  
  console.log('✅ Firebase initialized successfully!');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

export { auth, googleProvider, facebookProvider };
export default app;