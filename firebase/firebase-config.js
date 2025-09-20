// firebase/firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBQaw3dxlcrv1ZBPA6HgkGxj3yMwc_c_mA",
  authDomain: "vehicle-auth-system.firebaseapp.com",
  projectId: "vehicle-auth-system",
  storageBucket: "vehicle-auth-system.firebasestorage.app",
  messagingSenderId: "234492459371",
  appId: "1:234492459371:web:ef2813f62c966f89f8742e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

console.log('🔥 Firebase initialized successfully - firebase-config.js:20');
console.log('📊 Firestore instance: - firebase-config.js:21', db);
