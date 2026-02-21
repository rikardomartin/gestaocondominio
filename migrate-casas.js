
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';

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

async function migrate() {
    try {
        await signInWithEmailAndPassword(auth, 'admin@condominio.com', '123456');
        console.log('✅ Autenticado.');

        // 1. Remover TODAS as casas residuais da coleção 'apartamentos'
        console.log('🧹 Limpando casas da coleção principal...');
        const qApts = query(collection(db, 'apartamentos'), where('tipo', '==', 'casa'));
        const snapApts = await getDocs(qApts);
        for (const d of snapApts.docs) {
            await deleteDoc(d.ref);
        }
        console.log(`✅ ${snapApts.size} casas removidas da coleção principal.`);

        // 2. Criar casas exatamente conforme solicitado na subcoleção
        const configCasas = {
            'Condomínio Vacaria': 4,
            'Condomínio Ayres': 6,
            'Condomínio Destri': 5
        };

        const condSnap = await getDocs(collection(db, 'condominios'));

        for (const condDoc of condSnap.docs) {
            const condData = condDoc.data();
            const qtd = configCasas[condData.nome];

            if (qtd) {
                console.log(`🏗️ Criando ${qtd} casas para ${condData.nome}...`);
                const casasColl = collection(db, 'condominios', condDoc.id, 'casas');

                for (let i = 1; i <= qtd; i++) {
                    const casaNome = `Casa ${i.toString().padStart(2, '0')}`;
                    const casaRef = doc(casasColl);
                    await setDoc(casaRef, {
                        numero: casaNome,
                        tipo: 'casa',
                        condominioId: condDoc.id,
                        condominioNome: condData.nome,
                        status: 'pendente',
                        observacoes: '',
                        posicao: i,
                        active: true,
                        createdAt: serverTimestamp()
                    });
                }
                console.log(`✅ ${condData.nome} pronto.`);
            }
        }

        console.log('🎉 Migração concluída com sucesso!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Erro:', e);
        process.exit(1);
    }
}

migrate();
