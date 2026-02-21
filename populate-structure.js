
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

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

async function main() {
    try {
        console.log('Autenticando...');
        await signInWithEmailAndPassword(auth, 'admin@condominio.com', '123456');
        console.log('✅ Autenticado com sucesso!');

        // Definição da estrutura exata conforme condominio.md
        const estruturas = {
            'Condomínio Vacaria': { blocos: 24, aptsPerBloco: 16, casas: 4 },
            'Condomínio Ayres': { blocos: 29, aptsPerBloco: 16, casas: 6 },
            'Condomínio Vidal': { blocos: 19, aptsPerBloco: 16, casas: 0 },
            'Condomínio Taroni': { blocos: 15, aptsPerBloco: 16, casas: 0 },
            'Condomínio Destri': { blocos: 26, aptsPerBloco: 16, casas: 5 },
            'Condomínio Speranza': { blocos: 25, aptsPerBloco: 16, casas: 0 }
        };

        // Buscar condomínios existentes
        console.log('Buscando condomínios...');
        const condominiosQuery = query(collection(db, 'condominios'));
        const condominiosSnap = await getDocs(condominiosQuery);

        if (condominiosSnap.empty) {
            console.error('❌ Nenhum condomínio encontrado! Crie os condomínios primeiro.');
            process.exit(1);
        }

        const condominios = [];
        condominiosSnap.forEach(doc => {
            condominios.push({ id: doc.id, ...doc.data() });
        });

        console.log(`Encontrados ${condominios.length} condomínios.`);

        let totalCreated = 0;

        for (const cond of condominios) {
            const estrutura = estruturas[cond.nome];
            if (!estrutura) {
                console.log(`⚠️ Estrutura não definida para "${cond.nome}", ignorando.`);
                continue;
            }

            console.log(`\n🏗️ Processando ${cond.nome}...`);
            console.log(`   Expectativa: ${estrutura.blocos} blocos, ${estrutura.casas} casas.`);

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
                    createdBy: 'script-populate',
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
                            createdBy: 'script-populate',
                            active: true
                        });
                        totalCreated++;
                    }
                }
                process.stdout.write('.'); // Feedback visual
            }

            // Criar Casas
            for (let casaNum = 1; casaNum <= estrutura.casas; casaNum++) {
                const casaRef = doc(collection(db, 'apartamentos')); // Casas ficam na coleção apartamentos, mas com tipo 'casa'
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
                    createdBy: 'script-populate',
                    active: true
                });
                totalCreated++;
            }
            console.log(`\n✅ ${cond.nome} concluído.`);
        }

        console.log(`\n🎉 Processo finalizado! Total de unidades criadas: ${totalCreated}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    }
}

main();
