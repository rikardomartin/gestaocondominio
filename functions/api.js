const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Middleware de autenticação
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        res.status(401).json({ error: 'Token inválido' });
    }
};

// ===== ROTAS DE CONDOMÍNIOS =====

// GET /condominios - Listar todos os condomínios
app.get('/condominios', authenticate, async (req, res) => {
    try {
        const snapshot = await admin.firestore()
            .collection('condominios')
            .where('active', '==', true)
            .get();

        const condominios = [];
        snapshot.forEach(doc => {
            condominios.push({ id: doc.id, ...doc.data() });
        });

        res.json({ success: true, data: condominios });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /condominios/:id - Buscar condomínio específico
app.get('/condominios/:id', authenticate, async (req, res) => {
    try {
        const doc = await admin.firestore()
            .collection('condominios')
            .doc(req.params.id)
            .get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Condomínio não encontrado' });
        }

        res.json({ success: true, data: { id: doc.id, ...doc.data() } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ROTAS DE BLOCOS =====

// GET /condominios/:id/blocos - Listar blocos de um condomínio

app.get('/condominios/:id/blocos', authenticate, async (req, res) => {
    try {
        const snapshot = await admin.firestore()
            .collection('blocos')
            .where('condominioId', '==', req.params.id)
            .where('active', '==', true)
            .orderBy('nome')
            .get();

        const blocos = [];
        snapshot.forEach(doc => {
            blocos.push({ id: doc.id, ...doc.data() });
        });

        res.json({ success: true, data: blocos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ROTAS DE APARTAMENTOS =====

// GET /blocos/:id/apartamentos - Listar apartamentos de um bloco
app.get('/blocos/:id/apartamentos', authenticate, async (req, res) => {
    try {
        const snapshot = await admin.firestore()
            .collection('apartamentos')
            .where('blocoId', '==', req.params.id)
            .where('active', '==', true)
            .orderBy('numero')
            .get();

        const apartamentos = [];
        snapshot.forEach(doc => {
            apartamentos.push({ id: doc.id, ...doc.data() });
        });

        res.json({ success: true, data: apartamentos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /apartamentos/:id - Buscar apartamento específico
app.get('/apartamentos/:id', authenticate, async (req, res) => {
    try {
        const doc = await admin.firestore()
            .collection('apartamentos')
            .doc(req.params.id)
            .get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Apartamento não encontrado' });
        }

        res.json({ success: true, data: { id: doc.id, ...doc.data() } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ROTAS DE PAGAMENTOS =====

// GET /pagamentos - Listar pagamentos com filtros
app.get('/pagamentos', authenticate, async (req, res) => {
    try {
        const { condominioId, blocoId, apartamentoId, ano, mes, status } = req.query;
        
        let query = admin.firestore().collection('payments');

        if (condominioId) query = query.where('condominioId', '==', condominioId);
        if (blocoId) query = query.where('blocoId', '==', blocoId);
        if (apartamentoId) query = query.where('apartamentoId', '==', apartamentoId);
        if (ano) query = query.where('ano', '==', ano);
        if (mes) query = query.where('mes', '==', mes);
        if (status) query = query.where('status', '==', status);

        const snapshot = await query.get();

        const pagamentos = [];
        snapshot.forEach(doc => {
            pagamentos.push({ id: doc.id, ...doc.data() });
        });

        res.json({ success: true, data: pagamentos, count: pagamentos.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /pagamentos - Criar novo pagamento
app.post('/pagamentos', authenticate, async (req, res) => {
    try {
        const { apartamentoId, ano, mes, status, value, observacao } = req.body;

        if (!apartamentoId || !ano || !mes) {
            return res.status(400).json({ error: 'Campos obrigatórios: apartamentoId, ano, mes' });
        }

        const docRef = await admin.firestore().collection('payments').add({
            apartamentoId,
            ano,
            mes,
            date: `${ano}-${mes}`,
            status: status || 'pendente',
            value: value || 0,
            observacao: observacao || '',
            type: 'condominio',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ 
            success: true, 
            message: 'Pagamento criado',
            id: docRef.id 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /pagamentos/:id - Atualizar pagamento
app.put('/pagamentos/:id', authenticate, async (req, res) => {
    try {
        const { status, value, observacao } = req.body;
        
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: req.user.uid
        };

        if (status) updateData.status = status;
        if (value !== undefined) updateData.value = value;
        if (observacao !== undefined) updateData.observacao = observacao;

        await admin.firestore()
            .collection('payments')
            .doc(req.params.id)
            .update(updateData);

        res.json({ success: true, message: 'Pagamento atualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ROTAS DE RESERVAS DO SALÃO =====

// GET /salao/reservas - Listar reservas
app.get('/salao/reservas', authenticate, async (req, res) => {
    try {
        const { condominioId, mes, ano } = req.query;

        if (!condominioId) {
            return res.status(400).json({ error: 'condominioId é obrigatório' });
        }

        let query = admin.firestore()
            .collection('salaoReservations')
            .where('condominioId', '==', condominioId);

        if (mes && ano) {
            const startDate = `${ano}-${mes.padStart(2, '0')}-01`;
            const endDate = `${ano}-${mes.padStart(2, '0')}-31`;
            query = query.where('date', '>=', startDate).where('date', '<=', endDate);
        }

        const snapshot = await query.orderBy('date').get();

        const reservas = [];
        snapshot.forEach(doc => {
            reservas.push({ id: doc.id, ...doc.data() });
        });

        res.json({ success: true, data: reservas, count: reservas.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /salao/reservas - Criar reserva
app.post('/salao/reservas', authenticate, async (req, res) => {
    try {
        const { condominioId, apartamentoId, date, value, status, observacao } = req.body;

        if (!condominioId || !apartamentoId || !date) {
            return res.status(400).json({ 
                error: 'Campos obrigatórios: condominioId, apartamentoId, date' 
            });
        }

        const docRef = await admin.firestore().collection('salaoReservations').add({
            condominioId,
            apartamentoId,
            date,
            value: value || 0,
            status: status || 'reserved',
            observacao: observacao || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.uid
        });

        res.status(201).json({ 
            success: true, 
            message: 'Reserva criada',
            id: docRef.id 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ROTAS DE RELATÓRIOS =====

// GET /relatorios/inadimplentes - Relatório de inadimplentes
app.get('/relatorios/inadimplentes', authenticate, async (req, res) => {
    try {
        const { condominioId, ano, mes } = req.query;

        if (!condominioId || !ano || !mes) {
            return res.status(400).json({ 
                error: 'Campos obrigatórios: condominioId, ano, mes' 
            });
        }

        const date = `${ano}-${mes}`;

        // Buscar todos apartamentos do condomínio
        const apartamentosSnapshot = await admin.firestore()
            .collection('apartamentos')
            .where('condominioId', '==', condominioId)
            .where('active', '==', true)
            .get();

        // Buscar pagamentos do período
        const pagamentosSnapshot = await admin.firestore()
            .collection('payments')
            .where('condominioId', '==', condominioId)
            .where('date', '==', date)
            .get();

        const pagamentosMap = {};
        pagamentosSnapshot.forEach(doc => {
            const data = doc.data();
            pagamentosMap[data.apartamentoId] = data.status;
        });

        const inadimplentes = [];
        apartamentosSnapshot.forEach(doc => {
            const apt = { id: doc.id, ...doc.data() };
            const status = pagamentosMap[apt.id] || 'pendente';
            
            if (status === 'pendente') {
                inadimplentes.push({
                    apartamentoId: apt.id,
                    numero: apt.numero,
                    proprietario: apt.proprietario,
                    blocoId: apt.blocoId
                });
            }
        });

        res.json({ 
            success: true, 
            data: inadimplentes,
            total: inadimplentes.length,
            periodo: `${mes}/${ano}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /relatorios/dashboard - Dashboard geral
app.get('/relatorios/dashboard', authenticate, async (req, res) => {
    try {
        const { condominioId, ano, mes } = req.query;

        if (!condominioId || !ano || !mes) {
            return res.status(400).json({ 
                error: 'Campos obrigatórios: condominioId, ano, mes' 
            });
        }

        const date = `${ano}-${mes}`;

        // Buscar pagamentos
        const pagamentosSnapshot = await admin.firestore()
            .collection('payments')
            .where('condominioId', '==', condominioId)
            .where('date', '==', date)
            .get();

        let totalPago = 0;
        let totalReciclado = 0;
        let totalPendente = 0;
        let totalAcordo = 0;

        pagamentosSnapshot.forEach(doc => {
            const data = doc.data();
            switch (data.status) {
                case 'pago':
                    totalPago++;
                    break;
                case 'reciclado':
                    totalReciclado++;
                    break;
                case 'pendente':
                    totalPendente++;
                    break;
                case 'acordo':
                    totalAcordo++;
                    break;
            }
        });

        res.json({
            success: true,
            data: {
                periodo: `${mes}/${ano}`,
                pago: totalPago,
                reciclado: totalReciclado,
                pendente: totalPendente,
                acordo: totalAcordo,
                total: pagamentosSnapshot.size
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        name: 'API Gestão Condominial',
        version: '1.0.0',
        endpoints: {
            condominios: '/condominios',
            blocos: '/condominios/:id/blocos',
            apartamentos: '/blocos/:id/apartamentos',
            pagamentos: '/pagamentos',
            salao: '/salao/reservas',
            relatorios: {
                inadimplentes: '/relatorios/inadimplentes',
                dashboard: '/relatorios/dashboard'
            }
        }
    });
});

module.exports = app;
