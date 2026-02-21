# 📚 API REST - Gestão Condominial

## 🔗 Base URL
```
https://us-central1-gestaodoscondominios.cloudfunctions.net/api
```

## 🔐 Autenticação

Todas as rotas requerem autenticação via Firebase Auth Token.

### Como obter o token:
```javascript
// No frontend (após login)
const user = firebase.auth().currentUser;
const token = await user.getIdToken();
```

### Header de autenticação:
```
Authorization: Bearer <seu-token-aqui>
```

---

## 📋 Endpoints

### 1. Condomínios

#### GET /condominios
Lista todos os condomínios ativos.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cond123",
      "nome": "Residencial Vidal",
      "endereco": "Rua X, 123",
      "active": true
    }
  ]
}
```

#### GET /condominios/:id
Busca um condomínio específico.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cond123",
    "nome": "Residencial Vidal",
    "endereco": "Rua X, 123"
  }
}
```

---

### 2. Blocos

#### GET /condominios/:id/blocos
Lista todos os blocos de um condomínio.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "bloco1",
      "nome": "Bloco A",
      "condominioId": "cond123"
    }
  ]
}
```

---

### 3. Apartamentos

#### GET /blocos/:id/apartamentos
Lista apartamentos de um bloco.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "apt1",
      "numero": "101",
      "proprietario": "João Silva",
      "blocoId": "bloco1"
    }
  ]
}
```

#### GET /apartamentos/:id
Busca um apartamento específico.

---

### 4. Pagamentos

#### GET /pagamentos
Lista pagamentos com filtros opcionais.

**Query Parameters:**
- `condominioId` (opcional)
- `blocoId` (opcional)
- `apartamentoId` (opcional)
- `ano` (opcional) - Ex: "2026"
- `mes` (opcional) - Ex: "01"
- `status` (opcional) - "pendente", "pago", "reciclado", "acordo"

**Exemplo:**
```
GET /pagamentos?condominioId=cond123&ano=2026&mes=01&status=pendente
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pag1",
      "apartamentoId": "apt1",
      "ano": "2026",
      "mes": "01",
      "status": "pendente",
      "value": 285.00,
      "observacao": ""
    }
  ],
  "count": 1
}
```

#### POST /pagamentos
Cria um novo pagamento.

**Body:**
```json
{
  "apartamentoId": "apt1",
  "ano": "2026",
  "mes": "02",
  "status": "pago",
  "value": 285.00,
  "observacao": "Pago via PIX"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pagamento criado",
  "id": "pag123"
}
```

#### PUT /pagamentos/:id
Atualiza um pagamento existente.

**Body:**
```json
{
  "status": "pago",
  "value": 285.00,
  "observacao": "Pago via PIX"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pagamento atualizado"
}
```

---

### 5. Salão de Festas

#### GET /salao/reservas
Lista reservas do salão.

**Query Parameters:**
- `condominioId` (obrigatório)
- `mes` (opcional) - Ex: "02"
- `ano` (opcional) - Ex: "2026"

**Exemplo:**
```
GET /salao/reservas?condominioId=cond123&mes=02&ano=2026
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "res1",
      "condominioId": "cond123",
      "apartamentoId": "apt1",
      "date": "2026-02-15",
      "value": 150.00,
      "status": "paid",
      "observacao": "Aniversário"
    }
  ],
  "count": 1
}
```

#### POST /salao/reservas
Cria uma nova reserva.

**Body:**
```json
{
  "condominioId": "cond123",
  "apartamentoId": "apt1",
  "date": "2026-02-20",
  "value": 150.00,
  "status": "reserved",
  "observacao": "Churrasqueira liberada"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reserva criada",
  "id": "res123"
}
```

---

### 6. Relatórios

#### GET /relatorios/inadimplentes
Relatório de apartamentos inadimplentes.

**Query Parameters:**
- `condominioId` (obrigatório)
- `ano` (obrigatório)
- `mes` (obrigatório)

**Exemplo:**
```
GET /relatorios/inadimplentes?condominioId=cond123&ano=2026&mes=01
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "apartamentoId": "apt1",
      "numero": "101",
      "proprietario": "João Silva",
      "blocoId": "bloco1"
    }
  ],
  "total": 1,
  "periodo": "01/2026"
}
```

#### GET /relatorios/dashboard
Dashboard com estatísticas gerais.

**Query Parameters:**
- `condominioId` (obrigatório)
- `ano` (obrigatório)
- `mes` (obrigatório)

**Exemplo:**
```
GET /relatorios/dashboard?condominioId=cond123&ano=2026&mes=01
```

**Response:**
```json
{
  "success": true,
  "data": {
    "periodo": "01/2026",
    "pago": 15,
    "reciclado": 3,
    "pendente": 2,
    "acordo": 0,
    "total": 20
  }
}
```

---

## 🚀 Como Usar

### Exemplo com JavaScript (Fetch)

```javascript
// 1. Obter token
const user = firebase.auth().currentUser;
const token = await user.getIdToken();

// 2. Fazer requisição
const response = await fetch(
  'https://us-central1-gestaodoscondominios.cloudfunctions.net/api/condominios',
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log(data);
```

### Exemplo com cURL

```bash
# 1. Obter token (do console do navegador após login)
TOKEN="seu-token-aqui"

# 2. Fazer requisição
curl -X GET \
  "https://us-central1-gestaodoscondominios.cloudfunctions.net/api/condominios" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📦 Deploy da API

### 1. Instalar dependências
```bash
cd functions
npm install
```

### 2. Deploy
```bash
firebase deploy --only functions
```

### 3. Testar
```bash
# Ver logs
firebase functions:log

# Testar localmente
firebase emulators:start --only functions
```

---

## ⚠️ Códigos de Erro

- `400` - Bad Request (parâmetros inválidos)
- `401` - Unauthorized (token inválido ou ausente)
- `404` - Not Found (recurso não encontrado)
- `500` - Internal Server Error (erro no servidor)

---

## 📝 Notas

1. Todos os timestamps são gerados automaticamente pelo servidor
2. O campo `createdBy` é preenchido automaticamente com o UID do usuário
3. Datas devem estar no formato `YYYY-MM-DD`
4. Status válidos: `pendente`, `pago`, `reciclado`, `acordo`
5. Status de reserva: `reserved`, `paid`

---

**Versão**: 1.0.0  
**Data**: 04/02/2026  
**Sistema**: Gestão Condominial v131
