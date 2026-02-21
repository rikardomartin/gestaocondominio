/**
 * Script para marcar todo o ano de 2025 como PAGO
 * Para todos os apartamentos de todos os condomínios
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc,
    setDoc,
    query,
    where
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBnTyF00Pnie-se5vGNqLl7DqzhJEsr8Ck",
    authDomain: "gestaodoscondominios.firebaseapp.com",
    projectId: "gestaodoscondominios",
    storageBucket: "gestaodoscondominios.firebasestorage.app",
    messagingSenderId: "20770393188",
    appId: "1:20770393188:web:c1b7e5c8b5e0a8e8e8e8e8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🚀 Iniciando script para marcar 2025 como pago...');

async function marcarAno2025Pago() {
    try {
        const ano = 2025;
        const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        
        let totalCriados = 0;
        let totalAtualizados = 0;
        let totalErros = 0;

        // 1. Buscar todos os condomínios
        console.log('📋 Buscando condomínios...');
        const condominiosSnapshot = await getDocs(collection(db, 'condominios'));
        const condominios = condominiosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✅ Encontrados ${condominios.length} condomínios`);

        // 2. Para cada condomínio
        for (const condominio of condominios) {
            console.log(`\n🏢 Processando: ${condominio.nome}`);

            // 3. Buscar todos os blocos do condomínio
            const blocosSnapshot = await getDocs(
                query(collection(db, 'blocos'), where('condominioId', '==', condominio.id))
            );
            const blocos = blocosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`  📦 ${blocos.length} blocos encontrados`);

            // 4. Para cada bloco
            for (const bloco of blocos) {
                console.log(`    🔹 ${bloco.nome}`);

                // 5. Buscar todos os apartamentos do bloco
                const apartamentosSnapshot = await getDocs(
                    query(collection(db, 'apartamentos'), where('blocoId', '==', bloco.id))
                );
                const apartamentos = apartamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log(`      🏠 ${apartamentos.length} apartamentos`);

                // 6. Para cada apartamento
                for (const apartamento of apartamentos) {
                    // 7. Para cada mês de 2025
                    for (const mes of meses) {
                        const date = `${ano}-${mes}`;
                        
                        try {
                            // Verificar se já existe pagamento
                            const paymentsSnapshot = await getDocs(
                                query(
                                    collection(db, 'payments'),
                                    where('apartamentoId', '==', apartamento.id),
                                    where('ano', '==', ano),
                                    where('mes', '==', mes)
                                )
                            );

                            const paymentData = {
                                apartamentoId: apartamento.id,
                                condominioId: condominio.id,
                                blocoId: bloco.id,
                                apartamentoNumero: apartamento.numero,
                                ano: ano,
                                mes: mes,
                                date: date,
                                type: 'condominio',
                                status: 'pago',
                                observacao: `Pagamento automático - Script 2025`,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            };

                            if (paymentsSnapshot.empty) {
                                // Criar novo pagamento
                                const newPaymentRef = doc(collection(db, 'payments'));
                                await setDoc(newPaymentRef, paymentData);
                                totalCriados++;
                            } else {
                                // Atualizar existente
                                const existingPayment = paymentsSnapshot.docs[0];
                                await setDoc(doc(db, 'payments', existingPayment.id), paymentData, { merge: true });
                                totalAtualizados++;
                            }

                        } catch (error) {
                            console.error(`      ❌ Erro no apt ${apartamento.numero} mês ${mes}:`, error.message);
                            totalErros++;
                        }
                    }
                }
            }

            // Buscar casas do condomínio
            const casasSnapshot = await getDocs(
                query(collection(db, 'casas'), where('condominioId', '==', condominio.id))
            );
            const casas = casasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            if (casas.length > 0) {
                console.log(`  🏡 ${casas.length} casas encontradas`);

                for (const casa of casas) {
                    for (const mes of meses) {
                        const date = `${ano}-${mes}`;
                        
                        try {
                            const paymentsSnapshot = await getDocs(
                                query(
                                    collection(db, 'payments'),
                                    where('apartamentoId', '==', casa.id),
                                    where('ano', '==', ano),
                                    where('mes', '==', mes)
                                )
                            );

                            const paymentData = {
                                apartamentoId: casa.id,
                                condominioId: condominio.id,
                                blocoId: null,
                                apartamentoNumero: casa.numero,
                                ano: ano,
                                mes: mes,
                                date: date,
                                type: 'condominio',
                                status: 'pago',
                                observacao: `Pagamento automático - Script 2025`,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            };

                            if (paymentsSnapshot.empty) {
                                const newPaymentRef = doc(collection(db, 'payments'));
                                await setDoc(newPaymentRef, paymentData);
                                totalCriados++;
                            } else {
                                const existingPayment = paymentsSnapshot.docs[0];
                                await setDoc(doc(db, 'payments', existingPayment.id), paymentData, { merge: true });
                                totalAtualizados++;
                            }

                        } catch (error) {
                            console.error(`      ❌ Erro na casa ${casa.numero} mês ${mes}:`, error.message);
                            totalErros++;
                        }
                    }
                }
            }
        }

        // Resumo final
        console.log('\n' + '='.repeat(60));
        console.log('✅ SCRIPT CONCLUÍDO!');
        console.log('='.repeat(60));
        console.log(`📊 Resumo:`);
        console.log(`   ✅ Pagamentos criados: ${totalCriados}`);
        console.log(`   🔄 Pagamentos atualizados: ${totalAtualizados}`);
        console.log(`   ❌ Erros: ${totalErros}`);
        console.log(`   📅 Ano processado: ${ano}`);
        console.log(`   📆 Meses: Janeiro a Dezembro (12 meses)`);
        console.log('='.repeat(60));

        alert(`✅ Script concluído!\n\nCriados: ${totalCriados}\nAtualizados: ${totalAtualizados}\nErros: ${totalErros}`);

    } catch (error) {
        console.error('❌ Erro fatal no script:', error);
        alert('❌ Erro ao executar script: ' + error.message);
    }
}

// Executar script
marcarAno2025Pago();
