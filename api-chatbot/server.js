const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

// Inicializar Firebase Admin
// Credenciais devem estar no arquivo .env ou variáveis de ambiente
let credential;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Produção: usar variável de ambiente com JSON
    credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Desenvolvimento: usar caminho para arquivo JSON
    credential = admin.credential.cert(require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
} else {
    console.error('❌ ERRO: Credenciais Firebase não configuradas!');
    console.error('Configure FIREBASE_SERVICE_ACCOUNT ou FIREBASE_SERVICE_ACCOUNT_PATH no .env');
    process.exit(1);
}

admin.initializeApp({ credential });

const db = admin.firestore();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de autenticação simples (API Key)
const API_KEY = process.env.API_KEY || 'sua-chave-secreta-aqui';

const authenticate = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: 'API Key inválida' });
    }
    next();
};

// ===== ROTAS PARA CHATBOT =====

// GET /api/condominios - Listar condomínios
app.get('/api/condominios', authenticate, async (req, res) => {
    try {
        const snap = await db.collection('condominios')
            .where('active', '==', true)
            .get();
        
        const condominios = snap.docs.map(doc => ({
            id: doc.id,
            nome: doc.data().nome,
            endereco: doc.data().endereco
        }));
        
        res.json({ success: true, data: condominios });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/dashboard - Dashboard de um condomínio
app.get('/api/dashboard', authenticate, async (req, res) => {
    try {
        const { condominioId, ano, mes } = req.query;
        
        if (!condominioId || !ano || !mes) {
            return res.status(400).json({ 
                error: 'Parâmetros obrigatórios: condominioId, ano, mes' 
            });
        }
        
        const date = `${ano}-${mes}`;
        const snap = await db.collection('payments')
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
        
        res.json({
            success: true,
            data: {
                periodo: `${mes}/${ano}`,
                pago,
                reciclado,
                pendente,
                acordo,
                total: snap.size,
                percentualPago: snap.size > 0 ? Math.round((pago / snap.size) * 100) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/inadimplentes - Lista de inadimplentes
app.get('/api/inadimplentes', authenticate, async (req, res) => {
    try {
        const { condominioId, ano, mes } = req.query;
        
        if (!condominioId || !ano || !mes) {
            return res.status(400).json({ 
                error: 'Parâmetros obrigatórios: condominioId, ano, mes' 
            });
        }
        
        const date = `${ano}-${mes}`;
        
        // Buscar apartamentos
        const aptsSnap = await db.collection('apartamentos')
            .where('condominioId', '==', condominioId)
            .where('active', '==', true)
            .get();
        
        // Buscar pagamentos
        const paymentsSnap = await db.collection('payments')
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
            const apt = doc.data();
            const status = paymentsMap[doc.id] || 'pendente';
            
            if (status === 'pendente') {
                inadimplentes.push({
                    numero: apt.numero,
                    proprietario: apt.proprietario,
                    blocoNome: apt.blocoNome || 'N/A'
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

// GET /api/apartamento - Buscar status de um apartamento específico
app.get('/api/apartamento', authenticate, async (req, res) => {
    try {
        const { condominioId, numero, ano, mes } = req.query;
        
        if (!condominioId || !numero || !ano || !mes) {
            return res.status(400).json({ 
                error: 'Parâmetros obrigatórios: condominioId, numero, ano, mes' 
            });
        }
        
        // Buscar apartamento
        const aptSnap = await db.collection('apartamentos')
            .where('condominioId', '==', condominioId)
            .where('numero', '==', numero)
            .where('active', '==', true)
            .limit(1)
            .get();
        
        if (aptSnap.empty) {
            return res.status(404).json({ 
                error: 'Apartamento não encontrado' 
            });
        }
        
        const apt = aptSnap.docs[0].data();
        const aptId = aptSnap.docs[0].id;
        
        // Buscar pagamento
        const date = `${ano}-${mes}`;
        const paymentSnap = await db.collection('payments')
            .where('apartamentoId', '==', aptId)
            .where('date', '==', date)
            .limit(1)
            .get();
        
        let status = 'pendente';
        let valor = 0;
        let observacao = '';
        
        if (!paymentSnap.empty) {
            const payment = paymentSnap.docs[0].data();
            status = payment.status;
            valor = payment.value || 0;
            observacao = payment.observacao || '';
        }
        
        res.json({
            success: true,
            data: {
                numero: apt.numero,
                proprietario: apt.proprietario,
                status,
                valor,
                observacao,
                periodo: `${mes}/${ano}`
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/salao/reservas - Reservas do salão
app.get('/api/salao/reservas', authenticate, async (req, res) => {
    try {
        const { condominioId, mes, ano } = req.query;
        
        if (!condominioId) {
            return res.status(400).json({ 
                error: 'Parâmetro obrigatório: condominioId' 
            });
        }
        
        let query = db.collection('salaoReservations')
            .where('condominioId', '==', condominioId);
        
        if (mes && ano) {
            const startDate = `${ano}-${mes.padStart(2, '0')}-01`;
            const endDate = `${ano}-${mes.padStart(2, '0')}-31`;
            query = query.where('date', '>=', startDate).where('date', '<=', endDate);
        }
        
        const snap = await query.orderBy('date').get();
        
        const reservas = snap.docs.map(doc => {
            const data = doc.data();
            return {
                data: data.date,
                apartamento: data.apartamentoNumero || 'N/A',
                status: data.status,
                valor: data.value || 0,
                observacao: data.observacao || ''
            };
        });
        
        res.json({
            success: true,
            data: reservas,
            total: reservas.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/resumo - Resumo geral do condomínio
app.get('/api/resumo', authenticate, async (req, res) => {
    try {
        const { condominioId, ano, mes } = req.query;
        
        if (!condominioId || !ano || !mes) {
            return res.status(400).json({ 
                error: 'Parâmetros obrigatórios: condominioId, ano, mes' 
            });
        }
        
        const date = `${ano}-${mes}`;
        
        // Buscar condomínio
        const condDoc = await db.collection('condominios').doc(condominioId).get();
        const condominio = condDoc.data();
        
        // Buscar pagamentos
        const paymentsSnap = await db.collection('payments')
            .where('condominioId', '==', condominioId)
            .where('date', '==', date)
            .get();
        
        let pago = 0, reciclado = 0, pendente = 0, acordo = 0;
        let valorArrecadado = 0;
        
        paymentsSnap.forEach(doc => {
            const data = doc.data();
            const valor = data.value || 0;
            
            switch(data.status) {
                case 'pago':
                    pago++;
                    valorArrecadado += valor;
                    break;
                case 'reciclado':
                    reciclado++;
                    valorArrecadado += valor;
                    break;
                case 'pendente':
                    pendente++;
                    break;
                case 'acordo':
                    acordo++;
                    break;
            }
        });
        
        res.json({
            success: true,
            data: {
                condominio: condominio.nome,
                periodo: `${mes}/${ano}`,
                totalUnidades: paymentsSnap.size,
                pago,
                reciclado,
                pendente,
                acordo,
                valorArrecadado: valorArrecadado.toFixed(2),
                percentualPago: paymentsSnap.size > 0 ? Math.round(((pago + reciclado) / paymentsSnap.size) * 100) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        name: 'API Chatbot - Gestão Condominial',
        version: '1.0.0',
        endpoints: {
            condominios: 'GET /api/condominios',
            dashboard: 'GET /api/dashboard?condominioId=X&ano=2026&mes=02',
            inadimplentes: 'GET /api/inadimplentes?condominioId=X&ano=2026&mes=02',
            apartamento: 'GET /api/apartamento?condominioId=X&numero=101&ano=2026&mes=02',
            salaoReservas: 'GET /api/salao/reservas?condominioId=X&mes=02&ano=2026',
            resumo: 'GET /api/resumo?condominioId=X&ano=2026&mes=02'
        },
        auth: 'Header: x-api-key: sua-chave'
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API Chatbot rodando em http://localhost:${PORT}`);
    console.log(`🔑 API Key: ${API_KEY}`);
});
