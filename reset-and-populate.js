
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, query, getDocs, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDw1XIkVyMMPfGLCeF4GpMJ6kEZ8HeeuF8",
    authDomain: "gestaodoscondominios.firebaseapp.com",
    projectId: "gestaodoscondominios",
    storageBucket: "gestaodoscondominios.firebasestorage.app",
    messagingSenderId: "20572242752",
    appId: "1:20572242752:web:c1b533c1bb905e81b0f0a5",
    measurementId: "G-DSGCBWM9Q1"
};

// Inicializar Apps
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function wipeCollection(collectionName) {
    console.log(`🧹 Limpando coleção ${collectionName}...`);
    const snap = await getDocs(collection(db, collectionName));
    let deleted = 0;

    // Usar batches para eficiência (limite de 500 operações por batch)
    let batch = writeBatch(db);
    let count = 0;

    for (const document of snap.docs) {
        batch.delete(document.ref);
        count++;
        deleted++;

        if (count >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
            process.stdout.write('.');
        }
    }

    if (count > 0) {
        await batch.commit();
    }
    console.log(`\n✅ ${deleted} documentos removidos de ${collectionName}.`);
}

async function main() {
    try {
        console.log('Autenticando...');
        await signInWithEmailAndPassword(auth, 'admin@condominio.com', '123456');
        console.log('✅ Autenticado com sucesso!');

        // 1. Limpeza
        console.log('\n🚨 ATENÇÃO: Iniciando limpeza completa da estrutura...');
        await wipeCollection('condominios');
        await wipeCollection('blocos');
        await wipeCollection('apartamentos');

        // 2. Definição da estrutura exata conforme condominio.md e ajustes para bater totais
        const estruturas = [
            { nome: 'Condomínio Vacaria', blocos: 24, aptsPerBloco: 16, casas: 4, total: 388 },
            { nome: 'Condomínio Ayres', blocos: 29, aptsPerBloco: 16, casas: 5, total: 469 },
            { nome: 'Condomínio Vidal', blocos: 19, aptsPerBloco: 16, casas: 4, total: 308 },
            { nome: 'Condomínio Taroni', blocos: 15, aptsPerBloco: 16, casas: 3, total: 243 },
            { nome: 'Condomínio Destri', blocos: 26, aptsPerBloco: 16, casas: 5, total: 421 },
            { nome: 'Condomínio Speranza', blocos: 24, aptsPerBloco: 16, casas: 4, total: 388 }
        ];

        let totalUnitsCreated = 0;

        for (const est of estruturas) {
            console.log(`\n🏗️ Criando ${est.nome}...`);

            // Criar Condomínio
            const condRef = doc(collection(db, 'condominios'));
            await setDoc(condRef, {
                nome: est.nome,
                totalBlocos: est.blocos,
                totalUnidades: est.total,
                createdAt: serverTimestamp(),
                active: true
            });

            // Criar Blocos
            for (let b = 1; b <= est.blocos; b++) {
                const blocoNome = `Bloco ${b.toString().padStart(2, '0')}`;
                const blocoRef = doc(collection(db, 'blocos'));

                await setDoc(blocoRef, {
                    nome: blocoNome,
                    numero: b,
                    condominioId: condRef.id,
                    condominioNome: est.nome,
                    totalApartamentos: est.aptsPerBloco,
                    active: true
                });

                // Criar Apartamentos (101-104, 201-204, 301-304, 401-404)
                for (let andar = 1; andar <= 4; andar++) {
                    for (let pos = 1; pos <= 4; pos++) {
                        const numero = `${andar}0${pos}`;
                        const aptRef = doc(collection(db, 'apartamentos'));
                        await setDoc(aptRef, {
                            numero: numero,
                            andar: andar,
                            posicao: pos,
                            tipo: 'apartamento',
                            blocoId: blocoRef.id,
                            blocoNome: blocoNome,
                            condominioId: condRef.id,
                            condominioNome: est.nome,
                            proprietario: `Proprietário Apt ${numero}`,
                            status: 'pendente',
                            active: true
                        });
                        totalUnitsCreated++;
                    }
                }
                process.stdout.write('.');
            }

            // Criar Casas
            for (let c = 1; c <= est.casas; c++) {
                const casaRef = doc(collection(db, 'apartamentos'));
                await setDoc(casaRef, {
                    numero: `Casa ${c}`,
                    andar: 0,
                    posicao: c,
                    tipo: 'casa',
                    blocoId: 'casa-individual',
                    blocoNome: 'Casas',
                    condominioId: condRef.id,
                    condominioNome: est.nome,
                    proprietario: `Proprietário Casa ${c}`,
                    status: 'pendente',
                    active: true
                });
                totalUnitsCreated++;
            }
            console.log(`\n✅ ${est.nome} finalizado.`);
        }

        console.log(`\n🎉 SUCESSO! Total de unidades (Apts + Casas) criadas: ${totalUnitsCreated}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    }
}

main();
