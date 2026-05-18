// Araç Takip için AYRI Firebase projesi konfigürasyonu
// Firebase Console > Project settings > General > Your apps > Web app > Firebase SDK config
// Yeni Firebase açınca burayı kendi yeni proje bilgilerinle değiştir.

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// Araç Takip — Firebase Konfigürasyon
const FIREBASE_ARAC_CONFIG = {
  apiKey: "AIzaSyCoWXATB4ptduI1wm0WFGkZRgx703tW-qM",
  authDomain: "chattakip-32c31.firebaseapp.com",
  databaseURL: "https://chattakip-32c31-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chattakip-32c31",
  storageBucket: "chattakip-32c31.firebasestorage.app",
  messagingSenderId: "934651992903",
  appId: "1:934651992903:web:37ddc3e05c5f9caf260a62"
};


// Bu sürüm Google Maps kullanmaz.
// Harita OpenStreetMap + Leaflet ile ücretsiz çalışır.
// TNB Web Servis bilgileri Araç Takip > Ayarlar ekranından girilir.
