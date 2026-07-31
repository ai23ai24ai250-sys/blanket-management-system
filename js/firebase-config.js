/**
 * Firebase Initialization & Cloud Firestore Setup
 */
window.firebaseConfig = {
  apiKey: "AIzaSyC_dzAtGDRfR759bVWgCdfqdiqD5B8tPSg",
  authDomain: "blankts-version-2.firebaseapp.com",
  projectId: "blankts-version-2",
  storageBucket: "blankts-version-2.firebasestorage.app",
  messagingSenderId: "73961546991",
  appId: "1:73961546991:web:47981903c996088551a71a",
  measurementId: "G-YHTBC8P79V"
};

const firebaseConfigKey = 'bms_firebase_config';

window.getFirebaseConfig = function() {
  const saved = localStorage.getItem(firebaseConfigKey);
  if (saved) {
    try { 
      const parsed = JSON.parse(saved);
      return { ...window.firebaseConfig, ...parsed };
    } catch (e) { 
      console.error(e); 
    }
  }
  return window.firebaseConfig;
};

window.saveFirebaseConfig = function(configObj) {
  const merged = { ...window.firebaseConfig, ...configObj };
  localStorage.setItem(firebaseConfigKey, JSON.stringify(merged));
};

// Initialize Firebase App & Firestore if SDK is loaded
window.initFirebaseSDK = function() {
  if (window.firebase) {
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(window.getFirebaseConfig());
    }
    window.db = window.firebase.firestore();
    window.auth = window.firebase.auth();

    // Enable Cloud Firestore Offline Persistence
    window.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence unsupported in browser');
      }
    });
  } else {
    console.warn('Firebase SDK not loaded via CDN. Falling back to local mode.');
  }
};

window.initFirebaseSDK();
