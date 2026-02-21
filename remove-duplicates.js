
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Reuse config from existing file if possible, or hardcode based on reading
// Based on fix-and-reset-structure.js
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

async function removeDuplicates() {
    console.log('Autenticando...');
    try {
        await signInWithEmailAndPassword(auth, 'admin@condominio.com', '123456');
        console.log('Autenticado com sucesso.');
    } catch (e) {
        console.error('Erro na autenticação:', e);
        process.exit(1);
    }

    console.log('Iniciando verificação de duplicatas...');

    // 1. Verificar Blocos Duplicados
    console.log('\n--- Verificando Blocos ---');
    const blocosSnapshot = await getDocs(collection(db, 'blocos'));
    const blocos = [];
    blocosSnapshot.forEach(doc => {
        blocos.push({ id: doc.id, ...doc.data() });
    });

    // Agrupar por condominioId + nome
    const blocosGrouped = {};
    blocos.forEach(bloco => {
        const key = `${bloco.condominioId}_${bloco.nome}`;
        if (!blocosGrouped[key]) blocosGrouped[key] = [];
        blocosGrouped[key].push(bloco);
    });

    let blocosRemoved = 0;
    for (const key in blocosGrouped) {
        const group = blocosGrouped[key];
        if (group.length > 1) {
            console.log(`Encontradas ${group.length} duplicatas para ${group[0].nome} (Condo: ${group[0].condominioId})`);

            // Deletar todos exceto o primeiro (que assumimos ser o "original" ou que queremos manter)
            // Em client SDK não temos data de criação confiável se não vier no doc, mas vamos manter o primeiro da lista array
            for (let i = 1; i < group.length; i++) {
                const duplicate = group[i];
                console.log(`Removendo bloco duplicado: ${duplicate.id}`);
                try {
                    await deleteDoc(doc(db, 'blocos', duplicate.id));
                    blocosRemoved++;

                    // Buscar apartamentos deste bloco deletado
                    const qApts = query(collection(db, 'apartamentos'), where('blocoId', '==', duplicate.id));
                    const aptsSnapshot = await getDocs(qApts);
                    if (!aptsSnapshot.empty) {
                        console.log(`  -> Removendo ${aptsSnapshot.size} apartamentos do bloco deletado.`);
                        const batch = writeBatch(db);
                        aptsSnapshot.forEach(d => batch.delete(d.ref));
                        await batch.commit();
                    }
                } catch (err) {
                    console.error(`Erro ao deletar bloco ${duplicate.id}:`, err);
                }
            }
        }
    }
    console.log(`Total de blocos duplicados removidos: ${blocosRemoved}`);

    // 2. Verificar Apartamentos Duplicados
    console.log('\n--- Verificando Apartamentos ---');
    const aptsSnapshot = await getDocs(collection(db, 'apartamentos'));
    const apts = [];
    aptsSnapshot.forEach(doc => {
        apts.push({ id: doc.id, ...doc.data() });
    });

    const aptsGrouped = {};
    apts.forEach(apt => {
        // Chave única: blocoId + numero (ou condominioId + numero para casas)
        const parentId = apt.blocoId || apt.condominioId;
        const key = `${parentId}_${apt.numero}`;

        if (!aptsGrouped[key]) aptsGrouped[key] = [];
        aptsGrouped[key].push(apt);
    });

    let aptsRemoved = 0;
    for (const key in aptsGrouped) {
        const group = aptsGrouped[key];
        if (group.length > 1) {
            console.log(`Encontradas ${group.length} duplicatas para apt ${group[0].numero} (Parent: ${group[0].blocoId || group[0].condominioId})`);

            for (let i = 1; i < group.length; i++) {
                console.log(`Removendo apt duplicado: ${group[i].id}`);
                try {
                    await deleteDoc(doc(db, 'apartamentos', group[i].id));
                    aptsRemoved++;
                } catch (err) {
                    console.error(`Erro ao deletar apt ${group[i].id}:`, err);
                }
            }
        }
    }

    console.log(`Total de apartamentos duplicados removidos: ${aptsRemoved}`);
    console.log('\nProcesso finalizado.');
    process.exit(0);
}

removeDuplicates().catch(console.error);
