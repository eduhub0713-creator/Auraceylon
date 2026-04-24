// Firebase App Config
const firebaseConfig = {
  apiKey: "AIzaSyBw9R1fDYJLSarT_UZZSyJb3yEJl3BE20M",
  authDomain: "auraceylon-e5b64.firebaseapp.com",
  projectId: "auraceylon-e5b64",
  storageBucket: "auraceylon-e5b64.firebasestorage.app",
  messagingSenderId: "558409863488",
  appId: "1:558409863488:web:f4167e881226e1b852aaa5",
  measurementId: "G-5L1RQQS8NF"
};

// Initialize Firebase only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Global Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
