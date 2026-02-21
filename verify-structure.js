
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);

async function verify() {
    try {
        console.log('Autenticando...');
        await signInWithEmailAndPassword(auth, 'admin@condominio.com', '123456');

        console.log('--- Relatório de Verificação ---');

        // Contar Condomínios
        const condSnap = await getDocs(collection(db, 'condominios'));
        console.log(`Total Condomínios: ${condSnap.size}`);

        // Contar Blocos
        const blocosSnap = await getDocs(collection(db, 'blocos'));
        console.log(`Total Blocos: ${blocosSnap.size}`);

        // Agrupar blocos por condomínio
        const blocosPorCond = {};
        blocosSnap.forEach(doc => {
            const data = doc.data();
            const nome = data.condominioNome || 'Desconhecido';
            blocosPorCond[nome] = (blocosPorCond[nome] || 0) + 1;
        });
        console.table(blocosPorCond);

        // Contar Unidades
        const aptsSnap = await getDocs(collection(db, 'apartamentos'));
        console.log(`Total Unidades (Apts + Casas): ${aptsSnap.size}`);

        // Agrupar unidades por condomínio e tipo
        const statsPorCond = {};
        aptsSnap.forEach(doc => {
            const data = doc.data();
            const condNome = data.condominioNome || 'Desconhecido';
            const tipo = data.tipo || 'apartamento';

            if (!statsPorCond[condNome]) {
                statsPorCond[condNome] = { apartamentos: 0, casas: 0 };
            }

            if (tipo === 'casa') {
                statsPorCond[condNome].casas++;
            } else {
                statsPorCond[condNome].apartamentos++;
            }
        });
        console.table(statsPorCond);

        process.exit(0);
    } catch (error) {
        console.error('Erro na verificação:', error);
        process.exit(1);
    }
}

verify();
