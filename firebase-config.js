// Configuração do Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Configuração do Firebase - Gestão dos Condomínios
const firebaseConfig = {
  apiKey: "AIzaSyDw1XIkVyMMPfGLCeF4GpMJ6kEZ8HeeuF8",
  authDomain: "gestaodoscondominios.firebaseapp.com",
  projectId: "gestaodoscondominios",
  storageBucket: "gestaodoscondominios.firebasestorage.app",
  messagingSenderId: "20572242752",
  appId: "1:20572242752:web:c1b533c1bb905e81b0f0a5",
  measurementId: "G-DSGCBWM9Q1"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);

// Inicializar Analytics (apenas em produção)
let analytics = null;
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  analytics = getAnalytics(app);
}
export { analytics };

// Para desenvolvimento local (descomente se usar emuladores)
// if (location.hostname === 'localhost') {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(db, 'localhost', 8080);
// }

export default app;