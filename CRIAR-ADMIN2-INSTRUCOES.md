# 👥 Instruções para Criar Admin2

## ✅ Deploy Concluído

O script `criar-admin2.html` foi deployado com sucesso!

## 📋 Passos para Criar o Admin2

### 1. Acesse a página de criação
```
https://gestaodoscondominios.web.app/criar-admin2.html
```

### 2. Clique no botão "➕ Criar Admin2"

O script irá:
- ✅ Verificar se o usuário já existe
- ✅ Criar usuário no Firebase Auth
- ✅ Criar perfil no Firestore com role ADMIN
- ✅ Configurar acesso a todos os condomínios

### 3. Credenciais do Admin2

```
📧 Email: admin2@condominio.com
🔑 Senha: a10b20c30@
👤 Role: ADMIN
🏢 Acesso: Todos os condomínios
```

### 4. Testar Login

Após criar, clique em "🔐 Testar Login" para verificar se as credenciais estão corretas.

## 🔔 Como Funcionam as Notificações

### Lógica Implementada (v112)

1. **Admin Principal (admin@condominio.com)**
   - ❌ NÃO recebe notificações quando ELE MESMO altera status
   - ✅ RECEBE notificações quando ADMIN2 altera status

2. **Admin2 (admin2@condominio.com)**
   - ✅ RECEBE notificações quando ADMIN PRINCIPAL altera status
   - ❌ NÃO recebe notificações quando ELE MESMO altera status

### Quando as Notificações São Enviadas

As notificações são enviadas quando qualquer operador marca um apartamento como:
- 💰 **PAGO** (R$ 80,00)
- ♻️ **RECICLADO** (R$ 40,00)
- 🤝 **ACORDO** (R$ 0,00)

### Características das Notificações

- 📱 Aparecem mesmo com app fechado
- 🔊 Som de notificação
- 📳 Vibração (200ms, 100ms, 200ms, 100ms, 200ms)
- 🔒 Aparecem na tela bloqueada
- 🖱️ Clicável (abre modal de pagamentos do dia)
- ⏱️ Persistente (requireInteraction: true)

## 🧪 Teste Completo

### Cenário 1: Admin2 marca como PAGO
1. Faça login como **admin2@condominio.com**
2. Selecione um condomínio, bloco e apartamento
3. Marque como **PAGO**
4. ✅ Admin principal deve receber notificação

### Cenário 2: Admin Principal marca como PAGO
1. Faça login como **admin@condominio.com**
2. Selecione um condomínio, bloco e apartamento
3. Marque como **PAGO**
4. ✅ Admin2 deve receber notificação

### Cenário 3: Mesmo usuário marca como PAGO
1. Faça login como qualquer admin
2. Marque como PAGO
3. ❌ Você NÃO deve receber notificação (é você mesmo que salvou)

## 📊 Logs no Console

Quando uma notificação é enviada, você verá:
```
📬 Enviando notificação para admin@condominio.com (operador: admin2@condominio.com)
📬 Enviando notificação de pagamento...
✅ Notificação enviada via Service Worker
```

Quando você mesmo salva:
```
ℹ️ Admin principal salvou - notificação não enviada
```

## 🔧 Troubleshooting

### Notificação não aparece?

1. **Verificar permissão**
   - Abra o console (F12)
   - Digite: `Notification.permission`
   - Deve retornar: `"granted"`

2. **Verificar Service Worker**
   - Console → Application → Service Workers
   - Deve estar "activated and running"

3. **Limpar cache**
   - Ctrl + Shift + Delete
   - Limpar tudo
   - Fechar e abrir navegador

4. **Testar notificação simples**
   - Acesse: `https://gestaodoscondominios.web.app/teste-notificacao-simples.html`
   - Clique em "📤 Enviar Notificação com Som e Vibração"
   - Se funcionar, o problema é na lógica do app

## ✅ Próximos Passos

1. ✅ Acesse `criar-admin2.html` e crie o usuário
2. ✅ Teste login com as credenciais
3. ✅ Faça login no sistema principal com admin2
4. ✅ Teste as notificações entre os dois admins
5. ✅ Verifique se aparecem na tela bloqueada do celular

---

**Versão Atual:** v112  
**Data:** 03/02/2026  
**Status:** ✅ Pronto para uso
