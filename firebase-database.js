// Firebase Database Services - v41 - FINAL - 2026-01-31
// Serviços de banco de dados Firebase
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db } from './firebase-config.js';
import { getCurrentUser, getCurrentProfile } from './firebase-auth.js';

// Coleções do Firestore
export const COLLECTIONS = {
  CONDOMINIOS: 'condominios',
  BLOCOS: 'blocos',
  APARTAMENTOS: 'apartamentos',
  PAYMENTS: 'payments',
  SALAO_RESERVATIONS: 'salaoReservations',
  CONDOMINIO_TAXES: 'condominioTaxes',
  USERS: 'users'
};

// Funções para Condomínios
async function createCondominio(data) {
  try {
    const user = getCurrentUser();
    const docRef = await addDoc(collection(db, COLLECTIONS.CONDOMINIOS), {
      ...data,
      createdAt: serverTimestamp(),
      createdBy: user ? user.uid : null,
      active: true
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar condomínio:', error);
    throw error;
  }
}

async function getCondominios() {
  try {
    const q = query(
      collection(db, COLLECTIONS.CONDOMINIOS),
      where('active', '==', true)
      // Removido orderBy para evitar erro de índice
    );
    const querySnapshot = await getDocs(q);
    const condominios = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar no cliente para evitar necessidade de índice
    condominios.sort((a, b) => a.nome.localeCompare(b.nome));

    return condominios;
  } catch (error) {
    console.error('Erro ao buscar condomínios:', error);
    throw error;
  }
}

async function updateCondominio(id, data) {
  try {
    const user = getCurrentUser();
    const docRef = doc(db, COLLECTIONS.CONDOMINIOS, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: user ? user.uid : null
    });
  } catch (error) {
    console.error('Erro ao atualizar condomínio:', error);
    throw error;
  }
}

// Funções para Blocos
async function createBloco(data) {
  try {
    const user = getCurrentUser();
    const docRef = await addDoc(collection(db, COLLECTIONS.BLOCOS), {
      ...data,
      createdAt: serverTimestamp(),
      createdBy: user ? user.uid : null,
      active: true
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar bloco:', error);
    throw error;
  }
}

async function getBlocosByCondominio(condominioId) {
  try {
    const q = query(
      collection(db, COLLECTIONS.BLOCOS),
      where('condominioId', '==', condominioId),
      where('active', '==', true)
      // Removido orderBy para evitar erro de índice
    );
    const querySnapshot = await getDocs(q);
    const blocos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar no cliente para evitar necessidade de índice
    blocos.sort((a, b) => a.nome.localeCompare(b.nome));

    return blocos;
  } catch (error) {
    console.error('Erro ao buscar blocos:', error);
    throw error;
  }
}

// Funções para Apartamentos
async function createApartamento(data) {
  try {
    const user = getCurrentUser();
    const docRef = await addDoc(collection(db, COLLECTIONS.APARTAMENTOS), {
      ...data,
      createdAt: serverTimestamp(),
      createdBy: user ? user.uid : null,
      active: true
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar apartamento:', error);
    throw error;
  }
}

async function getApartamentosByBloco(blocoId) {
  try {
    const q = query(
      collection(db, COLLECTIONS.APARTAMENTOS),
      where('blocoId', '==', blocoId),
      where('active', '==', true)
      // Removido orderBy para evitar erro de índice
    );
    const querySnapshot = await getDocs(q);
    const apartamentos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar no cliente por número
    apartamentos.sort((a, b) => {
      const numA = parseInt(a.numero) || 0;
      const numB = parseInt(b.numero) || 0;
      return numA - numB;
    });

    return apartamentos;
  } catch (error) {
    console.error('Erro ao buscar apartamentos:', error);
    throw error;
  }
}

async function updateApartamento(id, data) {
  try {
    const user = getCurrentUser();
    const docRef = doc(db, COLLECTIONS.APARTAMENTOS, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: user ? user.uid : null
    });
  } catch (error) {
    console.error('Erro ao atualizar apartamento:', error);
    throw error;
  }
}

// Funções para Casas (Busca na collection apartamentos com tipo='casa')
async function getCasasByCondominio(condominioId) {
  try {
    // Buscar casas na collection apartamentos (estrutura nova)
    const q = query(
      collection(db, COLLECTIONS.APARTAMENTOS),
      where('condominioId', '==', condominioId),
      where('tipo', '==', 'casa'),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const casas = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar por número/posição
    casas.sort((a, b) => {
      const numA = parseInt(a.numero.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.numero.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    return casas;
  } catch (error) {
    console.error('Erro ao buscar casas:', error);
    throw error;
  }
}

async function updateCasa(condominioId, casaId, data) {
  try {
    const user = getCurrentUser();
    // Atualizar na collection apartamentos (não mais subcoleção)
    const docRef = doc(db, COLLECTIONS.APARTAMENTOS, casaId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: user ? user.uid : null
    });
  } catch (error) {
    console.error('Erro ao atualizar casa:', error);
    throw error;
  }
}

// Funções para Pagamentos// Funções para Pagamentos
async function createPayment(data) {
  try {
    const user = getCurrentUser();
    const profile = getCurrentProfile();
    const docRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
      ...data,
      createdAt: serverTimestamp(),
      createdBy: user ? user.uid : null,
      registeredBy: (profile && profile.name) || 'Sistema',
      lastModifiedBy: user ? user.email : null // Email do usuário que criou
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    throw error;
  }
}

async function getPaymentsByApartamento(apartamentoId) {
  try {
    const q = query(
      collection(db, COLLECTIONS.PAYMENTS),
      where('apartamentoId', '==', apartamentoId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    throw error;
  }
}

async function updatePayment(id, data) {
  try {
    const user = getCurrentUser();
    const profile = getCurrentProfile();
    const docRef = doc(db, COLLECTIONS.PAYMENTS, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: user ? user.uid : null,
      lastModifiedBy: user ? user.email : null // Email do usuário que modificou
    });
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    throw error;
  }
}

async function deletePayment(id) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PAYMENTS, id));
  } catch (error) {
    console.error('Erro ao deletar pagamento:', error);
    throw error;
  }
}

async function getPaymentsByBlocoAndPeriod(blocoId, date) {
  try {
    const q = query(
      collection(db, COLLECTIONS.PAYMENTS),
      where('blocoId', '==', blocoId),
      where('date', '==', date)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar pagamentos do bloco:', error);
    throw error;
  }
}

// OTIMIZAÇÃO v131: Buscar pagamentos de casas por condomínio e período (1 query em vez de N)
async function getPaymentsByCondominioAndPeriod(condominioId, date) {
  try {
    const q = query(
      collection(db, COLLECTIONS.PAYMENTS),
      where('condominioId', '==', condominioId),
      where('date', '==', date)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar pagamentos do condomínio:', error);
    throw error;
  }
}

// Funções para Reservas do Salão
async function createSalaoReservation(data) {
  try {
    const user = getCurrentUser();
    const docRef = await addDoc(collection(db, COLLECTIONS.SALAO_RESERVATIONS), {
      ...data,
      createdAt: serverTimestamp(),
      createdBy: user ? user.uid : null
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    throw error;
  }
}

async function getSalaoReservationsByCondominio(condominioId, month, year) {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const q = query(
      collection(db, COLLECTIONS.SALAO_RESERVATIONS),
      where('condominioId', '==', condominioId),
      where('date', '>=', startDate.toISOString().split('T')[0]),
      where('date', '<=', endDate.toISOString().split('T')[0]),
      orderBy('date')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    throw error;
  }
}

function subscribeToSalaoReservations(condominioId, callback) {
  const q = query(
    collection(db, COLLECTIONS.SALAO_RESERVATIONS),
    where('condominioId', '==', condominioId),
    orderBy('date', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const reservations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(reservations);
  }, (error) => {
    console.error('Erro no listener do salão:', error);
  });
}

async function updateSalaoReservation(id, data) {
  try {
    const user = getCurrentUser();
    const docRef = doc(db, COLLECTIONS.SALAO_RESERVATIONS, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: user ? user.uid : null
    });
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    throw error;
  }
}

async function deleteSalaoReservation(id) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SALAO_RESERVATIONS, id));
  } catch (error) {
    console.error('Erro ao deletar reserva:', error);
    throw error;
  }
}

// Função para buscar dados do dashboard
async function getDashboardData(filters) {
  filters = filters || {};
  try {
    const condominios = await getCondominios();
    const allPayments = [];

    // Buscar pagamentos de todos os apartamentos
    for (var i = 0; i < condominios.length; i++) {
      var condominio = condominios[i];
      const blocos = await getBlocosByCondominio(condominio.id);

      for (var j = 0; j < blocos.length; j++) {
        var bloco = blocos[j];
        const apartamentos = await getApartamentosByBloco(bloco.id);

        for (var k = 0; k < apartamentos.length; k++) {
          var apartamento = apartamentos[k];
          const payments = await getPaymentsByApartamento(apartamento.id);

          payments.forEach(function (payment) {
            allPayments.push({
              ...payment,
              condominio: condominio.nome,
              condominioId: condominio.id,
              bloco: bloco.nome,
              blocoId: bloco.id,
              apartamento: apartamento.numero,
              apartamentoId: apartamento.id,
              proprietario: apartamento.proprietario
            });
          });
        }
      }
    }

    return allPayments;
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    throw error;
  }
}

// Função para inicializar estrutura COMPLETA dos condomínios (condomínios + blocos + apartamentos)
async function initializeCondominiosStructure() {
  try {
    console.log('Iniciando criação da estrutura completa...');

    // Verificar se já existem condomínios
    const existingCondominios = await getDocs(query(
      collection(db, COLLECTIONS.CONDOMINIOS),
      where('active', '==', true)
    ));

    if (existingCondominios.size > 0) {
      console.log('⚠️ Estrutura já existe! Verificando se precisa atualizar...');

      // Verificar se todos os 6 condomínios existem
      const existingNames = existingCondominios.docs.map(function (doc) { return doc.data().nome; });
      const expectedNames = [
        "Condomínio Vacaria",
        "Condomínio Ayres",
        "Condomínio Vidal",
        "Condomínio Taroni",
        "Condomínio Destri",
        "Condomínio Speranza"
      ];

      const missingCondominios = expectedNames.filter(function (name) {
        return !existingNames.some(function (existing) { return existing.indexOf(name.replace('Condomínio ', '')) !== -1; });
      });

      if (missingCondominios.length === 0) {
        console.log('✅ Todos os condomínios já existem. Estrutura completa!');
        throw new Error('Estrutura já existe! Todos os 6 condomínios já foram criados. Para recriar, exclua os dados existentes primeiro.');
      } else {
        console.log('📋 Condomínios faltando:', missingCondominios);
        console.log('Continuando criação apenas dos condomínios faltantes...');
      }
    }

    // Dados básicos dos condomínios baseados no detalhamento fornecido
    const condominiosData = [
      {
        nome: "Condomínio Vacaria",
        endereco: "Rua Vacaria, 388",
        totalUnidades: 388,
        totalBlocos: 24,
        totalCasas: 4,
        blocos: 24,
        aptsPerBloco: 16,
        casas: [
          { bloco: 25, quantidade: 4 } // Bloco 25: 04 casas
        ]
      },
      {
        nome: "Condomínio Ayres",
        endereco: "Rua Ayres, 469",
        totalUnidades: 469,
        totalBlocos: 29,
        totalCasas: 6,
        blocos: 29,
        aptsPerBloco: 16,
        casas: [
          { bloco: 1, quantidade: 2 },  // Bloco 01: 02 casas
          { bloco: 30, quantidade: 3 }  // Bloco 30: 03 casas (falta 1 casa - total deveria ser 6)
        ]
      },
      {
        nome: "Condomínio Vidal",
        endereco: "Rua Vidal, 308",
        totalUnidades: 308,
        totalBlocos: 19,
        totalCasas: 4,
        blocos: 19,
        aptsPerBloco: 16,
        casas: [
          { bloco: 20, quantidade: 4 } // Bloco 20: 04 casas
        ]
      },
      {
        nome: "Condomínio Taroni",
        endereco: "Rua Taroni, 243",
        totalUnidades: 243,
        totalBlocos: 15,
        totalCasas: 3,
        blocos: 15,
        aptsPerBloco: 16,
        casas: [
          { bloco: 1, quantidade: 3 } // Bloco 01: 03 casas
        ]
      },
      {
        nome: "Condomínio Destri",
        endereco: "Rua Destri, 421",
        totalUnidades: 421,
        totalBlocos: 26,
        totalCasas: 5,
        blocos: 26,
        aptsPerBloco: 16,
        casas: [
          { bloco: 27, quantidade: 2 }, // Bloco 27: 02 casas
          { bloco: 28, quantidade: 3 }  // Bloco 28: 03 casas
        ]
      },
      {
        nome: "Condomínio Speranza",
        endereco: "Rua Speranza, 388",
        totalUnidades: 388,
        totalBlocos: 25,
        totalCasas: 4,
        blocos: 25,
        aptsPerBloco: 16,
        casas: [
          { bloco: 25, quantidade: 4 } // Bloco 25: 04 casas (conta não fecha - verificar)
        ]
      }
    ];

    console.log('Criando estrutura completa para', condominiosData.length, 'condomínios...');

    // Criar estrutura completa para cada condomínio
    for (var i = 0; i < condominiosData.length; i++) {
      var condData = condominiosData[i];
      // Verificar se este condomínio específico já existe
      const existingCond = await getDocs(query(
        collection(db, COLLECTIONS.CONDOMINIOS),
        where('active', '==', true),
        where('nome', '==', condData.nome)
      ));

      if (existingCond.size > 0) {
        console.log('⏭️ ' + condData.nome + ' já existe, pulando...');
        continue;
      }

      console.log('Criando ' + condData.nome + '...');

      var currentUser = getCurrentUser();
      var currentProfile = getCurrentProfile();

      // 1. Criar condomínio
      const condRef = doc(collection(db, COLLECTIONS.CONDOMINIOS));
      await setDoc(condRef, {
        nome: condData.nome,
        endereco: condData.endereco,
        totalUnidades: condData.totalUnidades,
        totalBlocos: condData.totalBlocos,
        totalCasas: condData.totalCasas,
        createdAt: serverTimestamp(),
        createdBy: (currentUser && currentUser.uid) || 'system',
        createdByName: (currentProfile && currentProfile.name) || 'Sistema',
        active: true
      });

      // 2. Criar taxa padrão
      const taxRef = doc(collection(db, COLLECTIONS.CONDOMINIO_TAXES));
      await setDoc(taxRef, {
        condominioId: condRef.id,
        value: 285.00,
        reason: 'Taxa inicial do condomínio',
        effectiveDate: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        createdBy: (currentUser && currentUser.uid) || 'system',
        createdByName: (currentProfile && currentProfile.name) || 'Sistema'
      });

      // 3. Criar blocos e apartamentos
      for (var blocoNum = 1; blocoNum <= condData.blocos; blocoNum++) {
        // Criar bloco
        const blocoRef = doc(collection(db, COLLECTIONS.BLOCOS));
        await setDoc(blocoRef, {
          nome: 'Bloco ' + (blocoNum < 10 ? '0' + blocoNum : blocoNum),
          numero: blocoNum,
          condominioId: condRef.id,
          condominioNome: condData.nome,
          totalApartamentos: condData.aptsPerBloco,
          createdAt: serverTimestamp(),
          createdBy: (currentUser && currentUser.uid) || 'system',
          active: true
        });

        // Criar apartamentos para este bloco (4 andares x 4 apts = 16 apts)
        for (var andar = 1; andar <= 4; andar++) {
          for (var apt = 1; apt <= 4; apt++) {
            const numeroApt = andar + '0' + apt;

            const aptRef = doc(collection(db, COLLECTIONS.APARTAMENTOS));
            await setDoc(aptRef, {
              numero: numeroApt,
              andar: andar,
              posicao: apt,
              tipo: 'apartamento',
              blocoId: blocoRef.id,
              blocoNome: 'Bloco ' + (blocoNum < 10 ? '0' + blocoNum : blocoNum),
              condominioId: condRef.id,
              condominioNome: condData.nome,
              proprietario: 'Proprietário Apt ' + numeroApt,
              status: 'pendente',
              createdAt: serverTimestamp(),
              createdBy: (currentUser && currentUser.uid) || 'system',
              active: true
            });
          }
        }

        console.log('Bloco ' + blocoNum + ' criado com ' + condData.aptsPerBloco + ' apartamentos');
      }

      // 4. Criar blocos específicos para casas (se houver)
      if (condData.casas && condData.casas.length > 0) {
        for (var j = 0; j < condData.casas.length; j++) {
          var casaInfo = condData.casas[j];
          // Criar bloco específico para casas
          const blocoCasaRef = doc(collection(db, COLLECTIONS.BLOCOS));
          await setDoc(blocoCasaRef, {
            nome: 'Bloco ' + (casaInfo.bloco < 10 ? '0' + casaInfo.bloco : casaInfo.bloco),
            numero: casaInfo.bloco,
            condominioId: condRef.id,
            condominioNome: condData.nome,
            totalApartamentos: casaInfo.quantidade,
            tipo: 'casas',
            createdAt: serverTimestamp(),
            createdBy: (currentUser && currentUser.uid) || 'system',
            active: true
          });

          // Criar casas neste bloco
          for (var casaNum = 1; casaNum <= casaInfo.quantidade; casaNum++) {
            const numeroCasa = 'Casa ' + (casaNum < 10 ? '0' + casaNum : casaNum);

            const casaRef = doc(collection(db, COLLECTIONS.APARTAMENTOS));
            await setDoc(casaRef, {
              numero: numeroCasa,
              tipo: 'casa',
              blocoId: blocoCasaRef.id,
              blocoNome: 'Bloco ' + (casaInfo.bloco < 10 ? '0' + casaInfo.bloco : casaInfo.bloco),
              condominioId: condRef.id,
              condominioNome: condData.nome,
              proprietario: 'Proprietário ' + numeroCasa,
              status: 'pendente',
              posicao: casaNum,
              createdAt: serverTimestamp(),
              createdBy: (currentUser && currentUser.uid) || 'system',
              active: true
            });
          }

          console.log('Bloco ' + casaInfo.bloco + ' criado com ' + casaInfo.quantidade + ' casas');
        }
      }

      var totalApts = condData.blocos * condData.aptsPerBloco;
      var totalCasasCalculadas = 0;
      if (condData.casas) {
        for (var k = 0; k < condData.casas.length; k++) {
          totalCasasCalculadas += condData.casas[k].quantidade;
        }
      }
      console.log('✅ ' + condData.nome + ' concluído: ' + condData.blocos + ' blocos de apts (' + totalApts + ' apts), ' + totalCasasCalculadas + ' casas');
    }

    console.log('🎉 Estrutura completa criada com sucesso!');

  } catch (error) {
    console.error('Erro ao inicializar estrutura:', error);
    throw error;
  }
}

// Listeners em tempo real
function subscribeToCondominios(callback) {
  const q = query(
    collection(db, COLLECTIONS.CONDOMINIOS),
    where('active', '==', true)
    // Removido orderBy para evitar erro de índice
  );

  return onSnapshot(q, (querySnapshot) => {
    const condominios = querySnapshot.docs.map(function (doc) {
      return {
        id: doc.id,
        ...doc.data()
      };
    });

    // Ordenar no cliente para evitar necessidade de índice
    condominios.sort(function (a, b) { return a.nome.localeCompare(b.nome); });

    callback(condominios);
  });
}

function subscribeToPayments(apartamentoId, callback) {
  const q = query(
    collection(db, COLLECTIONS.PAYMENTS),
    where('apartamentoId', '==', apartamentoId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const payments = querySnapshot.docs.map(function (doc) {
      return {
        id: doc.id,
        ...doc.data()
      };
    });
    callback(payments);
  });
}

// Funções para Taxa do Condomínio
async function createCondominioTax(condominioId, taxData) {
  try {
    const user = getCurrentUser();
    const profile = getCurrentProfile();
    const docRef = await addDoc(collection(db, COLLECTIONS.CONDOMINIO_TAXES), {
      condominioId: condominioId,
      value: taxData.value,
      reason: taxData.reason || 'Definição inicial',
      effectiveDate: taxData.effectiveDate || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      createdBy: user ? user.uid : null,
      createdByName: (profile && profile.name) || 'Sistema'
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar taxa:', error);
    throw error;
  }
}

async function getCondominioTaxes(condominioId) {
  try {
    const q = query(
      collection(db, COLLECTIONS.CONDOMINIO_TAXES),
      where('condominioId', '==', condominioId),
      orderBy('effectiveDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(function (doc) {
      return {
        id: doc.id,
        ...doc.data()
      };
    });
  } catch (error) {
    console.error('Erro ao buscar taxas:', error);
    throw error;
  }
}

async function getCurrentTax(condominioId, referenceDate) {
  try {
    const targetDate = referenceDate || new Date().toISOString().split('T')[0];

    const q = query(
      collection(db, COLLECTIONS.CONDOMINIO_TAXES),
      where('condominioId', '==', condominioId),
      where('effectiveDate', '<=', targetDate),
      orderBy('effectiveDate', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }

    // Se não encontrar taxa específica, retornar taxa padrão
    return {
      value: 285.00,
      reason: 'Taxa padrão do sistema',
      effectiveDate: '2024-01-01'
    };
  } catch (error) {
    console.error('Erro ao buscar taxa atual:', error);
    // Retornar taxa padrão em caso de erro
    return {
      value: 285.00,
      reason: 'Taxa padrão do sistema',
      effectiveDate: '2024-01-01'
    };
  }
}

function subscribeToCondominioTaxes(condominioId, callback) {
  const q = query(
    collection(db, COLLECTIONS.CONDOMINIO_TAXES),
    where('condominioId', '==', condominioId),
    orderBy('effectiveDate', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const taxes = querySnapshot.docs.map(function (doc) {
      return {
        id: doc.id,
        ...doc.data()
      };
    });
    callback(taxes);
  });
}

export {
  createCondominio,
  getCondominios,
  updateCondominio,
  createBloco,
  getBlocosByCondominio,
  createApartamento,
  getApartamentosByBloco,
  updateApartamento,
  getCasasByCondominio,
  updateCasa,
  createPayment,
  getPaymentsByApartamento,
  updatePayment,
  deletePayment,
  createSalaoReservation,
  getSalaoReservationsByCondominio,
  subscribeToSalaoReservations,
  updateSalaoReservation,
  deleteSalaoReservation,
  getDashboardData,
  initializeCondominiosStructure,
  subscribeToCondominios,
  subscribeToPayments,
  createCondominioTax,
  getCondominioTaxes,
  getCurrentTax,
  subscribeToCondominioTaxes,
  getPaymentsByBlocoAndPeriod,
  getPaymentsByCondominioAndPeriod
};
