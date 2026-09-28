/**
 * Shared Firebase Realtime Database setup for SkyEagle Studio.
 * Used by the public site (contact + reviews) and matches admin/admin.html.
 */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);

export {
  app,
  db,
  ref,
  push,
  set,
  onValue,
  update,
  remove
};
