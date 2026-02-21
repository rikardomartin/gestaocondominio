
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, deleteDoc, setDoc, query, where, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';

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

async function main() {
    try {
        console.log('Autenticando...');
        await signInWithEmailAndPassword(auth, 'admin@condominio.com', '123456');

        console.log('--- Iniciando Limpeza e Reestruturação ---');

        // Estrutura desejada
        const estruturas = {
            'Condomínio Vacaria': { blocos: 24, aptsPerBloco: 16, casas: 4 },
            'Condomínio Ayres': { blocos: 29, aptsPerBloco: 16, casas: 6 },
            'Condomínio Vidal': { blocos: 19, aptsPerBloco: 16, casas: 0 },
            'Condomínio Taroni': { blocos: 15, aptsPerBloco: 16, casas: 0 },
            'Condomínio Destri': { blocos: 26, aptsPerBloco: 16, casas: 5 },
            'Condomínio Speranza': { blocos: 25, aptsPerBloco: 16, casas: 0 }
        };

        // 1. Buscar todos os condomínios
        const condSnap = await getDocs(collection(db, 'condominios'));
        const condominios = [];
        condSnap.forEach(doc => condominios.push({ id: doc.id, ...doc.data() }));

        // Agrupar por nome
        const porNome = {};
        condominios.forEach(c => {
            if (!porNome[c.nome]) porNome[c.nome] = [];
            porNome[c.nome].push(c);
        });

        // 2. Processar cada grupo (remover duplicatas)
        for (const nome in porNome) {
            if (!estruturas[nome]) {
                console.log(`Ignorando desconhecido: ${nome}`);
                continue;
            }

            const grupo = porNome[nome];
            console.log(`\nProcessando ${nome} (${grupo.length} encontrados)...`);

            // Manter o primeiro, deletar o resto
            const [manter, ...deletar] = grupo;

            // Deletar duplicatas
            for (const d of deletar) {
                console.log(`   Removendo duplicata Condomínio: ${d.id}`);
                await deleteDoc(doc(db, 'condominios', d.id));
                // Deletar blocos e apts associados a este ID (garantia)
                await deleteStructure(d.id);
            }

            // 3. Resetar estrutura do condomínio mantido
            console.log(`   Resetando estrutura do oficial: ${manter.id}`);
            await deleteStructure(manter.id);

            // 4. Recriar estrutura
            const estrutura = estruturas[nome];
            console.log(`   Criando estrutura nova: ${estrutura.blocos} blocos, ${estrutura.casas} casas`);
            await createStructure(manter, estrutura);
        }

        console.log('\n✅ Concluído com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('Erro fatal:', error);
        process.exit(1);
    }
}

async function deleteStructure(condominioId) {
    // Deletar Blocos
    const qB = query(collection(db, 'blocos'), where('condominioId', '==', condominioId));
    const sB = await getDocs(qB);
    const batchSize = 400;

    // Firestore batch limit is 500. Doing blocks one by one is safer if many, but batch is faster.
    // Deletar blocos e apts
    // A query for apts is safer
    const qA = query(collection(db, 'apartamentos'), where('condominioId', '==', condominioId));
    const sA = await getDocs(qA);

    console.log(`      Excluindo ${sB.size} blocos e ${sA.size} unidades antigos...`);

    const promises = [];
    sB.forEach(doc => promises.push(deleteDoc(doc.ref)));
    sA.forEach(doc => promises.push(deleteDoc(doc.ref)));

    await Promise.all(promises); // Simple parallel delete for speed
}

async function createStructure(cond, estrutura) {
    let created = 0;
    // Criar Blocos
    for (let blocoNum = 1; blocoNum <= estrutura.blocos; blocoNum++) {
        const blocoNome = `Bloco ${blocoNum.toString().padStart(2, '0')}`;

        // Criar documento do bloco
        const blocoRef = doc(collection(db, 'blocos'));
        await setDoc(blocoRef, {
            nome: blocoNome,
            numero: blocoNum,
            condominioId: cond.id,
            condominioNome: cond.nome,
            totalApartamentos: estrutura.aptsPerBloco,
            createdAt: serverTimestamp(),
            createdBy: 'script-fix',
            active: true
        });

        // Criar Apartamentos (101-104, 201-204, etc)
        for (let andar = 1; andar <= 4; andar++) {
            for (let apt = 1; apt <= 4; apt++) {
                const numeroApt = `${andar}0${apt}`;
                const aptRef = doc(collection(db, 'apartamentos'));

                await setDoc(aptRef, {
                    numero: numeroApt,
                    andar: andar,
                    posicao: apt,
                    tipo: 'apartamento',
                    blocoId: blocoRef.id,
                    blocoNome: blocoNome,
                    condominioId: cond.id,
                    condominioNome: cond.nome,
                    proprietario: `Proprietário Apt ${numeroApt}`,
                    createdAt: serverTimestamp(),
                    createdBy: 'script-fix',
                    active: true
                });
                created++;
            }
        }
    }

    // Criar Casas
    for (let casaNum = 1; casaNum <= estrutura.casas; casaNum++) {
        const casaRef = doc(collection(db, 'apartamentos'));
        await setDoc(casaRef, {
            numero: casaNum.toString(),
            andar: 0,
            posicao: casaNum,
            tipo: 'casa',
            blocoId: null,
            blocoNome: 'Casa Individual',
            condominioId: cond.id,
            condominioNome: cond.nome,
            proprietario: `Proprietário Casa ${casaNum}`,
            createdAt: serverTimestamp(),
            createdBy: 'script-fix',
            active: true
        });
        created++;
    }
    console.log(`      Criados ${created} registros.`);
}

main();
