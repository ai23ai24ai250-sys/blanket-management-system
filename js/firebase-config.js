/**
 * Firebase Configuration
 */
window.firebaseConfig = {
  apiKey: "AIzaSyCbAdo6Lm2qqCRTPKaLOLelC5v6IOEbHvM",
  authDomain: "blankts-c0c68.firebaseapp.com",
  projectId: "blankts-c0c68",
  storageBucket: "blankts-c0c68.firebasestorage.app",
  messagingSenderId: "663398193544",
  appId: "1:663398193544:web:70d90a058315bd7a3cc23d",
  measurementId: "G-1V7KXKVL8J"
};

const firebaseConfigKey = 'bms_firebase_config';

window.getFirebaseConfig = function() {
  const saved = localStorage.getItem(firebaseConfigKey);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { console.error(e); }
  }
  return window.firebaseConfig;
};

window.saveFirebaseConfig = function(configObj) {
  localStorage.setItem(firebaseConfigKey, JSON.stringify(configObj));
};
