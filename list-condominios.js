
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDw1XIkVyMMPfGLCeF4GpMJ6kEZ8HeeuF8",
    authDomain: "gestaodoscondominios.firebaseapp.com",
    projectId: "gestaodoscondominios",
    storageBucket: "gestaodoscondominios.firebasestorage.app",
    messagingSenderId: "20572242752",
    appId: "1:20572242752:web:c1b533c1bb905e81b0f0a5",
    measurementId: "G-DSGCBWM9Q1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
const auth = getAuth(app);

async function list() {
    await signInWithEmailAndPassword(auth, 'admin@condominio.com', '123456');
    const snap = await getDocs(collection(db, 'condominios'));
    console.log('Listando nomes de condomínios:');
    snap.forEach(doc => {
        console.log(`- "${doc.data().nome}" (ID: ${doc.id})`);
    });
    process.exit(0);
}
list();
