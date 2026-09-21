// Firebase Initialization Script for SkyEagle Studio
const firebaseConfig = {
  apiKey: "AIzaSyB0LwjtjOGib10acfQNTxkhllofP1Tenus",
  authDomain: "skyeaglestudio-45886.firebaseapp.com",
  databaseURL: "https://skyeaglestudio-45886-default-rtdb.firebaseio.com",
  projectId: "skyeaglestudio-45886",
  storageBucket: "skyeaglestudio-45886.firebasestorage.app",
  messagingSenderId: "300452551069",
  appId: "1:300452551069:web:41c0bce1c400569eb17774",
  measurementId: "G-D6X9PTK3YR"
};

if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase Core initialized successfully.");

    if (typeof firebase.analytics !== 'undefined') {
        window.analytics = firebase.analytics();
        console.log("Firebase Analytics initialized.");
    }

    if (typeof firebase.firestore !== 'undefined') {
        window.db = firebase.firestore();
        console.log("Firebase Firestore initialized.");
    }

    if (typeof firebase.auth !== 'undefined') {
        window.auth = firebase.auth();
        console.log("Firebase Auth initialized.");
    }

    if (typeof firebase.storage !== 'undefined') {
        window.storage = firebase.storage();
        console.log("Firebase Storage initialized.");
    }
} else {
    console.warn("Firebase core SDK not loaded. Make sure Firebase CDN scripts are imported.");
}
