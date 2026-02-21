# 💡 Exemplos Práticos - API Gestão Condominial

## 🔐 1. Autenticação

### Obter Token no Frontend
```javascript
// Após login no sistema
const getAuthToken = async () => {
    const user = firebase.auth().currentUser;
    if (!user) {
        throw new Error('Usuário não autenticado');
    }
    return await user.getIdToken();
};

// Usar
const token = await getAuthToken();
console.log('Token:', token);
```

---

## 📊 2. Buscar Dashboard do Mês

```javascript
async function getDashboard(condominioId, ano, mes) {
    const token = await getAuthToken();
    
    const response = await fetch(
        `https://us-central1-gestaodoscondominios.cloudfunctions.net/api/relatorios/dashboard?condominioId=${condominioId}&ano=${ano}&mes=${mes}`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );
    
    const data = await response.json();
    return data;
}

// Usar
const dashboard = await getDashboard('cond123', '2026', '01');
console.log('Dashboard:', dashboard.data);
// { periodo: "01/2026", pago: 15, reciclado: 3, pendente: 2, acordo: 0, total: 20 }
```

---

## 🏠 3. Listar Apartamentos Inadimplentes

```javascript
async function getInadimplentes(condominioId, ano, mes) {
    const token = await getAuthToken();
    
    const response = await fetch(
        `https://us-central1-gestaodoscondominios.cloudfunctions.net/api/relatorios/inadimplentes?condominioId=${condominioId}&ano=${ano}&mes=${mes}`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );
    
    return await response.json();
}

// Usar
const inadimplentes = await getInadimplentes('cond123', '2026', '01');
console.log(`Total inadimplentes: ${inadimplentes.total}`);
inadimplentes.data.forEach(apt => {
    console.log(`- Apt ${apt.numero}: ${apt.proprietario}`);
});
```

---

## 💰 4. Marcar Pagamento como Pago

```javascript
async function marcarComoPago(pagamentoId, valor, observacao = '') {
    const token = await getAuthToken();
    
    const response = await fetch(
        `https://us-central1-gestaodoscondominios.cloudfunctions.net/api/pagamentos/${pagamentoId}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'pago',
                value: valor,
                observacao: observacao
            })
        }
    );
    
    return await response.json();
}

// Usar
const result = await marcarComoPago('pag123', 285.00, 'Pago via PIX');
console.log(result.message); // "Pagamento atualizado"
```

---

## 📅 5. Criar Reserva do Salão

```javascript
async function criarReserva(condominioId, apartamentoId, data, valor, observacao = '') {
    const token = await getAuthToken();
    
    const response = await fetch(
        'https://us-central1-gestaodoscondominios.cloudfunctions.net/api/salao/reservas',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                condominioId,
                apartamentoId,
                date: data, // formato: "2026-02-15"
                value: valor,
                status: 'reserved',
                observacao
            })
        }
    );
    
    return await response.json();
}

// Usar
const reserva = await criarReserva(
    'cond123',
    'apt101',
    '2026-02-15',
    150.00,
    'Aniversário - Churrasqueira liberada'
);
console.log('Reserva criada:', reserva.id);
```

---

## 🔍 6. Buscar Todos Pagamentos de um Apartamento

```javascript
async function getPagamentosApartamento(apartamentoId) {
    const token = await getAuthToken();
    
    const response = await fetch(
        `https://us-central1-gestaodoscondominios.cloudfunctions.net/api/pagamentos?apartamentoId=${apartamentoId}`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );
    
    return await response.json();
}

// Usar
const pagamentos = await getPagamentosApartamento('apt101');
console.log(`Total de pagamentos: ${pagamentos.count}`);
pagamentos.data.forEach(pag => {
    console.log(`${pag.mes}/${pag.ano}: ${pag.status} - R$ ${pag.value}`);
});
```

---

## 📱 7. Integração com App Mobile (React Native)

```javascript
import axios from 'axios';

const API_BASE = 'https://us-central1-gestaodoscondominios.cloudfunctions.net/api';

class CondominioAPI {
    constructor(token) {
        this.token = token;
        this.client = axios.create({
            baseURL: API_BASE,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async getCondominios() {
        const response = await this.client.get('/condominios');
        return response.data;
    }

    async getDashboard(condominioId, ano, mes) {
        const response = await this.client.get('/relatorios/dashboard', {
            params: { condominioId, ano, mes }
        });
        return response.data;
    }

    async marcarPago(pagamentoId, valor, obs) {
        const response = await this.client.put(`/pagamentos/${pagamentoId}`, {
            status: 'pago',
            value: valor,
            observacao: obs
        });
        return response.data;
    }
}

// Usar
const token = await firebase.auth().currentUser.getIdToken();
const api = new CondominioAPI(token);

const condominios = await api.getCondominios();
console.log(condominios);
```

---

## 🐍 8. Integração com Python

```python
import requests
import firebase_admin
from firebase_admin import auth

# Inicializar Firebase Admin
firebase_admin.initialize_app()

class CondominioAPI:
    def __init__(self, token):
        self.base_url = 'https://us-central1-gestaodoscondominios.cloudfunctions.net/api'
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_dashboard(self, condominio_id, ano, mes):
        url = f'{self.base_url}/relatorios/dashboard'
        params = {
            'condominioId': condominio_id,
            'ano': ano,
            'mes': mes
        }
        response = requests.get(url, headers=self.headers, params=params)
        return response.json()
    
    def get_inadimplentes(self, condominio_id, ano, mes):
        url = f'{self.base_url}/relatorios/inadimplentes'
        params = {
            'condominioId': condominio_id,
            'ano': ano,
            'mes': mes
        }
        response = requests.get(url, headers=self.headers, params=params)
        return response.json()

# Usar
token = "seu-token-aqui"
api = CondominioAPI(token)

dashboard = api.get_dashboard('cond123', '2026', '01')
print(f"Total pago: {dashboard['data']['pago']}")
print(f"Total pendente: {dashboard['data']['pendente']}")
```

---

## 📧 9. Enviar Email para Inadimplentes (Node.js)

```javascript
const nodemailer = require('nodemailer');

async function enviarEmailInadimplentes(condominioId, ano, mes) {
    // 1. Buscar inadimplentes
    const token = await getAuthToken();
    const response = await fetch(
        `https://us-central1-gestaodoscondominios.cloudfunctions.net/api/relatorios/inadimplentes?condominioId=${condominioId}&ano=${ano}&mes=${mes}`,
        {
            headers: { 'Authorization': `Bearer ${token}` }
        }
    );
    
    const { data: inadimplentes } = await response.json();
    
    // 2. Configurar email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'seu-email@gmail.com',
            pass: 'sua-senha'
        }
    });
    
    // 3. Enviar para cada inadimplente
    for (const apt of inadimplentes) {
        const mailOptions = {
            from: 'condominio@example.com',
            to: apt.email, // assumindo que tem email
            subject: `Lembrete de Pagamento - ${mes}/${ano}`,
            html: `
                <h2>Olá ${apt.proprietario},</h2>
                <p>Identificamos que o pagamento do condomínio referente a ${mes}/${ano} ainda está pendente.</p>
                <p><strong>Apartamento:</strong> ${apt.numero}</p>
                <p>Por favor, regularize sua situação.</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`Email enviado para ${apt.proprietario}`);
    }
}

// Usar
await enviarEmailInadimplentes('cond123', '2026', '01');
```

---

## 📊 10. Gerar Relatório Excel (Node.js)

```javascript
const ExcelJS = require('exceljs');

async function gerarRelatorioExcel(condominioId, ano, mes) {
    // 1. Buscar dados
    const token = await getAuthToken();
    const response = await fetch(
        `https://us-central1-gestaodoscondominios.cloudfunctions.net/api/pagamentos?condominioId=${condominioId}&ano=${ano}&mes=${mes}`,
        {
            headers: { 'Authorization': `Bearer ${token}` }
        }
    );
    
    const { data: pagamentos } = await response.json();
    
    // 2. Criar planilha
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pagamentos');
    
    // 3. Adicionar cabeçalhos
    worksheet.columns = [
        { header: 'Apartamento', key: 'apartamento', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Valor', key: 'valor', width: 15 },
        { header: 'Observação', key: 'observacao', width: 30 }
    ];
    
    // 4. Adicionar dados
    pagamentos.forEach(pag => {
        worksheet.addRow({
            apartamento: pag.apartamentoNumero,
            status: pag.status.toUpperCase(),
            valor: `R$ ${pag.value.toFixed(2)}`,
            observacao: pag.observacao || '-'
        });
    });
    
    // 5. Salvar arquivo
    await workbook.xlsx.writeFile(`relatorio_${mes}_${ano}.xlsx`);
    console.log('Relatório gerado com sucesso!');
}

// Usar
await gerarRelatorioExcel('cond123', '2026', '01');
```

---

**Versão**: 1.0.0  
**Data**: 04/02/2026
