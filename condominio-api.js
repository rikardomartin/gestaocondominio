/**
 * Biblioteca de API para Gestão Condominial
 * Versão: 1.0.0
 * 
 * Uso:
 * const api = new CondominioAPI(firebase);
 * const condominios = await api.getCondominios();
 */

class CondominioAPI {
    constructor(firebaseApp) {
        this.db = firebaseApp.firestore();
        this.auth = firebaseApp.auth();
    }

    // ===== CONDOMÍNIOS =====

    async getCondominios() {
        const snap = await this.db.collection('condominios')
            .where('active', '==', true)
            .get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getCondominio(id) {
        const doc = await this.db.collection('condominios').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    // ===== BLOCOS =====

    async getBlocos(condominioId) {
        const snap = await this.db.collection('blocos')
            .where('condominioId', '==', condominioId)
            .where('active', '==', true)
            .orderBy('nome')
            .get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getBloco(id) {
        const doc = await this.db.collection('blocos').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    // ===== APARTAMENTOS =====

    async getApartamentos(blocoId) {
        const snap = await this.db.collection('apartamentos')
            .where('blocoId', '==', blocoId)
            .where('active', '==', true)
            .orderBy('numero')
            .get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getApartamento(id) {
        const doc = await this.db.collection('apartamentos').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async getCasas(condominioId) {
        const snap = await this.db.collection('condominios')
            .doc(condominioId)
            .collection('casas')
            .where('active', '==', true)
            .orderBy('numero')
            .get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // ===== PAGAMENTOS =====

    async getPagamentos(filters = {}) {
        let query = this.db.collection('payments');

        if (filters.condominioId) {
            query = query.where('condominioId', '==', filters.condominioId);
        }
        if (filters.blocoId) {
            query = query.where('blocoId', '==', filters.blocoId);
        }
        if (filters.apartamentoId) {
            query = query.where('apartamentoId', '==', filters.apartamentoId);
        }
        if (filters.ano) {
            query = query.where('ano', '==', filters.ano);
        }
        if (filters.mes) {
            query = query.where('mes', '==', filters.mes);
        }
        if (filters.status) {
            query = query.where('status', '==', filters.status);
        }
        if (filters.date) {
            query = query.where('date', '==', filters.date);
        }

        const snap = await query.get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async criarPagamento(data) {
        const user = this.auth.currentUser;
        const docRef = await this.db.collection('payments').add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: user ? user.uid : null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    }

    async atualizarPagamento(id, data) {
        const user = this.auth.currentUser;
        await this.db.collection('payments').doc(id).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: user ? user.uid : null
        });
        return true;
    }

    async deletarPagamento(id) {
        await this.db.collection('payments').doc(id).delete();
        return true;
    }

    // ===== SALÃO DE FESTAS =====

    async getReservas(condominioId, mes = null, ano = null) {
        let query = this.db.collection('salaoReservations')
            .where('condominioId', '==', condominioId);

        if (mes && ano) {
            const startDate = `${ano}-${mes.padStart(2, '0')}-01`;
            const endDate = `${ano}-${mes.padStart(2, '0')}-31`;
            query = query.where('date', '>=', startDate).where('date', '<=', endDate);
        }

        const snap = await query.orderBy('date').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async criarReserva(data) {
        const user = this.auth.currentUser;
        const docRef = await this.db.collection('salaoReservations').add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: user ? user.uid : null
        });
        return docRef.id;
    }

    async atualizarReserva(id, data) {
        await this.db.collection('salaoReservations').doc(id).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    }

    async deletarReserva(id) {
        await this.db.collection('salaoReservations').doc(id).delete();
        return true;
    }

    // ===== RELATÓRIOS =====

    async getDashboard(condominioId, ano, mes) {
        const date = `${ano}-${mes}`;
        const snap = await this.db.collection('payments')
            .where('condominioId', '==', condominioId)
            .where('date', '==', date)
            .get();

        let pago = 0, reciclado = 0, pendente = 0, acordo = 0;

        snap.forEach(doc => {
            const data = doc.data();
            switch(data.status) {
                case 'pago': pago++; break;
                case 'reciclado': reciclado++; break;
                case 'pendente': pendente++; break;
                case 'acordo': acordo++; break;
            }
        });

        return {
            periodo: `${mes}/${ano}`,
            pago,
            reciclado,
            pendente,
            acordo,
            total: snap.size
        };
    }

    async getInadimplentes(condominioId, ano, mes) {
        const date = `${ano}-${mes}`;

        // Buscar apartamentos
        const aptsSnap = await this.db.collection('apartamentos')
            .where('condominioId', '==', condominioId)
            .where('active', '==', true)
            .get();

        // Buscar pagamentos
        const paymentsSnap = await this.db.collection('payments')
            .where('condominioId', '==', condominioId)
            .where('date', '==', date)
            .get();

        const paymentsMap = {};
        paymentsSnap.forEach(doc => {
            const data = doc.data();
            paymentsMap[data.apartamentoId] = data.status;
        });

        const inadimplentes = [];
        aptsSnap.forEach(doc => {
            const apt = { id: doc.id, ...doc.data() };
            const status = paymentsMap[apt.id] || 'pendente';
            
            if (status === 'pendente') {
                inadimplentes.push({
                    apartamentoId: apt.id,
                    numero: apt.numero,
                    proprietario: apt.proprietario,
                    blocoId: apt.blocoId
                });
            }
        });

        return {
            data: inadimplentes,
            total: inadimplentes.length,
            periodo: `${mes}/${ano}`
        };
    }

    async getResumoFinanceiro(condominioId, ano, mes) {
        const date = `${ano}-${mes}`;
        
        const snap = await this.db.collection('payments')
            .where('condominioId', '==', condominioId)
            .where('date', '==', date)
            .get();

        let totalPago = 0;
        let totalReciclado = 0;
        let totalPendente = 0;
        let valorArrecadado = 0;

        snap.forEach(doc => {
            const data = doc.data();
            const valor = data.value || 0;

            switch(data.status) {
                case 'pago':
                    totalPago++;
                    valorArrecadado += valor;
                    break;
                case 'reciclado':
                    totalReciclado++;
                    valorArrecadado += valor;
                    break;
                case 'pendente':
                    totalPendente++;
                    break;
            }
        });

        return {
            periodo: `${mes}/${ano}`,
            totalPago,
            totalReciclado,
            totalPendente,
            valorArrecadado,
            total: snap.size
        };
    }

    // ===== TAXAS =====

    async getTaxas(condominioId) {
        const snap = await this.db.collection('condominioTaxes')
            .where('condominioId', '==', condominioId)
            .orderBy('effectiveDate', 'desc')
            .get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getTaxaAtual(condominioId) {
        const snap = await this.db.collection('condominioTaxes')
            .where('condominioId', '==', condominioId)
            .orderBy('effectiveDate', 'desc')
            .limit(1)
            .get();
        
        if (snap.empty) return null;
        const doc = snap.docs[0];
        return { id: doc.id, ...doc.data() };
    }
}

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CondominioAPI;
}

// Disponibilizar globalmente no navegador
if (typeof window !== 'undefined') {
    window.CondominioAPI = CondominioAPI;
}
