/**
 * Firebase Configuration
 */
window.firebaseConfig = {
  apiKey: "AIzaSyCbAdo6Lm2qqCRTPKaLOLelC5v6IOEbHvM",
  authDomain: "blankts-c0c68.firebaseapp.com",
  projectId: "blankts-c0c68",
  storageBucket: "blankts-c0c68.firebasestorage.app",
  messagingSenderId: "663398193544",
  appId: "1:663398193544:web:a6b97ffc18218b8b3cc23d",
  measurementId: "G-RW13T159H8"
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

// Auto sync latest defaults to localStorage
localStorage.setItem(firebaseConfigKey, JSON.stringify(window.firebaseConfig));
