# 🔄 API Alternativa - Sem Firebase Functions

## ⚠️ Problema
Firebase Functions requer conta de cobrança ativa no Google Cloud.

## ✅ Soluções Alternativas

### Opção 1: Usar Firestore Diretamente (Recomendado)

Você já tem acesso direto ao Firestore no frontend. Não precisa de API REST!

#### Exemplo: Buscar Dashboard
```javascript
// Já funciona no seu sistema atual!
async function getDashboard(condominioId, ano, mes) {
    const date = `${ano}-${mes}`;
    
    // Buscar pagamentos
    const paymentsSnap = await firebase.firestore()
        .collection('payments')
        .where('condominioId', '==', condominioId)
        .where('date', '==', date)
        .get();
    
    let pago = 0, reciclado = 0, pendente = 0, acordo = 0;
    
    paymentsSnap.forEach(doc => {
        const data = doc.data();
        switch(data.status) {
            case 'pago': pago++; break;
            case 'reciclado': reciclado++; break;
            case 'pendente': pendente++; break;
            case 'acordo': acordo++; break;
        }
    });
    
    return { pago, reciclado, pendente, acordo, total: paymentsSnap.size };
}

// Usar
const dashboard = await getDashboard('cond123', '2026', '01');
console.log(dashboard);
```

#### Exemplo: Buscar Inadimplentes
```javascript
async function getInadimplentes(condominioId, ano, mes) {
    const date = `${ano}-${mes}`;
    
    // Buscar todos apartamentos
    const aptsSnap = await firebase.firestore()
        .collection('apartamentos')
        .where('condominioId', '==', condominioId)
        .where('active', '==', true)
        .get();
    
    // Buscar pagamentos
    const paymentsSnap = await firebase.firestore()
        .collection('payments')
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
            inadimplentes.push(apt);
        }
    });
    
    return inadimplentes;
}

// Usar
const inadimplentes = await getInadimplentes('cond123', '2026', '01');
console.log(`Total: ${inadimplentes.length}`);
```

---

### Opção 2: Criar Biblioteca JavaScript Reutilizável

Vou criar um arquivo que você pode usar em qualquer projeto:

**`condominio-api.js`**
```javascript
class CondominioAPI {
    constructor(firebaseApp) {
        this.db = firebaseApp.firestore();
    }

    // Condomínios
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

    // Blocos
    async getBlocos(condominioId) {
        const snap = await this.db.collection('blocos')
            .where('condominioId', '==', condominioId)
            .where('active', '==', true)
            .orderBy('nome')
            .get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Apartamentos
    async getApartamentos(blocoId) {
        const snap = await this.db.collection('apartamentos')
            .where('blocoId', '==', blocoId)
            .where('active', '==', true)
            .orderBy('numero')
            .get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Pagamentos
    async getPagamentos(filters = {}) {
        let query = this.db.collection('payments');

        if (filters.condominioId) query = query.where('condominioId', '==', filters.condominioId);
        if (filters.blocoId) query = query.where('blocoId', '==', filters.blocoId);
        if (filters.apartamentoId) query = query.where('apartamentoId', '==', filters.apartamentoId);
        if (filters.ano) query = query.where('ano', '==', filters.ano);
        if (filters.mes) query = query.where('mes', '==', filters.mes);
        if (filters.status) query = query.where('status', '==', filters.status);

        const snap = await query.get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async criarPagamento(data) {
        const docRef = await this.db.collection('payments').add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    }

    async atualizarPagamento(id, data) {
        await this.db.collection('payments').doc(id).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    // Salão
    async getReservas(condominioId, mes, ano) {
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
        const docRef = await this.db.collection('salaoReservations').add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    }

    // Relatórios
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
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CondominioAPI;
}
```

#### Como Usar:
```javascript
// Inicializar
const api = new CondominioAPI(firebase);

// Usar
const condominios = await api.getCondominios();
const dashboard = await api.getDashboard('cond123', '2026', '01');
const inadimplentes = await api.getInadimplentes('cond123', '2026', '01');
```

---

### Opção 3: Servidor Node.js Local (Para Integrações Externas)

Se você precisa de uma API REST real para integrações externas, pode rodar localmente:

**`server.js`**
```javascript
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Inicializar Firebase Admin com suas credenciais
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

const db = admin.firestore();

// Middleware de autenticação
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) return res.status(401).json({ error: 'Token não fornecido' });
        
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// Rotas
app.get('/condominios', authenticate, async (req, res) => {
    const snap = await db.collection('condominios').where('active', '==', true).get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data });
});

app.get('/relatorios/dashboard', authenticate, async (req, res) => {
    const { condominioId, ano, mes } = req.query;
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
        data: { periodo: `${mes}/${ano}`, pago, reciclado, pendente, acordo, total: snap.size }
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
```

**Rodar:**
```bash
npm install express firebase-admin cors
node server.js
```

---

## 📝 Resumo

**Melhor opção**: Use a **Opção 2** (Biblioteca JavaScript)
- ✅ Não precisa de billing
- ✅ Funciona no frontend
- ✅ Mesma funcionalidade
- ✅ Sem custos adicionais

**Para integrações externas**: Use a **Opção 3** (Servidor Local)
- Rode localmente ou em servidor próprio
- Sem custos do Firebase Functions

---

**Versão**: 1.0.0  
**Data**: 04/02/2026
